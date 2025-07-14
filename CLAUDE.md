# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status
**Important**: This repository was archived on 2024-07-18. All development should be done via forks. Related project: [local-chat-vrm](https://github.com/takaaki-s/local-chat-vrm) (browser-based version).

## Project Overview
ChatVRM is a browser-based 3D character conversation demo application that integrates VRM 3D models with conversational AI, voice recognition, and text-to-speech synthesis.

## Development Commands
```bash
npm install      # Install dependencies (Node 16.14.2 required)
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server (after build)
npm run lint     # Run ESLint
npm run export   # Export static site
```

## Architecture Overview

### Core Application Flow
```
1. User Speech → Web Speech API → MessageInputContainer → Message Queue
2. Message Queue → openAiChat.ts → ChatGPT API (streaming) → Response with emotion tags
3. AI Response → Koeiromap API → Audio Buffer → Character Speech Animation
4. VRM Model → Three.js Scene → Character Animations & Expressions
```

### Key Architectural Components

#### State Management Pattern
- **Local State**: React hooks for component-level state
- **Global State**: Context API for viewer instance sharing
- **Persistent State**: localStorage for settings, chat history, and voice parameters

#### API Integration Architecture
- **API Routes**: Next.js API routes proxy external APIs to handle CORS
  - `/api/chat.ts`: OpenAI ChatGPT API proxy
  - `/api/tts.ts`: Koeiromap voice synthesis proxy
- **Streaming**: Real-time ChatGPT response processing with sentence extraction
- **Rate Limiting**: Audio synthesis queue with 1 request/second limit

#### VRM Animation System
- **Scene Management**: `viewer.ts` manages Three.js scene and VRM loading
- **Animation Control**: Custom VRMA animation loader with smooth transitions
- **Lip Sync**: Audio-synchronized mouth movements using morphTarget
- **Look-At**: Custom loader plugin for natural eye tracking

#### Emotion System Architecture
- **Tag Format**: `[{emotion}]text` parsed via regex
- **Supported Emotions**: neutral, happy, angry, sad, relaxed
- **Integration**: Emotions control both facial expressions and voice style

### Critical Files for System Understanding

1. **Application Orchestration**
   - `/src/pages/index.tsx`: Main entry point, coordinates all subsystems
   - `/src/components/meta.tsx`: Application metadata and OpenGraph configuration

2. **3D Rendering Pipeline**
   - `/src/features/vrmViewer/viewer.ts`: Three.js scene setup and VRM loading
   - `/src/features/vrmViewer/model.ts`: VRM model controls and animations
   - `/src/lib/VRMAnimation/loadVRMAnimation.ts`: Custom VRMA loader

3. **AI Integration**
   - `/src/features/chat/openAiChat.ts`: Streaming ChatGPT integration
   - `/src/features/constants/systemPromptConstants.ts`: AI personality prompts
   - `/src/features/messages/synthesizeVoice.ts`: Text-to-speech orchestration

4. **Voice Processing**
   - `/src/features/koeiromap/koeiromap.ts`: Voice synthesis API client
   - `/src/features/lipSync/lipSync.ts`: Audio analysis for mouth animation

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_key      # Required for ChatGPT
KOEIROMAP_API_KEY=your_koeiromap_key # Required for voice synthesis
BASE_PATH=/optional/base/path        # For custom deployment paths
```

### Browser Requirements
- Chrome or Edge required for Web Speech API
- WebGL support for 3D rendering
- Modern JavaScript features (ES2020+)

### Testing Approach
No automated tests present. Manual testing required for:
- VRM file import and rendering
- Voice recognition functionality
- ChatGPT response streaming
- Voice synthesis playback
- Character animations and expressions
- Cross-browser compatibility

### Performance Considerations
- VRM models are loaded asynchronously to prevent blocking
- Audio synthesis uses queue management to prevent API overload
- Three.js scene optimization for smooth 60fps animations
- Streaming responses for better perceived performance