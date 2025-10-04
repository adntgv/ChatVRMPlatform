import { LLMProvider, LLMProviderConfig } from "./types";
import { OpenAIProvider } from "./openai";

/**
 * Factory for creating LLM provider instances
 */
export class LLMProviderFactory {
  private static providers: Map<string, LLMProvider> = new Map();

  static {
    // Register default providers
    this.registerProvider('openai', new OpenAIProvider());
  }

  /**
   * Register a new LLM provider
   */
  static registerProvider(name: string, provider: LLMProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Get a provider instance by name
   */
  static getProvider(config: LLMProviderConfig): LLMProvider {
    const provider = this.providers.get(config.provider);

    if (!provider) {
      throw new Error(`LLM provider '${config.provider}' not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    return provider;
  }

  /**
   * Get list of available providers
   */
  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Export types and providers
export * from "./types";
export { OpenAIProvider } from "./openai";
