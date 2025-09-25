# Chat System Architecture

## Overview
The chat system enables real-time conversations between users and a 3D VRM character, integrating ChatGPT for AI responses and Koeiromap for voice synthesis. The system uses streaming for responsive interactions and includes emotion parsing for expressive character animations.

## Architecture Flow

```
┌─────────────────┐
│   User Input    │
│  (Text/Voice)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Message Input   │────▶│  ChatGPT     │────▶│ Stream          │
│   Container     │     │  Streaming   │     │ Processing      │
└─────────────────┘     └──────────────┘     └─────────────────┘
                                                      │
                                ┌─────────────────────┴─────────────────┐
                                │                                       │
                                ▼                                       ▼
                        ┌──────────────┐                       ┌──────────────┐
                        │   Emotion    │                       │  Sentence    │
                        │   Parsing    │                       │ Extraction   │
                        └──────┬───────┘                       └──────┬───────┘
                               │                                       │
                               ▼                                       ▼
                        ┌──────────────┐                       ┌──────────────┐
                        │  Character   │                       │    Voice     │
                        │ Expression   │◀──────────────────────│  Synthesis   │
                        └──────────────┘                       └──────────────┘
                                                                      │
                                                                      ▼
                                                              ┌──────────────┐
                                                              │   Lip Sync   │
                                                              │  Animation   │
                                                              └──────────────┘
```

## Core Components

### 1. Message Input System
**Component**: `/src/components/messageInputContainer.tsx`

Handles user input through text or voice recognition.

**Features**:
- Text input field
- Web Speech API integration for voice input
- Message submission handling
- Processing state management

**Key Props**:
```typescript
interface Props {
  isChatProcessing: boolean;
  onChatProcessStart: (text: string) => void;
}
```

### 2. Chat API Integration
**Module**: `/src/features/chat/openAiChat.ts`

Manages communication with OpenAI's ChatGPT API.

**Two Modes**:
1. **Standard Request** (`getChatResponse`)
   - Single request-response
   - Used for non-streaming fallback

2. **Streaming** (`getChatResponseStream`)
   - Real-time response streaming
   - Returns ReadableStream
   - Processes Server-Sent Events (SSE)

**Streaming Implementation**:
```typescript
// Create streaming request
const stream = await getChatResponseStream(messages, apiKey);

// Process stream chunks
const reader = stream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Process chunk...
}
```

### 3. Message Processing Pipeline
**Location**: `/src/pages/index.tsx` (handleSendChat)

The main orchestration logic for chat interactions.

**Process Flow**:
1. **Input Validation** - Check API keys
2. **Message Logging** - Add user message to chat history
3. **System Prompt** - Prepend conversation context
4. **Stream Processing** - Handle real-time responses
5. **Sentence Extraction** - Parse complete sentences
6. **Emotion Detection** - Extract emotion tags
7. **Voice Synthesis** - Generate speech for each sentence
8. **Character Animation** - Update expressions and lip sync

### 4. Emotion Tag System
**Module**: `/src/features/messages/messages.ts`

Parses emotion tags from AI responses to control character expressions.

**Tag Format**: `[{emotion}]text`

**Supported Emotions**:
- `neutral` - Default expression
- `happy` - Joyful expression
- `angry` - Angry expression
- `sad` - Sad expression
- `relaxed` - Calm expression

**Implementation**:
```typescript
export const textsToScreenplay = (
  texts: string[],
  koeiroParam: KoeiroParam
): Screenplay[] => {
  // Extract emotion tag
  const match = text.match(/\[(.*?)\]/);
  const tag = match?.[1] || prevExpression;
  
  // Remove tag from message
  const message = text.replace(/\[(.*?)\]/g, "");
  
  // Create screenplay with emotion
  return {
    expression: tag as EmotionType,
    talk: {
      style: emotionToTalkStyle(tag),
      message: message
    }
  };
};
```

### 5. Sentence Extraction Strategy

**Pattern**: `/^(.+[。．！？\n]|.{10,}[、,])/`

Extracts complete sentences by detecting:
- Japanese sentence endings: `。`
- Full-width periods: `．`
- Exclamation marks: `！` or `!`
- Question marks: `？` or `?`
- Line breaks: `\n`
- Long phrases with commas (10+ chars)

**Benefits**:
- Enables progressive speech synthesis
- Reduces latency for first speech
- Natural conversation flow

### 6. Voice Synthesis Integration
**Module**: `/src/features/messages/synthesizeVoice.ts`

Orchestrates text-to-speech conversion.

**Process**:
1. Call TTS API with text and emotion style
2. Receive Base64 audio data
3. Create audio buffer
4. Analyze for lip sync data
5. Return audio and lip sync metadata

**Emotion to Voice Style Mapping**:
```typescript
const styleMap = {
  neutral: "talk",
  happy: "happy",
  angry: "talk",   // Koeiromap limitation
  sad: "sad",
  relaxed: "talk"
};
```

