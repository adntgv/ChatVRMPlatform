import { config } from "@/config";
import { TalkStyle } from "@/features/messages/messages";
import { AppError, ErrorType, ErrorSeverity } from "@/lib/errorHandler";
import { TTSProvider, TTSOptions, TTSResponse } from "./types";

export class KoeiromapProvider implements TTSProvider {
  name = "Koeiromap";

  async synthesize(text: string, options: TTSOptions): Promise<TTSResponse> {
    const { voice = {}, style = 'talk', apiKey, format = 'mp3' } = options;
    const { speakerX = 0, speakerY = 0 } = voice;

    try {
      // Request body
      const body = {
        text,
        speaker_x: speakerX,
        speaker_y: speakerY,
        style: style as TalkStyle,
        output_format: format,
      };

      const koeiroRes = await fetch(
        config.api.koeiromapUrl,
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            ...(apiKey ? { "Ocp-Apim-Subscription-Key": apiKey } : {}),
          },
        }
      );

      if (!koeiroRes.ok) {
        const errorData = await koeiroRes.json().catch(() => ({}));
        throw new AppError(
          `Koeiromap API error: ${errorData.error || koeiroRes.statusText}`,
          ErrorType.API,
          ErrorSeverity.MEDIUM,
          {
            context: {
              component: 'KoeiromapProvider',
              action: 'synthesize',
              metadata: {
                status: koeiroRes.status,
                statusText: koeiroRes.statusText,
                message: text.substring(0, 50),
                hasApiKey: !!apiKey
              }
            },
            userMessage: koeiroRes.status === 401
              ? 'Koeiromap APIキーが無効です。'
              : 'Koeiromap APIでエラーが発生しました。'
          }
        );
      }

      const data = await koeiroRes.json();

      if (!data || !data.audio) {
        throw new AppError(
          'Invalid Koeiromap response',
          ErrorType.API,
          ErrorSeverity.MEDIUM,
          {
            context: {
              component: 'KoeiromapProvider',
              action: 'parse_response',
              metadata: { hasData: !!data, hasAudio: !!data?.audio }
            },
            userMessage: '音声データが正しく取得できませんでした。'
          }
        );
      }

      return {
        audio: data.audio,
        format,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `Koeiromap synthesis failed: ${error.message}`,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        {
          originalError: error,
          context: {
            component: 'KoeiromapProvider',
            action: 'synthesize',
            metadata: {
              message: text.substring(0, 50),
              style,
              hasApiKey: !!apiKey
            }
          },
          userMessage: 'Koeiromap APIの呼び出しに失敗しました。'
        }
      );
    }
  }
}
