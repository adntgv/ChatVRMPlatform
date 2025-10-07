# ElevenLabs TTS Integration

This document describes the ElevenLabs text-to-speech integration in the ChatVRM Platform.

## Overview

ElevenLabs provides high-quality, natural-sounding text-to-speech with low latency and support for multiple languages. This integration allows instances to use ElevenLabs as an alternative to Koeiromap for voice synthesis.

## Features

- **High-quality voices**: Natural-sounding speech with emotional range
- **Low latency**: ~75ms with Flash v2.5 model, optimized for real-time applications
- **Multilingual**: Supports 32+ languages
- **Per-instance configuration**: Each instance can choose its TTS provider
- **Voice customization**: Select from hundreds of voices or create custom voices
- **Voice settings**: Fine-tune stability, similarity, and style

## Architecture

### Provider Pattern

ElevenLabs is implemented as a `TTSProvider` following the existing provider abstraction:

```
src/features/providers/tts/
├── types.ts              # TTSProvider interface
├── elevenlabs.ts         # ElevenLabsProvider implementation
├── koeiromap.ts          # KoeiromapProvider implementation
└── index.ts              # TTSProviderFactory
```

### API Routes

- `/api/elevenlabs-tts` - Server-side endpoint for ElevenLabs synthesis
- `/api/tts` - Existing Koeiromap endpoint (unchanged)

### Data Flow

1. User sends message → Chat processing
2. AI generates response with emotion tags
3. `synthesizeVoiceApi()` checks instance TTS provider
4. Routes to `/api/elevenlabs-tts` or `/api/tts`
5. Provider synthesizes speech → Returns base64 audio
6. VRM character speaks with lip-sync animation

## Usage

### 1. Get an ElevenLabs API Key

1. Sign up at https://elevenlabs.io
2. Navigate to your profile → API Keys
3. Create a new API key
4. Copy the key (format: `sk_...`)

### 2. Configure Instance to Use ElevenLabs

When creating or editing an instance, set:

```typescript
{
  ttsProvider: 'elevenlabs',
  apiKeys: {
    elevenlabs: 'sk_your_api_key_here'
  },
  voice: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice (or any voice ID)
    elevenlabsVoiceSettings: {
      stability: 0.5,              // 0-1: Lower = more varied
      similarity_boost: 0.75,      // 0-1: Higher = closer to original
      style: 0,                    // 0-1: Style exaggeration
      use_speaker_boost: true      // Enhance speaker similarity
    }
  }
}
```

### 3. Available Voices

#### Default Voice IDs

- `pNInz6obpgDQGcFmaJgB` - Adam (male, deep, authoritative)
- `EXAVITQu4vr4xnSDxMaL` - Bella (female, soft, calm)
- `21m00Tcm4TlvDq8ikWAM` - Rachel (female, calm, natural)
- `onwK4e9ZLuTAKqWW03F9` - Daniel (male, deep, friendly)

#### Get All Available Voices

```bash
curl -X GET https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: YOUR_API_KEY"
```

Or use the ElevenLabsProvider method:

```typescript
const provider = TTSProviderFactory.getProvider({ provider: 'elevenlabs' });
const voices = await provider.getVoices(apiKey);
```

### 4. Voice Settings Explained

```typescript
elevenlabsVoiceSettings: {
  // Stability (0-1)
  // Lower: More expressive and varied, but less consistent
  // Higher: More stable and consistent, but less emotional range
  stability: 0.5,

  // Similarity Boost (0-1)
  // Lower: More creative liberty
  // Higher: Closer to original voice characteristics
  similarity_boost: 0.75,

  // Style (0-1)
  // 0: Minimal style exaggeration
  // 1: Maximum style exaggeration
  style: 0,

  // Speaker Boost (boolean)
  // true: Enhance similarity to speaker (recommended for cloned voices)
  // false: Disable speaker boost
  use_speaker_boost: true
}
```

## Models

### Available Models

1. **eleven_multilingual_v2** (Default)
   - Balanced quality and speed
   - 32 languages
   - Best for most use cases

2. **eleven_flash_v2_5** (Fastest)
   - Ultra-low latency (~75ms)
   - Great for real-time applications
   - Slightly lower quality than v2

3. **eleven_turbo_v2_5**
   - High quality with low latency
   - Good balance for production

4. **eleven_multilingual_v3**
   - Highest quality
   - Best emotional range
   - Higher latency

