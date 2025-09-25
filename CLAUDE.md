# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status
**Important**: This repository was archived on 2024-07-18. All development should be done via forks. Related project: [local-chat-vrm](https://github.com/pixiv/local-chat-vrm) (browser-based version).

## Project Overview
ChatVRM Platform is a multi-instance 3D character conversation application built with Next.js 13.2, allowing users to create and manage multiple AI-powered VRM characters with unique personalities.

## Development Commands
```bash
# Install dependencies (Node 16.14.2 required)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Export static site
npm run export
```

## Architecture Overview

### Multi-Instance System
The application uses a centralized instance management system where each instance represents a unique character configuration:
- **Instance Context** (`/src/features/instances/instanceContext.tsx`): Global state management for all instances
- **Instance Service** (`/src/features/instances/instanceService.ts`): Persistence layer using localStorage
- **Instance Types** (`/src/features/instances/types.ts`): TypeScript definitions for instance data structures

### Page Routes & Flow
1. **Landing** (`/src/pages/index.tsx`): Instance selection or creation
2. **Create** (`/src/pages/create.tsx`): New instance configuration
3. **Instances** (`/src/pages/instances.tsx`): Instance management dashboard
4. **Viewer** (`/src/pages/viewer/[instanceId].tsx`): Main chat interface with 3D character
5. **Edit** (`/src/pages/edit/[instanceId].tsx`): Instance configuration editing

### Core Feature Modules

#### VRM Viewer System (`/src/features/vrmViewer/`)
- `viewer.ts`: Three.js scene management, VRM loading, animation control
- `model.ts`: VRM model data structures
- `viewerContext.ts`: React context for viewer instance sharing

#### Chat System (`/src/features/chat/`)
- `openAiChat.ts`: OpenAI GPT-3.5 integration with streaming support
- Emotion tag parsing from AI responses (`[emotion:tag]` format)
- System prompts stored per instance in personality configuration

#### Voice Synthesis (`/src/features/koeiromap/`)
- `koeiromap.ts`: Koeiromap API integration for TTS
- Voice parameters customizable per instance
- Audio playback with lip-sync animation

#### Message Processing (`/src/features/messages/`)
- `messages.ts`: Message queue, screenplay generation
- `speakCharacter.ts`: Character speech orchestration
- `synthesizeVoice.ts`: Voice synthesis pipeline

#### Animation Control (`/src/features/emoteController/`)
- `emoteController.ts`: Emotion-based animation triggers
- `expressionController.ts`: Facial expression management
- `autoBlink.ts`, `autoLookAt.ts`: Idle animation systems

### Data Flow Architecture
1. **User Input** → MessageInputContainer → Instance chat history
2. **AI Processing** → OpenAI API (via `/api/chat`) → Emotion tag extraction
3. **Voice Generation** → Koeiromap API (via `/api/tts`) → Audio buffer
4. **Character Animation** → VRM Viewer → Expression/lip-sync updates

### State Management Pattern
- **Instance State**: Centralized in InstanceContext, persisted to localStorage
- **Viewer State**: ViewerContext provides VRM viewer instance to components
- **Chat State**: Managed locally in viewer page, synced to instance
- **API Keys**: Stored per instance, allowing different configurations

### API Integration Points
1. **OpenAI API**:
   - Endpoint: `/api/chat`
   - Key storage: Per instance (`instance.apiKeys.openAI`)
   - Model: GPT-3.5-turbo

2. **Koeiromap API**:
   - Endpoint: `/api/tts`
   - Key storage: Per instance (`instance.apiKeys.koeiromap`)
   - Voice parameters: Customizable per instance

### Critical Implementation Details

#### Instance Persistence
- All instance data stored in localStorage under `vrm-platform-instances`
- Active instance ID stored separately in `vrm-platform-active-instance`
- Chat history limited per instance to prevent storage overflow

#### VRM Animation Pipeline
1. Load VRM file → Parse with @pixiv/three-vrm
2. Setup expression morphs and bone controls
3. Apply idle animations (blink, breathing)
4. Trigger expressions based on emotion tags
5. Lip-sync with audio playback

#### Streaming Response Handling
- OpenAI responses streamed character by character
- Emotion tags parsed in real-time from stream
- UI updates progressively as response generates

### Environment Variables
- `OPEN_AI_KEY`: Default OpenAI API key (optional, users can provide their own)
- `KOEIROMAP_API_KEY`: Default Koeiromap API key (optional)

### Browser Requirements
- Chrome/Edge for Web Speech API support
- WebGL support for Three.js rendering
- Microphone permissions for voice input

### Performance Considerations
- VRM models optimized on load to reduce polygon count
- Chat history trimmed to prevent memory issues
- Animations throttled to maintain 60fps
- Audio buffers cached to reduce API calls