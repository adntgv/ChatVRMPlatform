# ChatGPT Streaming Implementation Guide

## Overview
ChatVRM implements real-time streaming responses from OpenAI's ChatGPT API to provide a more responsive user experience. This guide explains the streaming architecture and implementation details.

## Architecture Overview

```
User Input → getChatResponseStream() → OpenAI Streaming API → ReadableStream
    ↓                                                              ↓
Character UI ← Sentence Extraction ← Emotion Tag Parsing ← Stream Processing
```

## Implementation Details

### Client-Side Streaming Function

Located in `/src/features/chat/openAiChat.ts`:

```typescript
export async function getChatResponseStream(
  messages: Message[],
  apiKey: string
) {
  // Direct API call to OpenAI (bypasses /api/chat endpoint)
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    method: "POST",
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages,
      stream: true,        // Enable streaming
      max_tokens: 200,     // Token limit per response
    }),
  });

  // Create ReadableStream for processing chunks
  const stream = new ReadableStream({
    async start(controller) {
      // Process incoming data chunks
    },
  });

  return stream;
}
```

### Stream Processing Flow

1. **Chunk Reception**: Data arrives as Server-Sent Events (SSE)
2. **Data Parsing**: Each chunk is parsed from JSON
3. **Content Extraction**: Message pieces are extracted from `delta.content`
4. **Stream Queueing**: Content is enqueued to the ReadableStream

### Integration in Main Application

In `/src/pages/index.tsx`:

```typescript
// Initiate streaming response
const stream = await getChatResponseStream(messages, openAiKey);
const reader = stream.getReader();

// Process stream chunks
try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    // Accumulate response text
    receivedMessage += value;
    
    // Extract complete sentences for speech synthesis
    const sentenceMatch = receivedMessage.match(
      /^(.+[。．.!?！？\n])/
    );
    
    if (sentenceMatch) {
      const sentence = sentenceMatch[0];
      // Process sentence (emotion parsing, TTS, etc.)
    }
  }
} finally {
  reader.releaseLock();
}
```

## Sentence Extraction Strategy

The application uses regex to extract complete sentences from the stream:

```typescript
const sentenceMatch = receivedMessage.match(/^(.+[。．.!?！？\n])/);
```

This pattern matches:
- Japanese periods: `。` 
- Full-width periods: `．`
- ASCII periods: `.`
- Exclamation marks: `!` and `！`
- Question marks: `?` and `？`
- Newlines: `\n`

## Emotion Tag Handling in Streams

Emotion tags like `[{happy}]` are preserved during streaming and processed after sentence extraction:

1. Stream accumulates: `"[{happy}]こんに"`
2. Stream continues: `"[{happy}]こんにちは！"`
3. Sentence extracted: `"[{happy}]こんにちは！"`
4. Emotion parsed and removed: `emotion: "happy", text: "こんにちは！"`

## Error Handling

```typescript
// Check response status
if (res.status !== 200 || !reader) {
  throw new Error("Something went wrong");
}

// Stream error handling
try {
  // Process stream
} catch (error) {
  controller.error(error);
} finally {
  reader.releaseLock();
  controller.close();
}
```

## Performance Considerations

1. **Token Limit**: Set to 200 tokens to prevent long responses
2. **Sentence Buffering**: Complete sentences are required before TTS
3. **Memory Management**: Proper stream cleanup with `releaseLock()`
4. **Network Efficiency**: Direct API calls avoid proxy overhead

## Comparison: Streaming vs Non-Streaming

| Aspect | Streaming | Non-Streaming |
|--------|-----------|---------------|
| Response Time | First token in ~1s | Full response in 3-10s |
| User Experience | Progressive updates | Wait for complete response |
| Memory Usage | Lower (incremental) | Higher (full response) |
| Implementation | Complex | Simple |
| Error Recovery | Per-chunk | All-or-nothing |

## Example: Complete Streaming Implementation

```typescript
async function streamChat() {
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Tell me a story." }
  ];

  try {
    const stream = await getChatResponseStream(messages, apiKey);
    const reader = stream.getReader();
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      accumulated += value;
      console.log("Received chunk:", value);

      // Process complete sentences
      const sentences = accumulated.split(/[。．.!?！？\n]/);
      if (sentences.length > 1) {
        const completeSentence = sentences[0];
        await processSentence(completeSentence);
        accumulated = sentences.slice(1).join("");
      }
    }

    // Process any remaining text
    if (accumulated.trim()) {
      await processSentence(accumulated);
    }
  } catch (error) {
    console.error("Streaming error:", error);
  }
}
```

## Best Practices

1. **Always handle stream cleanup** in finally blocks
2. **Implement timeout mechanisms** for stalled streams
3. **Buffer partial sentences** until punctuation is received
4. **Process emotion tags** after sentence extraction
5. **Monitor token usage** to prevent excessive responses
6. **Provide fallback** to non-streaming mode on errors

## Debugging Tips

- Use browser DevTools to monitor SSE connections
- Log chunk boundaries to debug sentence extraction
- Check for proper UTF-8 handling with Japanese text
- Verify emotion tag preservation across chunks
- Monitor memory usage for long conversations