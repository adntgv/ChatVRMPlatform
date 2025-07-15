import { koeiromapFreeV1 } from "@/features/koeiromap/koeiromap";
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

    const { message, speakerX, speakerY, style, apiKey } = req.body;

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

    if (message.length > 1000) {
      return res.status(400).json({ 
        error: "Message is too long. Maximum 1000 characters allowed." 
      });
    }

    // Validate speaker coordinates
    if (speakerX !== undefined && (typeof speakerX !== 'number' || speakerX < -3 || speakerX > 3)) {
      return res.status(400).json({ 
        error: "speakerX must be a number between -3 and 3." 
      });
    }

    if (speakerY !== undefined && (typeof speakerY !== 'number' || speakerY < -3 || speakerY > 3)) {
      return res.status(400).json({ 
        error: "speakerY must be a number between -3 and 3." 
      });
    }

    // Validate style
    const validStyles = ['talk', 'happy', 'sad', 'angry', 'fear', 'surprised'];
    if (style && !validStyles.includes(style)) {
      return res.status(400).json({ 
        error: `Invalid style. Must be one of: ${validStyles.join(', ')}` 
      });
    }

    try {
      // Set timeout for TTS request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

      // Make TTS request
      const voice = await Promise.race([
        koeiromapFreeV1(
          message,
          speakerX,
          speakerY,
          style,
          apiKey
        ),
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
          "Invalid response from Koeiromap API",
          ErrorType.API,
          ErrorSeverity.MEDIUM,
          {
            context: { 
              component: "api/tts", 
              action: "koeiromap_response",
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
        const errorMessage = ttsError.response.data?.error || "Koeiromap API error";

        switch (status) {
          case 401:
            return res.status(401).json({ 
              error: "Invalid Koeiromap API key." 
            });
          case 429:
            return res.status(429).json({ 
              error: "Rate limit exceeded. Please wait before trying again." 
            });
          case 503:
            return res.status(503).json({ 
              error: "Koeiromap service is temporarily unavailable." 
            });
          default:
            return res.status(status).json({ 
              error: errorMessage 
            });
        }
      }

      // Handle network errors
      if (ttsError.code === 'ECONNREFUSED' || ttsError.code === 'ENOTFOUND') {
        return res.status(503).json({ 
          error: "Cannot connect to Koeiromap API. Please check your internet connection." 
        });
      }

      // Re-throw for general error handler
      throw ttsError;
    }

  } catch (error: any) {
    // Log error for monitoring
    const appError = error instanceof AppError ? error : new AppError(
      error.message || "Unknown error in TTS API",
      ErrorType.AUDIO,
      ErrorSeverity.HIGH,
      {
        originalError: error,
        context: { 
          component: "api/tts", 
          action: "handler",
          metadata: {
            method: req.method,
            url: req.url,
            messageLength: req.body.message?.length,
            hasApiKey: !!req.body.apiKey,
            style: req.body.style
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
