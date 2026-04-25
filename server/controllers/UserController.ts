import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import openai from '../configs/openai.js';
import { generateWithFallback } from '../lib/ai.js';
import { stripe } from '../configs/stripe.js';

// Get user credits 
export const getusercredits=async (req: Request, res: Response)=>{
    try{
        const userId=req.userId;
        if(!userId){
            return res.status(401).json({message:'Unauthorized user'})
        }
        const user=await prisma.user.findUnique({
            where:{id:userId}
        })
        res.json({credits:user?.credits})
    }catch(error:any){
        console.log(error.code|| error.message);
        res.status(500).json({message:error.code|| error.message});
    }

}

// Controller function  to create a new project 

export const createUserProject=async (req: Request, res: Response)=>{
    const userId=req.userId;
    try{
        const{initial_prompt}=req.body;
        if(!userId){
            return res.status(401).json({message:'Unauthorized user'})
        }
        const user=await prisma.user.findUnique({
            where:{id:userId}
        })

        if(user && user.credits<5){
            return res.status(403).json({message:'Insufficient credits'})
        }

        // create a new project
        const project=await prisma.websiteProject.create({
            data:{
                name:initial_prompt.length >50 ? initial_prompt.substring(0,47)
                + '...' : initial_prompt,
                initial_prompt,
                userId
            }
    })

        // UPDATE USER'S TOTAL CREATION

        await prisma.user.update({
            where:{id:userId},
            data:{totalCreation:{increment:1}}
        })

        await prisma.conversation.create({
            data:{
            role:'user',
            content:initial_prompt,
            projectId:project.id
            }
        })

        await prisma.user.update({
            where:{id:userId},
            data:{credits:{decrement:5}}
        })

        res.json({projectId:project.id})

        //Enhance user prmpt
        const promtEnhanceResponse = await generateWithFallback([
                {
                   role: "system",
            content: `
            you are a prompt enhancement specialist. Take the user's website 
            request and expand it into a detailed, comprehensive prompt that will help 
            to create the best possible website.

            enhance this prompt by:
            1. adding specific design details (layout, color scheme, typography)
            2. specifying key sections and features
            3. describing the user experience and interactions
            4. including modern web design best practices
            5. mentioning responsive design requirements
            6. adding any missing but important elements
            
                    
                    Return ONLY the enhanced prompt, nothing else.Make it detailed but
                    concise (2-3 paragraph max).`
                },
                {
                    role:'user',
                    content:initial_prompt
                }
            ]
        );

        const enhancedPrompt=promtEnhanceResponse.choices[0].message.content;
        await prisma.conversation.create({
            data:{
            role:'assistant',
            content: `I've enhanced your prompt to :"${enhancedPrompt}"`,
            projectId:project.id
            }
        })

        await prisma.conversation.create({
            data:{
            role:'assistant',
            content: `now generating your website...`,
            projectId:project.id
            }
        })

        //generate website content/code
        const codeGenerationResponse = await generateWithFallback([
                {
                    role: "system",
                    content: `
                    You are an expert web developer. Create a complete, production-ready, single-page website based on this request: "${enhancedPrompt}"

                    CRITICAL REQUIREMENTS:
                    - You MUST output valid HTML ONLY. 
                    - Use Tailwind CSS for ALL styling
                    - Include this EXACT script in the <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                    - Use Tailwind utility classes extensively for styling, animations, and responsiveness
                    - Make it fully functional and interactive with JavaScript in <script> tag before closing </body>
                    - Use modern, beautiful design with great UX using Tailwind classes
                    - Make it responsive using Tailwind responsive classes (sm:, md:, lg:, xl:)
                    - Use Tailwind animations and transitions (animate-*, transition-*)
                    - Include all necessary meta tags
                    - Use Google Fonts CDN if needed for custom fonts
                    - Use placeholder images from https://placehold.co/600x400
                    - Use Tailwind gradient classes for beautiful backgrounds
                    - Make sure all buttons, cards, and components use Tailwind styling

                    CRITICAL HARD RULES:
                    1. You MUST put ALL output ONLY into message.content.
                    2. You MUST NOT place anything in "reasoning", "analysis", "reasoning_details", or any hidden fields.
                    3. You MUST NOT include internal thoughts, explanations, analysis, comments, or markdown.
                    4. Do NOT include markdown, explanations, notes, or code fences.

                    The HTML should be complete and ready to render as-is with Tailwind CSS.`
                     },
                     {
                        role:'user',
                        content:enhancedPrompt || ""
                     }
                 ]
        );
        const code=codeGenerationResponse.choices[0].message.content ||"";

        //Create a version of the project

        const version=await prisma.version.create({
            data:{
                code: code.replace(/```[a-z]*\n?/gi, '')
                .replace(/```$/g, '')
                .trim(),
                description:'Initial version',
                projectId:project.id
            }
        })

        await prisma.conversation.create({
            data:{
            role:'assistant',
            content: "I've generated your website! You can now preview it and request any changes.",
            projectId:project.id
            }
        })

        await prisma.websiteProject.update({
            where:{id:project.id},
            data:{
                current_code:code.replace(/```[a-z]*\n?/gi, '')
                .replace(/```$/g, '')
                .trim(),
                current_version_index:version.id
            }
        })

    }catch(error:any){
        await prisma.user.update({
            where:{id:userId},
            data:{credits:{increment:5}}
        })
        console.log("Generation error:", error.code|| error.message);
        
        // If the project was already created before the crash, update the conversation
        // so the frontend stops polling and the user knows why it failed.
        if (res.headersSent) {
            try {
                // Find the project ID from the request or context
                const latestProject = await prisma.websiteProject.findFirst({
                    where: { userId },
                    orderBy: { createdAt: 'desc' }
                });
                
                if (latestProject) {
                    await prisma.conversation.create({
                        data:{
                            role:'assistant',
                            content: `Sorry, code generation failed: ${error.message || 'API Rate limit exceeded'}. Your credits have been refunded.`,
                            projectId: latestProject.id
                        }
                    });
                }
            } catch(e) {
                console.error("Failed to append error message to conversation");
            }
        } else {
            res.status(500).json({message:error.code|| error.message});
        }
    }

}

