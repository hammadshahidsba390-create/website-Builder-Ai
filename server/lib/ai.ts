import { groqClient, togetherClient, openrouterClient } from '../configs/openai.js';

// Define the fallback chain: Native Groq -> Native Together -> OpenRouter
const FALLBACK_CHAIN = [
  {
    provider: 'Groq',
    client: groqClient,
    model: 'llama-3.3-70b-versatile',
  },
  {
    provider: 'Together',
    client: togetherClient,
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  {
    provider: 'OpenRouter',
    client: openrouterClient,
    model: 'meta-llama/llama-3.3-70b-instruct:free',
  },
  {
    provider: 'OpenRouter',
    client: openrouterClient,
    model: 'qwen/qwen3-coder:free',
  }
];

/**
 * Attempts to generate a completion using a prioritized list of native AI providers.
 * Priority: Groq -> Together AI -> OpenRouter
 */
export const generateWithFallback = async (messages: any[], systemInstruction?: string) => {
  let lastError = null;

  for (const attempt of FALLBACK_CHAIN) {
    // Skip if API key is completely missing for this provider
    if (!attempt.client.apiKey || attempt.client.apiKey === '') {
      console.log(`[AI] Skipping ${attempt.provider} (${attempt.model}): No API Key provided.`);
      continue;
    }

    try {
      console.log(`[AI] Attempting generation with ${attempt.provider} (Model: ${attempt.model})`);
      
      const response = await attempt.client.chat.completions.create({
        model: attempt.model,
        messages: messages,
      });

      if (response && response.choices && response.choices.length > 0) {
        console.log(`[AI] Success with ${attempt.provider} (${attempt.model})!`);
        return response;
      }

    } catch (error: any) {
      console.log(`[AI] ${attempt.provider} (${attempt.model}) failed: ${error.message || error.code}`);
      lastError = error;
      // Continue to the next provider/model in the loop
    }
  }

  // If we exhaust all models across all providers, throw the last error
  throw lastError || new Error("All AI providers and fallback models failed.");
};
