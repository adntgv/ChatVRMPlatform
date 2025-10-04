import { Message } from "@/features/messages/messages";

/**
 * LLM Provider interface for abstracting different language model providers
 */
export interface LLMProvider {
  /**
   * Provider name for identification
   */
  name: string;

  /**
   * Get a chat response (non-streaming)
   */
  getChatResponse(messages: Message[], apiKey: string, options?: LLMOptions): Promise<LLMResponse>;

  /**
   * Get a streaming chat response
   */
  getChatResponseStream(messages: Message[], apiKey: string, options?: LLMOptions): Promise<ReadableStream>;
}

/**
 * Configuration options for LLM requests
 */
export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

/**
 * Standard response format from LLM providers
 */
export interface LLMResponse {
  message: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Provider configuration for instance-specific settings
 */
export interface LLMProviderConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey?: string;
  options?: LLMOptions;
}
