import { TTSProviderFactory } from "@/features/providers/tts";
import type { NextApiRequest, NextApiResponse } from "next";
import { AppError, ErrorType, ErrorSeverity, errorHandler } from "@/lib/errorHandler";

type Data = {
  audio?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    // Validate HTTP method
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed. Use POST."
      });
    }

    // Validate request body
    if (!req.body) {
      return res.status(400).json({
        error: "Request body is required."
      });
    }

    const { message, voiceId, apiKey, voiceSettings } = req.body;

    // Validate required parameters
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: "Message is required and must be a string."
      });
    }

    if (message.length === 0) {
      return res.status(400).json({
        error: "Message cannot be empty."
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        error: "Message is too long. Maximum 5000 characters allowed."
      });
    }

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({
        error: "API key is required."
      });
    }

    // Validate voiceId if provided
    if (voiceId && typeof voiceId !== 'string') {
      return res.status(400).json({
        error: "VoiceId must be a string."
      });
    }

    try {
      // Set timeout for TTS request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Get ElevenLabs provider
      const provider = TTSProviderFactory.getProvider({ provider: 'elevenlabs' });

      // Make TTS request
      const voice = await Promise.race([
        provider.synthesize(message, {
          voice: { voiceId },
          apiKey,
          elevenlabsSettings: voiceSettings,
        }),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('TTS request timeout'));
          });
        })
      ]);

      clearTimeout(timeoutId);

      // Validate response
      if (!voice || !voice.audio) {
        throw new AppError(
          "Invalid response from ElevenLabs API",
          ErrorType.API,
          ErrorSeverity.MEDIUM,
          {
            context: {
              component: "api/elevenlabs-tts",
              action: "elevenlabs_response",
              metadata: { hasAudio: !!voice?.audio }
            }
          }
        );
      }

      res.status(200).json(voice);

    } catch (ttsError: any) {
      // Handle specific TTS errors
      if (ttsError.message === 'TTS request timeout') {
        return res.status(504).json({
          error: "Text-to-speech request timed out. Please try again."
        });
      }

      // Handle API errors
      if (ttsError.response) {
        const status = ttsError.response.status || 500;
        const errorMessage = ttsError.response.data?.error || "ElevenLabs API error";

        switch (status) {
          case 401:
            return res.status(401).json({
              error: "Invalid ElevenLabs API key."
            });
          case 429:
            return res.status(429).json({
              error: "Rate limit exceeded. Please wait before trying again."
            });
          case 503:
            return res.status(503).json({
              error: "ElevenLabs service is temporarily unavailable."
            });
          default:
            return res.status(status).json({
              error: errorMessage
            });
        }
      }

      // Handle AppError instances
      if (ttsError instanceof AppError) {
        const statusCode = ttsError.type === ErrorType.AUTH ? 401 :
                          ttsError.type === ErrorType.API ? 503 : 500;
        return res.status(statusCode).json({
          error: ttsError.userMessage || ttsError.message
        });
      }

      // Handle network errors
      if (ttsError.code === 'ECONNREFUSED' || ttsError.code === 'ENOTFOUND') {
        return res.status(503).json({
          error: "Cannot connect to ElevenLabs API. Please check your internet connection."
        });
      }

      // Re-throw for general error handler
      throw ttsError;
    }

  } catch (error: any) {
    // Log error for monitoring
    const appError = error instanceof AppError ? error : new AppError(
      error.message || "Unknown error in ElevenLabs TTS API",
      ErrorType.AUDIO,
      ErrorSeverity.HIGH,
      {
        originalError: error,
        context: {
          component: "api/elevenlabs-tts",
          action: "handler",
          metadata: {
            method: req.method,
            url: req.url,
            messageLength: req.body.message?.length,
            hasApiKey: !!req.body.apiKey,
            voiceId: req.body.voiceId
          }
        }
      }
    );

    errorHandler.handle(appError);

    // Return generic error to client
    res.status(500).json({
      error: process.env.NODE_ENV === 'development'
        ? error.message
        : "An error occurred while generating speech. Please try again."
    });
  }
}