### 7. Character Speech Control
**Module**: `/src/features/messages/speakCharacter.ts`

Coordinates character animations during speech.

**Responsibilities**:
- Queue management for sequential speech
- Audio playback control
- Expression changes
- Lip sync animation
- Callback handling

**Implementation**:
```typescript
export const speakCharacter = async (
  screenplay: Screenplay,
  viewer: Viewer,
  koeiromapKey: string,
  onStart?: () => void,
  onEnd?: () => void
) => {
  // Synthesize voice
  const voice = await synthesizeVoice(
    screenplay.talk,
    koeiromapKey
  );
  
  // Play emotion
  emoteController.playEmotion(screenplay.expression);
  
  // Play audio with lip sync
  await lipSync.playFromArrayBuffer(
    voice.audio,
    voice.metadata
  );
};
```

## State Management

### Chat State
**Location**: Main component (`index.tsx`)

```typescript
// Core states
const [chatLog, setChatLog] = useState<Message[]>([]);
const [chatProcessing, setChatProcessing] = useState(false);
const [assistantMessage, setAssistantMessage] = useState("");

// Configuration
const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
const [openAiKey, setOpenAiKey] = useState("");
const [koeiromapKey, setKoeiromapKey] = useState("");
```

### Persistence
Chat history and settings are persisted to localStorage:

```typescript
// Save on change
useEffect(() => {
  localStorage.setItem("chatVRMParams", JSON.stringify({
    systemPrompt,
    koeiroParam,
    chatLog
  }));
}, [systemPrompt, koeiroParam, chatLog]);
```

## Message Flow Example

### User Says: "Hello, how are you?"

1. **Input Processing**
   ```
   User types/speaks → MessageInputContainer → onChatProcessStart("Hello, how are you?")
   ```

2. **API Request**
   ```typescript
   messages = [
     { role: "system", content: SYSTEM_PROMPT },
     { role: "user", content: "Hello, how are you?" }
   ]
   stream = getChatResponseStream(messages, apiKey)
   ```

3. **Stream Processing**
   ```
   Chunk 1: "[{happy}]Hi"
   Chunk 2: " there! I'm"
   Chunk 3: " doing great!"
   ```

4. **Sentence Extraction**
   ```
   Sentence 1: "[{happy}]Hi there!"
   Sentence 2: "I'm doing great!"
   ```

5. **For Each Sentence**:
   - Parse emotion tag → `happy`
   - Remove tag → "Hi there!"
   - Synthesize voice with happy style
   - Play audio with happy expression
   - Animate lip sync

## Error Handling

### API Key Validation
```typescript
if (!openAiKey) {
  setAssistantMessage("APIキーが入力されていません");
  return;
}
```

### Stream Error Handling
```typescript
const stream = await getChatResponseStream(messages, openAiKey)
  .catch((e) => {
    console.error(e);
    return null;
  });

if (stream == null) {
  setChatProcessing(false);
  return;
}
```

### Voice Synthesis Errors
- Fallback to text-only display
- Log errors for debugging
- Continue with next sentence

## Performance Optimizations

### Streaming Benefits
- First speech starts before full response
- Progressive UI updates
- Lower memory usage
- Better perceived performance

### Rate Limiting
- Voice synthesis: 1 request/second
- Prevents API overload
- Queued processing

### Sentence Buffering
- Extract complete sentences only
- Avoid partial word synthesis
- Natural speech patterns

## Configuration

### System Prompt
Defines the AI character's personality and response format:
```typescript
const SYSTEM_PROMPT = `
あなたは「ずんだもん」という名前のキャラクターです。
会話文の書式は以下の通りです。
[{neutral|happy|angry|sad|relaxed}]{会話文}
`;
```

### Voice Parameters (KoeiroParam)
```typescript
interface KoeiroParam {
  speakerX: number;  // Voice characteristic X
  speakerY: number;  // Voice characteristic Y
}
```

## Best Practices

### Message Formatting
1. Always include system prompt
2. Maintain conversation context
3. Limit message history for performance

### Stream Processing
1. Handle partial sentences gracefully
2. Process emotion tags early
3. Clean up resources properly

### Error Recovery
1. Provide user feedback
2. Allow retry mechanisms
3. Fallback to non-streaming mode

## Extending the Chat System

### Adding New Emotions
1. Update `EmotionType` in constants
2. Add emotion to system prompt
3. Map to voice style
4. Create character expression

### Custom Message Processing
```typescript
// Add pre-processing
const processedMessage = customFilter(userMessage);

// Add post-processing  
const enhancedResponse = enhanceAIResponse(aiMessage);
```

### Alternative AI Providers
Replace `getChatResponseStream` with custom implementation maintaining the same ReadableStream interface.