To change the model, modify `defaultModel` in `src/features/providers/tts/elevenlabs.ts`.

## API Reference

### ElevenLabsProvider

```typescript
class ElevenLabsProvider implements TTSProvider {
  name: string;

  // Synthesize speech from text
  async synthesize(
    text: string,
    options: TTSOptions
  ): Promise<TTSResponse>

  // Get available voices for API key
  async getVoices(apiKey: string): Promise<any[]>
}
```

### API Endpoint

**POST** `/api/elevenlabs-tts`

**Request Body:**
```json
{
  "message": "Text to synthesize",
  "voiceId": "pNInz6obpgDQGcFmaJgB",
  "apiKey": "sk_...",
  "voiceSettings": {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0,
    "use_speaker_boost": true
  }
}
```

**Response:**
```json
{
  "audio": "base64_encoded_mp3_data",
  "format": "mp3"
}
```

## Error Handling

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| 401 | Invalid API key | Check API key in instance settings |
| 429 | Rate limit exceeded | Wait and retry, or upgrade plan |
| 503 | Service unavailable | ElevenLabs is down, retry later |
| 504 | Request timeout | Text too long or network issue |

### Error Messages

Errors are handled gracefully with user-friendly messages:

```typescript
// Invalid API key
"ElevenLabs APIキーが無効です。設定を確認してください。"

// Rate limit
"ElevenLabs APIのレート制限に達しました。しばらく待ってから再試行してください。"

// General error
"ElevenLabs APIでエラーが発生しました。"
```

## Limits & Pricing

### Rate Limits

- **Free Tier**: 10,000 characters/month
- **Starter**: 30,000 characters/month
- **Creator**: 100,000 characters/month
- **Pro**: 500,000 characters/month

### Character Count

The platform counts characters in the `message` field. Typical conversation messages are 50-200 characters.

### Timeout

Requests timeout after 30 seconds to prevent hanging.

## Demo Configuration

The demo page uses ElevenLabs by default. Configure in `.env.local`:

```bash
# ElevenLabs (used by demo)
NEXT_PUBLIC_DEMO_ELEVENLABS_KEY=sk_your_key_here

# OpenAI (used by demo for chat)
NEXT_PUBLIC_DEMO_OPENAI_KEY=sk-...
```

Default voice in demo: Adam (`pNInz6obpgDQGcFmaJgB`)

## Migration from Koeiromap

Existing instances automatically use Koeiromap unless explicitly configured:

```typescript
// Old instance (automatically uses Koeiromap)
{
  apiKeys: { koeiromap: 'key' },
  voice: { speakerX: 0, speakerY: 0 }
}

// New instance with ElevenLabs
{
  ttsProvider: 'elevenlabs',
  apiKeys: { elevenlabs: 'sk_...' },
  voice: { voiceId: 'pNInz6obpgDQGcFmaJgB' }
}
```

## Testing

### Manual Test

```bash
# Start dev server
npm run dev

# Run test script
node test-elevenlabs.js
```

### Expected Output

```
Testing ElevenLabs API integration...

Response status: 200 OK
✓ Audio generated successfully!
✓ Audio data length: 93128 characters (base64)
✓ Format: mp3
✓ Valid base64: true

✓ ElevenLabs integration test PASSED!
```

## Troubleshooting

### Audio Not Playing

1. Check browser console for errors
2. Verify API key is valid
3. Check network tab for 401/429 errors
4. Test with test script

### Voice Not Changing

1. Verify `voiceId` is correct
2. Check that `ttsProvider` is set to `'elevenlabs'`
3. Clear browser cache

### Lip-Sync Issues

Lip-sync animation is handled by the VRM viewer and should work automatically with ElevenLabs audio. If issues occur:

1. Check audio format (should be MP3)
2. Verify audio buffer is valid
3. Check VRM model has lip-sync blend shapes

## Future Enhancements

- [ ] Voice library browser UI
- [ ] Voice preview/testing
- [ ] WebSocket streaming for ultra-low latency
- [ ] Voice cloning support
- [ ] Multi-voice conversations
- [ ] Emotion-to-voice-settings mapping

## References

- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [Voice Library](https://elevenlabs.io/docs/product-guides/voices/voice-library)
- [Models Overview](https://elevenlabs.io/docs/models)
- [Rate Limits](https://elevenlabs.io/docs/api-reference/introduction)
