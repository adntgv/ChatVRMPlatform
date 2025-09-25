import { reduceTalkStyle } from "@/utils/reduceTalkStyle";
import { koeiromapV0 } from "../koeiromap/koeiromap";
import { TalkStyle } from "../messages/messages";
import { AppError, ErrorType, ErrorSeverity, errorHandler, handleApiError } from "@/lib/errorHandler";

export async function synthesizeVoice(
  message: string,
  speakerX: number,
  speakerY: number,
  style: TalkStyle
) {
  try {
    const koeiroRes = await koeiromapV0(message, speakerX, speakerY, style);
    
    if (!koeiroRes || !koeiroRes.audio) {
      throw new AppError(
        'Invalid response from Koeiromap',
        ErrorType.AUDIO,
        ErrorSeverity.MEDIUM,
        {
          context: {
            component: 'synthesizeVoice',
            action: 'koeiromapV0',
            metadata: { message: message.substring(0, 50), style }
          },
          userMessage: '音声合成に失敗しました。'
        }
      );
    }
    
    return { audio: koeiroRes.audio };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    
    const appError = new AppError(
      `Voice synthesis failed: ${error.message}`,
      ErrorType.AUDIO,
      ErrorSeverity.MEDIUM,
      {
        originalError: error,
        context: {
          component: 'synthesizeVoice',
          action: 'koeiromapV0',
          metadata: { 
            message: message.substring(0, 50),
            speakerX,
            speakerY,
            style
          }
        },
        userMessage: '音声の生成中にエラーが発生しました。'
      }
    );
    errorHandler.handle(appError);
    throw appError;
  }
}

export async function synthesizeVoiceApi(
  message: string,
  speakerX: number,
  speakerY: number,
  style: TalkStyle,
  apiKey: string
) {
  try {
    // Free向けに感情を制限する
    const reducedStyle = reduceTalkStyle(style);

    const body = {
      message: message,
      speakerX: speakerX,
      speakerY: speakerY,
      style: reducedStyle,
      apiKey: apiKey,
    };

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new AppError(
        `TTS API error: ${errorData.error || res.statusText}`,
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        {
          context: {
            component: 'synthesizeVoiceApi',
            action: 'fetch_tts',
            metadata: { 
              status: res.status,
              statusText: res.statusText,
              message: message.substring(0, 50)
            }
          },
          userMessage: errorData.error || '音声合成APIでエラーが発生しました。'
        }
      );
    }
    
    const data = await res.json();
    
    if (!data || !data.audio) {
      throw new AppError(
        'Invalid TTS API response',
        ErrorType.API,
        ErrorSeverity.MEDIUM,
        {
          context: {
            component: 'synthesizeVoiceApi',
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
      errorHandler.handle(error);
      throw error;
    }
    
    const appError = handleApiError(error, 'TTS', {
      component: 'synthesizeVoiceApi',
      action: 'synthesize',
      metadata: {
        message: message.substring(0, 50),
        hasApiKey: !!apiKey
      }
    });
    throw appError;
  }
}
