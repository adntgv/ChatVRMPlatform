import { TalkStyle } from "@/features/messages/messages";

/**
 * TTS Provider interface for abstracting different text-to-speech providers
 */
export interface TTSProvider {
  /**
   * Provider name for identification
   */
  name: string;

  /**
   * Synthesize speech from text
   */
  synthesize(text: string, options: TTSOptions): Promise<TTSResponse>;
}

/**
 * Configuration options for TTS requests
 */
export interface TTSOptions {
  /** Voice parameters (provider-specific) */
  voice?: {
    speakerX?: number;
    speakerY?: number;
    voiceId?: string;
    language?: string;
    gender?: 'male' | 'female' | 'neutral';
  };

  /** Speaking style/emotion */
  style?: TalkStyle | string;

  /** API key for the provider */
  apiKey?: string;

  /** Output format */
  format?: 'mp3' | 'wav' | 'ogg';

  /** Additional provider-specific options */
  [key: string]: any;
}

/**
 * Standard response format from TTS providers
 */
export interface TTSResponse {
  /** Base64 encoded audio data */
  audio: string;

  /** Audio format */
  format?: string;

  /** Duration in seconds (optional) */
  duration?: number;
}

/**
 * Provider configuration for instance-specific settings
 */
export interface TTSProviderConfig {
  provider: 'koeiromap' | 'elevenlabs' | 'google' | 'azure' | 'openai' | 'custom';
  apiKey?: string;
  defaultOptions?: TTSOptions;
}

/**
 * ElevenLabs-specific voice settings
 */
export interface ElevenLabsVoiceSettings {
  stability?: number; // 0-1, controls consistency
  similarity_boost?: number; // 0-1, controls how similar to the original voice
  style?: number; // 0-1, controls style exaggeration
  use_speaker_boost?: boolean; // Boost speaker similarity
}
