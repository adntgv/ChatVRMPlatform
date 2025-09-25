import { Configuration, OpenAIApi } from "openai";
import type { NextApiRequest, NextApiResponse } from "next";
import { AppError, ErrorType, ErrorSeverity, errorHandler } from "@/lib/errorHandler";

type Data = {
  message?: string;
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
    if (!req.body || !req.body.messages) {
      return res.status(400).json({ 
        error: "Invalid request body. Messages array is required." 
      });
    }

    if (!Array.isArray(req.body.messages) || req.body.messages.length === 0) {
      return res.status(400).json({ 
        error: "Messages must be a non-empty array." 
      });
    }

    // Get API key
    const apiKey = req.body.apiKey || process.env.OPEN_AI_KEY;

    if (!apiKey) {
      return res.status(400).json({ 
        error: "API key is required. Please provide an API key or configure OPEN_AI_KEY environment variable." 
      });
    }

    // Configure OpenAI
    const configuration = new Configuration({
      apiKey: apiKey,
    });

    const openai = new OpenAIApi(configuration);

    try {
      // Make API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await openai.createChatCompletion({
        model: req.body.model || "gpt-3.5-turbo",
        messages: req.body.messages,
        temperature: req.body.temperature,
        max_tokens: req.body.max_tokens,
        stream: req.body.stream || false,
      }, {
        signal: controller.signal as any
      });

      clearTimeout(timeoutId);

      const { data } = response;

      if (!data.choices || data.choices.length === 0) {
        throw new AppError(
          "No response from OpenAI",
          ErrorType.API,
          ErrorSeverity.MEDIUM,
          {
            context: { component: "api/chat", action: "openai_response" }
          }
        );
      }

      const [aiRes] = data.choices;
      const message = aiRes.message?.content;

      if (!message) {
        throw new AppError(
          "Empty response from OpenAI",
          ErrorType.API,
          ErrorSeverity.MEDIUM,
          {
            context: { component: "api/chat", action: "openai_response" }
          }
        );
      }

      res.status(200).json({ message });

    } catch (openAIError: any) {
      // Handle OpenAI specific errors
      if (openAIError.response) {
        const status = openAIError.response.status;
        const errorMessage = openAIError.response.data?.error?.message || "OpenAI API error";

        // Handle specific OpenAI error codes
        switch (status) {
          case 401:
            return res.status(401).json({ 
              error: "Invalid API key. Please check your OpenAI API key." 
            });
          case 429:
            return res.status(429).json({ 
              error: "Rate limit exceeded. Please try again later." 
            });
          case 500:
          case 502:
          case 503:
            return res.status(503).json({ 
              error: "OpenAI service is temporarily unavailable. Please try again later." 
            });
          default:
            return res.status(status).json({ 
              error: errorMessage 
            });
        }
      }

      // Handle timeout
      if (openAIError.name === 'AbortError') {
        return res.status(504).json({ 
          error: "Request timeout. The OpenAI API took too long to respond." 
        });
      }

      // Handle network errors
      if (openAIError.code === 'ECONNREFUSED' || openAIError.code === 'ENOTFOUND') {
        return res.status(503).json({ 
          error: "Cannot connect to OpenAI API. Please check your internet connection." 
        });
      }

      // Re-throw for general error handler
      throw openAIError;
    }

  } catch (error: any) {
    // Log error for monitoring
    const appError = error instanceof AppError ? error : new AppError(
      error.message || "Unknown error in chat API",
      ErrorType.API,
      ErrorSeverity.HIGH,
      {
        originalError: error,
        context: { 
          component: "api/chat", 
          action: "handler",
          metadata: {
            method: req.method,
            url: req.url,
            hasApiKey: !!req.body.apiKey,
            messageCount: req.body.messages?.length
          }
        }
      }
    );

    errorHandler.handle(appError);

    // Return generic error to client
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : "An error occurred while processing your request. Please try again." 
    });
  }
}
