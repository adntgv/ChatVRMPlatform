/**
 * @deprecated Use LLMProviderFactory with OpenAIProvider instead
 * This file is kept for backward compatibility
 */
import { Message } from "../messages/messages";
import { LLMProviderFactory } from "../providers/llm";

export async function getChatResponse(messages: Message[], apiKey: string) {
  const provider = LLMProviderFactory.getProvider({ provider: 'openai' });
  const response = await provider.getChatResponse(messages, apiKey);
  return { message: response.message };
}

export async function getChatResponseStream(
  messages: Message[],
  apiKey: string
) {
  const provider = LLMProviderFactory.getProvider({ provider: 'openai' });
  return provider.getChatResponseStream(messages, apiKey);
}
