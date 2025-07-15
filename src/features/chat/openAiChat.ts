import { Configuration, OpenAIApi } from "openai";
import { config } from "@/config";
import { Message } from "../messages/messages";
import { logger } from "@/lib/logger";

export async function getChatResponse(messages: Message[], apiKey: string) {
  const context = { component: 'OpenAIChat', action: 'getChatResponse' };
  
  if (!apiKey) {
    logger.error("Invalid API Key provided", context);
    throw new Error("Invalid API Key");
  }

  logger.info(`Chat request with ${messages.length} messages`, context);

  const configuration = new Configuration({
    apiKey: apiKey,
  });
  // ブラウザからAPIを叩くときに発生するエラーを無くすworkaround
  // https://github.com/openai/openai-node/issues/6#issuecomment-1492814621
  delete configuration.baseOptions.headers["User-Agent"];

  const openai = new OpenAIApi(configuration);

  try {
    const startTime = performance.now();
    const { data } = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    const duration = performance.now() - startTime;
    const [aiRes] = data.choices;
    const message = aiRes.message?.content || "エラーが発生しました";
    
    logger.info(`Chat response received (${duration.toFixed(2)}ms)`, context, {
      messageLength: message.length,
      duration
    });

    return { message: message };
  } catch (error) {
    logger.error("Chat response failed", context, undefined, error as Error);
    throw error;
  }
}

export async function getChatResponseStream(
  messages: Message[],
  apiKey: string
) {
  const context = { component: 'OpenAIChat', action: 'getChatResponseStream' };
  
  if (!apiKey) {
    logger.error("Invalid API Key provided for streaming", context);
    throw new Error("Invalid API Key");
  }

  logger.info(`Streaming chat request with ${messages.length} messages`, context);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  
  const startTime = performance.now();
  logger.logApiRequest("POST", config.api.openAiUrl, context);
  
  const res = await fetch(config.api.openAiUrl, {
    headers: headers,
    method: "POST",
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages,
      stream: true,
      max_tokens: 200,
    }),
  });

  const requestDuration = performance.now() - startTime;
  logger.logApiResponse("POST", config.api.openAiUrl, res.status, requestDuration, context);

  const reader = res.body?.getReader();
  if (res.status !== 200 || !reader) {
    logger.error(`Streaming request failed with status ${res.status}`, context);
    throw new Error("Something went wrong");
  }

  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      const decoder = new TextDecoder("utf-8");
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const data = decoder.decode(value);
          const chunks = data
            .split("data:")
            .filter((val) => !!val && val.trim() !== "[DONE]");
          for (const chunk of chunks) {
            const json = JSON.parse(chunk);
            const messagePiece = json.choices[0].delta.content;
            if (!!messagePiece) {
              controller.enqueue(messagePiece);
            }
          }
        }
      } catch (error) {
        logger.error("Streaming response processing failed", context, undefined, error as Error);
        controller.error(error);
      } finally {
        reader.releaseLock();
        controller.close();
        logger.debug("Streaming response completed", context);
      }
    },
  });

  return stream;
}
