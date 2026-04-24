import OpenAI from 'openai';
import 'dotenv/config';

// 1. Groq Client
export const groqClient = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || '',
});

// 2. Together AI Client
export const togetherClient = new OpenAI({
  baseURL: "https://api.together.xyz/v1",
  apiKey: process.env.TOGETHER_API_KEY || '',
});

// 3. OpenRouter Client (Fallback)
export const openrouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.AI_API_KEY || '',
});

// For backward compatibility if needed, though we will use generateWithFallback
export default openrouterClient;