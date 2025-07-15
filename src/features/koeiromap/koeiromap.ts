import { config } from "@/config";
import { TalkStyle } from "../messages/messages";
import { AppError, ErrorType, ErrorSeverity } from "@/lib/errorHandler";

export async function koeiromapV0(
  message: string,
  speakerX: number,
  speakerY: number,
  style: TalkStyle
) {
  try {
    const param = {
      method: "POST",
      body: JSON.stringify({
        text: message,
        speaker_x: speakerX,
        speaker_y: speakerY,
        style: style,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    };

    const koeiroRes = await fetch(
      config.api.koeiromapCttseUrl,
      param
    );

    if (!koeiroRes.ok) {
      throw new AppError(
        `Koeiromap API error: ${koeiroRes.statusText}`,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        {
          context: {
            component: 'koeiromapV0',
            action: 'fetch',
            metadata: {
              status: koeiroRes.status,
              statusText: koeiroRes.statusText,
              message: message.substring(0, 50)
            }
          },
          userMessage: 'Koeiromap APIでエラーが発生しました。'
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
            component: 'koeiromapV0',
            action: 'parse_response',
            metadata: { hasData: !!data, hasAudio: !!data?.audio }
          },
          userMessage: '音声データが正しく取得できませんでした。'
        }
      );
    }

    return { audio: data.audio };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      `Koeiromap V0 failed: ${error.message}`,
      ErrorType.API,
      ErrorSeverity.MEDIUM,
      {
        originalError: error,
        context: {
          component: 'koeiromapV0',
          action: 'process',
          metadata: { message: message.substring(0, 50), style }
        },
        userMessage: 'Koeiromap APIの呼び出しに失敗しました。'
      }
    );
  }
}

export async function koeiromapFreeV1(
  message: string,
  speakerX: number,
  speakerY: number,
  style: "talk" | "happy" | "sad",
  apiKey: string
) {
  try {
    // Request body
    const body = {
      text: message,
      speaker_x: speakerX,
      speaker_y: speakerY,
      style: style,
      output_format: "mp3",
    };

    const koeiroRes = await fetch(
      config.api.koeiromapUrl,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Ocp-Apim-Subscription-Key": apiKey,
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
            component: 'koeiromapFreeV1',
            action: 'fetch',
            metadata: {
              status: koeiroRes.status,
              statusText: koeiroRes.statusText,
              message: message.substring(0, 50),
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
            component: 'koeiromapFreeV1',
            action: 'parse_response',
            metadata: { hasData: !!data, hasAudio: !!data?.audio }
          },
          userMessage: '音声データが正しく取得できませんでした。'
        }
      );
    }

    return { audio: data.audio };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      `Koeiromap Free V1 failed: ${error.message}`,
      ErrorType.API,
      ErrorSeverity.MEDIUM,
      {
        originalError: error,
        context: {
          component: 'koeiromapFreeV1',
          action: 'process',
          metadata: { 
            message: message.substring(0, 50), 
            style,
            hasApiKey: !!apiKey
          }
        },
        userMessage: 'Koeiromap APIの呼び出しに失敗しました。'
      }
    );
  }
}
