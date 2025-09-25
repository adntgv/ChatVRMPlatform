# ChatVRM API Documentation

## Overview
This directory contains comprehensive documentation for all API endpoints, streaming implementations, and configuration guides for the ChatVRM platform.

## Table of Contents

### API Endpoints
1. **[Chat Endpoint Documentation](./chat-endpoint.md)**
   - POST `/api/chat` - ChatGPT integration
   - Request/response formats
   - Error handling
   - Usage examples

2. **[TTS Endpoint Documentation](./tts-endpoint.md)**
   - POST `/api/tts` - Text-to-speech synthesis
   - Voice parameters and styles
   - Koeiromap integration details
   - Audio format specifications

### Implementation Guides
3. **[Streaming Implementation Guide](./streaming-guide.md)**
   - Real-time ChatGPT streaming
   - Client-side stream processing
   - Sentence extraction strategies
   - Performance optimizations

4. **[Error Handling Documentation](./error-handling.md)**
   - Complete error response catalog
   - HTTP status codes
   - Error prevention strategies
   - Debugging guidelines

5. **[API Key Configuration Guide](./api-key-configuration.md)**
   - OpenAI and Koeiromap key setup
   - Security best practices
   - Multi-environment configuration
   - Troubleshooting guide

## Quick Start

### Prerequisites
- Node.js 16.14.2+
- OpenAI API key
- Koeiromap API key

### Basic Setup
1. Clone the repository
2. Create `.env.local` file:
   ```bash
   OPEN_AI_KEY=your-openai-key
   KOEIROMAP_API_KEY=your-koeiromap-key
   ```
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

## API Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Next.js API │────▶│ External APIs   │
│             │◀────│   Routes     │◀────│ - OpenAI        │
└─────────────┘     └──────────────┘     │ - Koeiromap     │
                                          └─────────────────┘
```

## Key Features

- **Streaming Support**: Real-time AI responses
- **Emotion System**: Tagged responses with `[{emotion}]` format
- **Voice Synthesis**: Japanese TTS with emotional styles
- **CORS Handling**: Server-side API proxying
- **Security**: API key management and validation

## Common Integration Patterns

### Basic Chat Request
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  })
});
```

### Streaming Chat
```javascript
const stream = await getChatResponseStream(messages, apiKey);
const reader = stream.getReader();
// Process chunks...
```

### Voice Synthesis
```javascript
const audio = await fetch('/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'こんにちは',
    speakerX: 0,
    speakerY: 0,
    style: 'talk',
    apiKey: koeiromapKey
  })
});
```

## Development Tips

1. **Use streaming for better UX** - Provides immediate feedback
2. **Handle errors gracefully** - Both APIs can fail
3. **Implement rate limiting** - Protect API quotas
4. **Test with Japanese text** - TTS optimized for Japanese
5. **Monitor API usage** - Track costs and limits

## Related Documentation

- [Project Overview](../../CLAUDE.md)
- [System Architecture](../../README.md)
- Source code: `/src/pages/api/`
- Chat implementation: `/src/features/chat/`
- Voice synthesis: `/src/features/koeiromap/`

## Support

For issues related to:
- **API implementation**: Check error handling guide
- **Authentication**: See API key configuration
- **Performance**: Review streaming guide
- **Integration**: Refer to endpoint documentation

## Version History

- **v1.0** - Initial API documentation
- Supports OpenAI GPT-3.5-turbo
- Koeiromap Free v1.0 integration
- Basic error handling