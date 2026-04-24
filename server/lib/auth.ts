import 'dotenv/config';
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma.js";
import { sendEmail } from "./email.js";

const trustedOrigins= process.env.TRUSTED_ORIGINS?.split(',') || [];

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", 
    }),
  emailAndPassword: { 
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4f46e5;">Welcome to AI Website Builder!</h1>
            <p>Please verify your email address to get started.</p>
            <a href="${url}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
      });
    },
  },
  user:{
    deleteUser:{enabled:true},
  },
  trustedOrigins,
  baseURL:process.env.BETTER_AUTH_URL!,
  secret:process.env.BETTER_AUTH_SECRET!,
  advanced:{
    basePath: "/api/auth",
    cookies :{
      session_token:{
        name:'auth_session',
        attributes:{
          httpOnly:true,
          secure:process.env.NODE_ENV==='production',
          sameSite :process.env.NODE_ENV==='production' ? 'None':'Lax',
        }
      }
    }
  }
});