# Text-to-Speech (TTS) API Endpoint Documentation

## Overview
The `/api/tts` endpoint provides a server-side proxy to Koeiromap's voice synthesis API, converting text into speech audio with customizable voice parameters and emotional styles.

## Endpoint Details

**URL**: `/api/tts`  
**Method**: `POST`  
**Content-Type**: `application/json`

## Request Format

### Request Body
```json
{
  "message": "こんにちは！",
  "speakerX": 2.0,
  "speakerY": 2.0,
  "style": "talk",
  "apiKey": "your-koeiromap-api-key"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | Text to synthesize into speech |
| `speakerX` | number | Yes | X-coordinate for voice characteristics (-3.0 to 3.0) |
| `speakerY` | number | Yes | Y-coordinate for voice characteristics (-3.0 to 3.0) |
| `style` | string | Yes | Speaking style: "talk", "happy", or "sad" |
| `apiKey` | string | Yes | Koeiromap API subscription key |

### Voice Parameters (speakerX, speakerY)
The speaker coordinates define voice characteristics on a 2D plane:
- **X-axis**: Controls voice pitch and tone
- **Y-axis**: Controls voice energy and expressiveness
- Range: -3.0 to 3.0 for both axes
- Default/neutral voice: (0.0, 0.0)

### Style Options
- `"talk"`: Normal conversational tone
- `"happy"`: Cheerful, upbeat delivery
- `"sad"`: Subdued, melancholic tone

## Response Format

### Success Response (200 OK)
```json
{
  "audio": "//NAxAA...base64-encoded-mp3-data..."
}
```

The `audio` field contains Base64-encoded MP3 audio data.

### Error Responses

#### Server Error (500 Internal Server Error)
The endpoint lacks explicit error handling. Any failures from the Koeiromap API will result in a 500 error.

## Implementation Details

- **API Version**: Koeiromap Free v1.0
- **API Endpoint**: `https://api.rinna.co.jp/koeiromap/v1.0/infer`
- **Output Format**: MP3 audio
- **Encoding**: Base64
- **Library**: Custom `koeiromapFreeV1` function

## Example Usage

### JavaScript/TypeScript
```typescript
// Synthesize speech
const response = await fetch('/api/tts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'こんにちは、今日はいい天気ですね！',
    speakerX: 2.0,
    speakerY: 2.0,
    style: 'happy',
    apiKey: 'your-koeiromap-api-key'
  })
});

const data = await response.json();

// Convert base64 to audio and play
const audioBlob = base64ToBlob(data.audio, 'audio/mp3');
const audioUrl = URL.createObjectURL(audioBlob);
const audio = new Audio(audioUrl);
audio.play();

// Helper function
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
```

### cURL
```bash
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "message": "テストメッセージです",
    "speakerX": 0,
    "speakerY": 0,
    "style": "talk",
    "apiKey": "your-api-key"
  }'
```

## Integration with Emotion System

The TTS style parameter integrates with the character emotion system:

| Character Emotion | TTS Style |
|-------------------|-----------|
| `neutral`         | `"talk"`  |
| `happy`           | `"happy"` |
| `sad`             | `"sad"`   |
| `angry`           | `"talk"`  |
| `relaxed`         | `"talk"`  |

Note: Koeiromap v1.0 only supports three styles, so `angry` and `relaxed` emotions default to `"talk"` style.

## Rate Limiting

The application implements client-side rate limiting:
- Maximum 1 request per second
- Audio synthesis requests are queued
- Prevents API overload

## Notes

- Japanese text is recommended for optimal results
- The Koeiromap API is provided by Rinna Inc.
- Audio quality depends on text complexity and length
- Longer texts may take more time to synthesize

## Security Considerations

- API keys must be kept secure and not exposed in client-side code
- This endpoint requires a valid Koeiromap subscription
- Consider implementing request validation and rate limiting
- Monitor usage to prevent API quota exhaustion