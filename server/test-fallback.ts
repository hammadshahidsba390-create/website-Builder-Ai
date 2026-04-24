import 'dotenv/config';
import { generateWithFallback } from './lib/ai.js';

async function testFallback() {
    console.log("=== Testing AI Fallback Mechanism ===");
    console.log(`Primary Model in .env: ${process.env.AI_MODEL || 'Not set'}`);
    
    try {
        const response = await generateWithFallback([
            { role: 'user', content: 'Say "Fallback system is working!"' }
        ]);
        
        console.log("\n=== Generation Successful! ===");
        console.log("Model that succeeded:", response.model);
        console.log("Response:", response.choices[0].message.content);
    } catch (error: any) {
        console.error("\n=== All Models Failed ===");
        console.error(error.message);
    }
}

testFallback();
