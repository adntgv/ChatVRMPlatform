# ChatVRM Project Structure Overview

## Overview
ChatVRM is a Next.js application written in TypeScript that creates an interactive 3D character conversation experience. This document provides a comprehensive overview of the project's directory structure and organization.

## Directory Tree

```
ChatVRMPlatform/
├── 📄 Configuration Files           # Project configuration
├── 📁 .claude/                     # Claude AI configuration
├── 📁 .github/workflows/           # CI/CD workflows
├── 📁 docs/                        # Project documentation
├── 📁 public/                      # Static assets
└── 📁 src/                         # Source code
    ├── 📁 components/              # React UI components
    ├── 📁 features/                # Business logic by feature
    ├── 📁 lib/                     # Custom libraries
    ├── 📁 pages/                   # Next.js pages & API routes
    ├── 📁 styles/                  # Global styles
    └── 📁 utils/                   # Utility functions
```

## Root Configuration Files

| File | Purpose |
|------|---------|
| `next.config.js` | Next.js framework configuration |
| `tsconfig.json` | TypeScript compiler options |
| `package.json` | Dependencies and npm scripts |
| `tailwind.config.js` | Tailwind CSS styling configuration |
| `.eslintrc.json` | Code linting rules |
| `CLAUDE.md` | Project guidance for AI assistants |

## Core Directories

### `/src/components/` - UI Components
React components that form the user interface:

- **`vrmViewer.tsx`** - Main 3D character viewer
- **`messageInputContainer.tsx`** - Chat input interface
- **`assistantText.tsx`** - AI response display
- **`chatLog.tsx`** - Conversation history
- **`settings.tsx`** - Application settings panel
- **`menu.tsx`** - Navigation menu
- **`introduction.tsx`** - Welcome screen

### `/src/features/` - Feature Modules
Business logic organized by domain:

#### `chat/`
- **`openAiChat.ts`** - ChatGPT API integration with streaming support

#### `vrmViewer/`
- **`viewer.ts`** - Three.js scene management and rendering
- **`model.ts`** - VRM model loading and control
- **`viewerContext.ts`** - React context for viewer state sharing

#### `emoteController/`
- **`emoteController.ts`** - Manages character emotions and animations
- **`expressionController.ts`** - Facial expression morphing
- **`autoBlink.ts`** - Natural blinking behavior
- **`autoLookAt.ts`** - Eye tracking and head movement

#### `messages/`
- **`messages.ts`** - Message processing and emotion tag parsing
- **`speakCharacter.ts`** - Character speech orchestration
- **`synthesizeVoice.ts`** - Voice synthesis management

#### `koeiromap/`
- **`koeiromap.ts`** - Japanese text-to-speech API client

#### `lipSync/`
- **`lipSync.ts`** - Audio-synchronized mouth movements
- **`lipSyncAnalyzeResult.ts`** - Audio analysis for lip sync

### `/src/lib/` - Custom Libraries

#### `VRMAnimation/`
Custom implementation for loading and playing VRM animations:
- **`loadVRMAnimation.ts`** - VRMA file loader
- **`VRMAnimation.ts`** - Animation playback class
- **`VRMAnimationLoaderPlugin.ts`** - Three.js loader plugin

#### `VRMLookAtSmootherLoaderPlugin/`
Smooth eye tracking implementation for natural character behavior

### `/src/pages/` - Next.js Pages

- **`index.tsx`** - Main application entry point
- **`_app.tsx`** - Application wrapper with global providers
- **`_document.tsx`** - Custom HTML document structure
- **`api/`** - Backend API routes:
  - **`chat.ts`** - ChatGPT proxy endpoint
  - **`tts.ts`** - Text-to-speech proxy endpoint

### `/public/` - Static Assets

| File | Description |
|------|-------------|
| `AvatarSample_B.vrm` | Sample 3D character model |
| `idle_loop.vrma` | Idle animation for character |
| `bg-c.png` | Background image |
| `ogp.png` | Social media preview image |

## Architecture Patterns

### Feature-Based Organization
The codebase follows a feature-based architecture where related functionality is grouped together:

```
features/
├── emoteController/     # All emotion-related code
│   ├── emoteController.ts
│   ├── expressionController.ts
│   └── emoteConstants.ts
```

### State Management
- **Local State**: React hooks (`useState`, `useReducer`)
- **Shared State**: Context API (e.g., `viewerContext.ts`)
- **Persistent State**: localStorage for settings

### API Proxy Pattern
Backend API routes act as proxies to external services:
```
Browser → Next.js API Route → External API (OpenAI/Koeiromap)
```

## Key Entry Points

1. **Application Start**: `/src/pages/index.tsx`
2. **3D Viewer**: `/src/components/vrmViewer.tsx`
3. **Chat System**: `/src/features/chat/openAiChat.ts`
4. **Voice Synthesis**: `/src/features/messages/synthesizeVoice.ts`

## Development Workflow

### Scripts (from package.json)
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

### Environment Variables
Create `.env.local` for local development:
```
OPEN_AI_KEY=your-openai-api-key
KOEIROMAP_API_KEY=your-koeiromap-key
```

## File Naming Conventions

- **Components**: PascalCase (e.g., `MessageInput.tsx`)
- **Utilities/Features**: camelCase (e.g., `openAiChat.ts`)
- **Constants**: camelCase with descriptive names (e.g., `systemPromptConstants.ts`)

## Import Structure

The project uses absolute imports from the `src` directory:
```typescript
import { VRMViewer } from "@/components/vrmViewer";
import { getChatResponse } from "@/features/chat/openAiChat";
```

## Next Steps

- See [VRM Viewer Documentation](./vrm-viewer-components.md) for 3D rendering details
- See [Chat System Architecture](./chat-system-architecture.md) for messaging flow
- See [State Management Guide](./state-management.md) for data flow patterns
- See [Contributing Guide](../../CONTRIBUTING.md) for development setup