import { AppError, ErrorType, ErrorSeverity } from "@/lib/errorHandler";
import { TTSProvider, TTSOptions, TTSResponse, ElevenLabsVoiceSettings } from "./types";

/**
 * ElevenLabs TTS Provider
 * Provides high-quality text-to-speech using ElevenLabs API
 */
export class ElevenLabsProvider implements TTSProvider {
  name = "ElevenLabs";
  private baseUrl = "https://api.elevenlabs.io/v1";

  // Default voice ID (Adam - male voice)
  private defaultVoiceId = "pNInz6obpgDQGcFmaJgB";

  // Default model (multilingual, stable)
  private defaultModel = "eleven_multilingual_v2";

  async synthesize(text: string, options: TTSOptions): Promise<TTSResponse> {
    const {
      voice = {},
      apiKey,
      format = 'mp3',
      elevenlabsSettings
    } = options;

    const { voiceId = this.defaultVoiceId } = voice;

    if (!apiKey) {
      throw new AppError(
        'ElevenLabs API key is required',
        ErrorType.CONFIG,
        ErrorSeverity.HIGH,
        {
          context: {
            component: 'ElevenLabsProvider',
            action: 'synthesize',
            metadata: { hasApiKey: false }
          },
          userMessage: 'ElevenLabs APIキーが設定されていません。'
        }
      );
    }

    try {
      // Prepare voice settings
      const voiceSettings: ElevenLabsVoiceSettings = {
        stability: elevenlabsSettings?.stability ?? 0.5,
        similarity_boost: elevenlabsSettings?.similarity_boost ?? 0.75,
        style: elevenlabsSettings?.style ?? 0,
        use_speaker_boost: elevenlabsSettings?.use_speaker_boost ?? true,
      };

      // Prepare request body
      const requestBody = {
        text,
        model_id: this.defaultModel,
        voice_settings: voiceSettings,
      };

      // Make request to ElevenLabs API
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}?optimize_streaming_latency=3&output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific error codes
        if (response.status === 401) {
          throw new AppError(
            'Invalid ElevenLabs API key',
            ErrorType.AUTH,
            ErrorSeverity.HIGH,
            {
              context: {
                component: 'ElevenLabsProvider',
                action: 'synthesize',
                metadata: { status: 401 }
              },
              userMessage: 'ElevenLabs APIキーが無効です。設定を確認してください。'
            }
          );
        }

        if (response.status === 429) {
          throw new AppError(
            'ElevenLabs rate limit exceeded',
            ErrorType.API,
            ErrorSeverity.MEDIUM,
            {
              context: {
                component: 'ElevenLabsProvider',
                action: 'synthesize',
                metadata: { status: 429 }
              },
              userMessage: 'ElevenLabs APIのレート制限に達しました。しばらく待ってから再試行してください。'
            }
          );
        }

        throw new AppError(
          `ElevenLabs API error: ${errorData.detail?.message || response.statusText}`,
          ErrorType.API,
          ErrorSeverity.MEDIUM,
          {
            context: {
              component: 'ElevenLabsProvider',
              action: 'synthesize',
              metadata: {
                status: response.status,
                statusText: response.statusText,
                message: text.substring(0, 50),
                voiceId
              }
            },
            userMessage: 'ElevenLabs APIでエラーが発生しました。'
          }
        );
      }

      // Get audio as array buffer
      const audioBuffer = await response.arrayBuffer();

      // Convert to base64
      const base64Audio = Buffer.from(audioBuffer).toString('base64');

      return {
        audio: base64Audio,
        format: 'mp3',
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `ElevenLabs synthesis failed: ${error.message}`,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        {
          originalError: error,
          context: {
            component: 'ElevenLabsProvider',
            action: 'synthesize',
            metadata: {
              message: text.substring(0, 50),
              hasApiKey: !!apiKey,
              voiceId
            }
          },
          userMessage: 'ElevenLabs APIの呼び出しに失敗しました。'
        }
      );
    }
  }

  /**
   * Get list of available voices for a given API key
   */
  async getVoices(apiKey: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          "xi-api-key": apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error: any) {
      throw new AppError(
        `Failed to get ElevenLabs voices: ${error.message}`,
        ErrorType.API,
        ErrorSeverity.LOW,
        {
          originalError: error,
          context: {
            component: 'ElevenLabsProvider',
            action: 'getVoices',
          }
        }
      );
    }
  }
}
