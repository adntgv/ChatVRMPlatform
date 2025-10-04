# Provider Abstraction Layer

This directory contains abstraction layers for LLM (Language Model) and TTS (Text-to-Speech) providers, allowing easy switching between different API providers.

## Architecture

### LLM Providers (`/llm`)

Abstract interface for language model providers (ChatGPT, Claude, etc.)

**Current Providers:**
- OpenAI (GPT-3.5-turbo, GPT-4)

**Interface:**
```typescript
interface LLMProvider {
  name: string;
  getChatResponse(messages: Message[], apiKey: string, options?: LLMOptions): Promise<LLMResponse>;
  getChatResponseStream(messages: Message[], apiKey: string, options?: LLMOptions): Promise<ReadableStream>;
}
```

**Usage:**
```typescript
import { LLMProviderFactory } from '@/features/providers/llm';

// Get a provider
const provider = LLMProviderFactory.getProvider({ provider: 'openai' });

// Get chat response
const response = await provider.getChatResponse(messages, apiKey, {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 500
});

// Stream response
const stream = await provider.getChatResponseStream(messages, apiKey);
```

### TTS Providers (`/tts`)

Abstract interface for text-to-speech providers (Koeiromap, Google, ElevenLabs, etc.)

**Current Providers:**
- Koeiromap

**Interface:**
```typescript
interface TTSProvider {
  name: string;
  synthesize(text: string, options: TTSOptions): Promise<TTSResponse>;
}
```

**Usage:**
```typescript
import { TTSProviderFactory } from '@/features/providers/tts';

// Get a provider
const provider = TTSProviderFactory.getProvider({ provider: 'koeiromap' });

// Synthesize speech
const audio = await provider.synthesize(text, {
  voice: {
    speakerX: 2.5,
    speakerY: 1.8
  },
  style: 'happy',
  apiKey: 'your-api-key',
  format: 'mp3'
});
```

## Adding New Providers

### Adding a New LLM Provider

1. Create a new file in `/llm` (e.g., `claude.ts`):

```typescript
import { LLMProvider, LLMOptions, LLMResponse } from "./types";

export class ClaudeProvider implements LLMProvider {
  name = "Claude";

  async getChatResponse(messages: Message[], apiKey: string, options?: LLMOptions): Promise<LLMResponse> {
    // Implementation
  }

  async getChatResponseStream(messages: Message[], apiKey: string, options?: LLMOptions): Promise<ReadableStream> {
    // Implementation
  }
}
```

2. Register it in `/llm/index.ts`:

```typescript
import { ClaudeProvider } from "./claude";

LLMProviderFactory.registerProvider('claude', new ClaudeProvider());
```

3. Update the type in `/llm/types.ts`:

```typescript
export interface LLMProviderConfig {
  provider: 'openai' | 'claude' | 'custom';
  // ...
}
```

### Adding a New TTS Provider

1. Create a new file in `/tts` (e.g., `elevenlabs.ts`):

```typescript
import { TTSProvider, TTSOptions, TTSResponse } from "./types";

export class ElevenLabsProvider implements TTSProvider {
  name = "ElevenLabs";

  async synthesize(text: string, options: TTSOptions): Promise<TTSResponse> {
    // Implementation
  }
}
```

2. Register it in `/tts/index.ts`:

```typescript
import { ElevenLabsProvider } from "./elevenlabs";

TTSProviderFactory.registerProvider('elevenlabs', new ElevenLabsProvider());
```

3. Update the type in `/tts/types.ts`:

```typescript
export interface TTSProviderConfig {
  provider: 'koeiromap' | 'elevenlabs' | 'google' | 'azure' | 'custom';
  // ...
}
```

## Configuration in Instances

Both LLM and TTS providers can be configured per instance:

```typescript
interface Instance {
  // ...
  llmProvider?: LLMProviderConfig;
  ttsProvider?: TTSProviderConfig;
}
```

Example:
```typescript
const instance = {
  name: "My Character",
  llmProvider: {
    provider: 'openai',
    apiKey: 'sk-...',
    options: {
      model: 'gpt-4',
      temperature: 0.8
    }
  },
  ttsProvider: {
    provider: 'elevenlabs',
    apiKey: 'el-...',
    defaultOptions: {
      voice: { voiceId: 'rachel' },
      format: 'mp3'
    }
  }
};
```

## Benefits

1. **Easy Provider Switching**: Change providers without modifying application code
2. **Future-Proof**: Add new providers (Google TTS, Azure, ElevenLabs, etc.) without breaking existing code
3. **Per-Instance Configuration**: Different characters can use different providers
4. **Type Safety**: Full TypeScript support with interfaces
5. **Backward Compatible**: Existing code continues to work through wrapper functions

## Migration Guide

Old code:
```typescript
import { getChatResponse } from '@/features/chat/openAiChat';
import { koeiromapFreeV1 } from '@/features/koeiromap/koeiromap';

const response = await getChatResponse(messages, apiKey);
const audio = await koeiromapFreeV1(text, x, y, style, apiKey);
```

New code (recommended):
```typescript
import { LLMProviderFactory } from '@/features/providers/llm';
import { TTSProviderFactory } from '@/features/providers/tts';

const llm = LLMProviderFactory.getProvider({ provider: 'openai' });
const tts = TTSProviderFactory.getProvider({ provider: 'koeiromap' });

const response = await llm.getChatResponse(messages, apiKey);
const audio = await tts.synthesize(text, { voice: { speakerX: x, speakerY: y }, style, apiKey });
```

Old code still works for backward compatibility but is marked as deprecated.
