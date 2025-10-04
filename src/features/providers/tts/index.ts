import { TTSProvider, TTSProviderConfig } from "./types";
import { KoeiromapProvider } from "./koeiromap";

/**
 * Factory for creating TTS provider instances
 */
export class TTSProviderFactory {
  private static providers: Map<string, TTSProvider> = new Map();

  static {
    // Register default providers
    this.registerProvider('koeiromap', new KoeiromapProvider());
  }

  /**
   * Register a new TTS provider
   */
  static registerProvider(name: string, provider: TTSProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Get a provider instance by name
   */
  static getProvider(config: TTSProviderConfig): TTSProvider {
    const provider = this.providers.get(config.provider);

    if (!provider) {
      throw new Error(`TTS provider '${config.provider}' not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
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
export { KoeiromapProvider } from "./koeiromap";
