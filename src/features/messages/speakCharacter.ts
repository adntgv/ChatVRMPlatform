import { config } from "@/config";
import { wait } from "@/utils/wait";
import { synthesizeVoiceApi } from "./synthesizeVoice";
import { Viewer } from "../vrmViewer/viewer";
import { Screenplay } from "./messages";
import { Talk } from "./messages";
import { AppError, ErrorType, ErrorSeverity, errorHandler } from "@/lib/errorHandler";

const createSpeakCharacter = () => {
  let lastTime = 0;
  let prevFetchPromise: Promise<unknown> = Promise.resolve();
  let prevSpeakPromise: Promise<unknown> = Promise.resolve();

  return (
    screenplay: Screenplay,
    viewer: Viewer,
    koeiroApiKey: string,
    onStart?: () => void,
    onComplete?: () => void
  ) => {
    const fetchPromise = prevFetchPromise.then(async () => {
      const now = Date.now();
      if (now - lastTime < config.limits.speechSynthesisRateLimitMs) {
        await wait(config.limits.speechSynthesisRateLimitMs - (now - lastTime));
      }

      const buffer = await fetchAudio(screenplay.talk, koeiroApiKey).catch(
        (error) => {
          // Error is already handled in fetchAudio
          console.error('Failed to fetch audio:', error);
          return null;
        }
      );
      lastTime = Date.now();
      return buffer;
    });

    prevFetchPromise = fetchPromise;
    prevSpeakPromise = Promise.all([fetchPromise, prevSpeakPromise]).then(
      ([audioBuffer]) => {
        onStart?.();
        if (!audioBuffer) {
          return;
        }
        return viewer.model?.speak(audioBuffer, screenplay);
      }
    );
    prevSpeakPromise.then(() => {
      onComplete?.();
    });
  };
};

export const speakCharacter = createSpeakCharacter();

export const fetchAudio = async (
  talk: Talk,
  apiKey: string
): Promise<ArrayBuffer> => {
  try {
    const ttsVoice = await synthesizeVoiceApi(
      talk.message,
      talk.speakerX,
      talk.speakerY,
      talk.style,
      apiKey
    );
    const url = ttsVoice.audio;

    if (!url) {
      throw new AppError(
        'No audio URL returned from TTS',
        ErrorType.AUDIO,
        ErrorSeverity.MEDIUM,
        {
          context: {
            component: 'fetchAudio',
            action: 'synthesizeVoiceApi',
            metadata: { message: talk.message.substring(0, 50) }
          },
          userMessage: '音声URLが取得できませんでした。'
        }
      );
    }

    const resAudio = await fetch(url);
    
    if (!resAudio.ok) {
      throw new AppError(
        `Failed to fetch audio: ${resAudio.statusText}`,
        ErrorType.AUDIO,
        ErrorSeverity.MEDIUM,
        {
          context: {
            component: 'fetchAudio',
            action: 'fetch_audio_file',
            metadata: { 
              status: resAudio.status,
              url: url.substring(0, 50)
            }
          },
          userMessage: '音声ファイルのダウンロードに失敗しました。'
        }
      );
    }
    
    const buffer = await resAudio.arrayBuffer();
    return buffer;
  } catch (error: any) {
    if (error instanceof AppError) {
      errorHandler.handle(error);
      throw error;
    }
    
    const appError = new AppError(
      `Audio fetch failed: ${error.message}`,
      ErrorType.AUDIO,
      ErrorSeverity.MEDIUM,
      {
        originalError: error,
        context: {
          component: 'fetchAudio',
          action: 'process',
          metadata: { 
            message: talk.message.substring(0, 50),
            style: talk.style
          }
        },
        userMessage: '音声の取得に失敗しました。'
      }
    );
    errorHandler.handle(appError);
    throw appError;
  }
};
