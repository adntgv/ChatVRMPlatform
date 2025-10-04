/**
 * @deprecated Use TTSProviderFactory with KoeiromapProvider instead
 * This file is kept for backward compatibility
 */
import { TalkStyle } from "../messages/messages";
import { TTSProviderFactory } from "../providers/tts";

export async function koeiromapV0(
  message: string,
  speakerX: number,
  speakerY: number,
  style: TalkStyle
) {
  const provider = TTSProviderFactory.getProvider({ provider: 'koeiromap' });
  return provider.synthesize(message, {
    voice: { speakerX, speakerY },
    style,
  });
}

export async function koeiromapFreeV1(
  message: string,
  speakerX: number,
  speakerY: number,
  style: "talk" | "happy" | "sad",
  apiKey: string
) {
  const provider = TTSProviderFactory.getProvider({ provider: 'koeiromap' });
  return provider.synthesize(message, {
    voice: { speakerX, speakerY },
    style,
    apiKey,
    format: 'mp3',
  });
}
