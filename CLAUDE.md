# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status
**Important**: This repository was archived on 2024-07-18. All development should be done via forks. Related project: [local-chat-vrm](https://github.com/takaaki-s/local-chat-vrm) (browser-based version).

## Project Overview
ChatVRM is a browser-based 3D character conversation demo application that:
- Displays VRM format 3D models
- Uses Web Speech API for voice recognition
- Integrates OpenAI ChatGPT API for conversation
- Synthesizes character voice using Koeiromap API
- Handles character emotions and animations

## Development Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Export static site
npm run export

# Start production server (after build)
npm run start
```

## Architecture Overview

### Core Components Flow
1. **User Input** → Web Speech API → `/src/features/messages/` → Message queue
2. **AI Processing** → `/src/features/chat/openAiChat.ts` → ChatGPT API → Response with emotion tags
3. **Voice Synthesis** → `/src/features/koeiromap/` → Koeiromap API → Audio playback
4. **3D Rendering** → `/src/features/vrmViewer/` → Three.js/VRM → Character animations

### Key Architectural Patterns
- **State Management**: React hooks with context for global state
- **Message Queue**: Async processing of chat messages with emotion parsing
- **VRM Control**: Custom viewer class wrapping @pixiv/three-vrm
- **Emotion System**: Regex-based emotion tag extraction from AI responses
- **Voice Parameters**: Persistent storage in localStorage for voice settings

### Critical Files for Understanding the System
- `/src/pages/index.tsx` - Main application entry point, orchestrates all features
- `/src/features/vrmViewer/viewer.ts` - VRM model viewer implementation
- `/src/features/chat/openAiChat.ts` - ChatGPT integration with streaming support
- `/src/features/constants/systemPromptConstants.ts` - AI personality configuration
- `/src/components/messageInputContainer.tsx` - User input handling

### API Integration Points
1. **OpenAI API**: Requires `OPENAI_API_KEY` environment variable
2. **Koeiromap API**: Requires `KOEIROMAP_API_KEY` environment variable
3. **API Routes**: `/api/chat` and `/api/tts` handle backend communication

### Testing Approach
No automated tests are present in the repository. Manual testing is required for:
- VRM file import functionality
- Voice recognition in supported browsers
- ChatGPT response generation
- Voice synthesis playback
- Character animations and expressions

### Important Considerations
- Browser compatibility: Web Speech API requires Chrome/Edge
- CORS: API routes handle external API calls to avoid CORS issues
- Performance: VRM rendering optimization for smooth animations
- Storage: Chat history and settings persist in localStorage