//controller function to get a single  user projects

export const getUserProject=async (req: Request, res: Response)=>{
    try{
        const userId=req.userId;
        if(!userId){
            return res.status(401).json({message:'Unauthorized user'})
        }

        const {projectId}=req.params;

        const project =await prisma.websiteProject.findUnique({
            where:{id:projectId, userId},
            include:{
                conversation:{
                    orderBy:{timestamp:'asc'}
                },
                versions:{orderBy:{timestamp:'asc'}}
            }
        })

       
        res.json({project}

        )
    }catch(error:any){
        console.log(error.code|| error.message);
        res.status(500).json({message:error.code|| error.message});
    }

}

//controller function to get all user projects

export const getUserProjects=async (req: Request, res: Response)=>{
    try{
        const userId=req.userId;
        if(!userId){
            return res.status(401).json({message:'Unauthorized user'})
        }

        const projects =await prisma.websiteProject.findMany({
            where:{userId},
            orderBy:{updatedAt:'desc'},
        })

        res.json({projects}

        )
    }catch(error:any){
        console.log(error.code|| error.message);
        res.status(500).json({message:error.code|| error.message});
    }

}

//controller function to toggle project publish/unpublish status

export const togglePublish=async (req: Request, res: Response)=>{
    try{
        const userId=req.userId;
        if(!userId){
            return res.status(401).json({message:'Unauthorized user'})
        }

        const {projectId}=req.params;

        const project =await prisma.websiteProject.findUnique({
            where:{id:projectId, userId},
        })

        if (!project){
            return res.status(404).json({message:'Project not found'})
        }

        await prisma.websiteProject.update({
            where:{id:projectId},
            data:{isPublished:!project.isPublished}
        })
       
        res.json({message:project.isPublished ? 'project Unpublished'
            :'project Published successfully'})


    }catch(error:any){
        console.log(error.code|| error.message);
        res.status(500).json({message:error.code|| error.message});
    }

}

// controller function to purchase credits
export const purchaseCredits = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { planId } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized user' });
        }

        const plans: Record<string, { price: number, credits: number, name: string }> = {
            basic: { price: 500, credits: 100, name: 'Basic Plan' },
            pro: { price: 1900, credits: 400, name: 'Pro Plan' },
            enterprise: { price: 4900, credits: 1000, name: 'Enterprise Plan' }
        };

        const selectedPlan = plans[planId];
        if (!selectedPlan) {
            return res.status(400).json({ message: 'Invalid plan selected' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: selectedPlan.name,
                            description: `${selectedPlan.credits} credits for Website AI Builder`,
                        },
                        unit_amount: selectedPlan.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.TRUSTED_ORIGINS || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.TRUSTED_ORIGINS || 'http://localhost:5173'}/pricing`,
            client_reference_id: userId,
            metadata: {
                userId,
                planId,
                credits: selectedPlan.credits
            }
        });

        res.json({ url: session.url });

    } catch (error: any) {
        console.log("Stripe Checkout Error:", error);
        res.status(500).json({ message: error.message });
    }
}

// controller function to handle Stripe webhooks
export const stripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
        return res.status(400).send('Webhook Error: No signature');
    }

    let event;

    try {
        // req.body must be the raw buffer here
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        console.log(`Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;

        // Fulfill the purchase
        const userId = session.metadata?.userId;
        const credits = parseInt(session.metadata?.credits || '0');

        if (userId && credits > 0) {
            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: { credits: { increment: credits } }
                });
                console.log(`Successfully added ${credits} credits to user ${userId}`);
            } catch (updateError) {
                console.error('Failed to update user credits:', updateError);
            }
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
}