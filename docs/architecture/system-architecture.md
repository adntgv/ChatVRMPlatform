# ChatVRM System Architecture

## Overview

ChatVRM is a browser-based 3D character conversation application that combines VRM 3D models with conversational AI, voice recognition, and text-to-speech synthesis. This document provides a comprehensive view of the system architecture, component relationships, and data flow patterns.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client (Browser)"
        UI[UI Layer<br/>React Components]
        SM[State Management<br/>Hooks & Context]
        VRM[VRM Viewer<br/>Three.js Scene]
        FEAT[Feature Modules]
    end
    
    subgraph "Next.js Server"
        API[API Routes<br/>Proxy Layer]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI<br/>ChatGPT API]
        KOEIRO[Koeiromap<br/>TTS API]
    end
    
    subgraph "Browser APIs"
        SPEECH[Web Speech API]
        WEBGL[WebGL]
        AUDIO[Web Audio API]
    end
    
    UI --> SM
    SM --> FEAT
    FEAT --> VRM
    UI --> SPEECH
    VRM --> WEBGL
    FEAT --> AUDIO
    FEAT --> API
    API --> OPENAI
    API --> KOEIRO
```

## Detailed Component Architecture

```mermaid
graph LR
    subgraph "UI Components"
        VV[VrmViewer]
        MIC[MessageInputContainer]
        CL[ChatLog]
        AT[AssistantText]
        SET[Settings]
        MENU[Menu]
        INTRO[Introduction]
    end
    
    subgraph "Feature Modules"
        subgraph "VRM Viewer System"
            VIEWER[Viewer.ts]
            MODEL[Model.ts]
            VRMANIM[VRM Animation]
        end
        
        subgraph "Chat System"
            CHAT[OpenAiChat.ts]
            MSG[Messages.ts]
            SPEAK[SpeakCharacter.ts]
            SYNTH[SynthesizeVoice.ts]
        end
        
        subgraph "Character Control"
            EMOTE[EmoteController]
            EXPR[ExpressionController]
            BLINK[AutoBlink]
            LOOK[AutoLookAt]
            LIP[LipSync]
        end
        
        subgraph "Voice System"
            KOEIROCLIENT[Koeiromap.ts]
        end
    end
    
    subgraph "State Management"
        LOCAL[Local State<br/>useState]
        CTX[Viewer Context]
        PERSIST[LocalStorage]
    end
    
    VV --> VIEWER
    VIEWER --> MODEL
    MODEL --> EMOTE
    MIC --> CHAT
    CHAT --> MSG
    MSG --> SPEAK
    SPEAK --> SYNTH
    SYNTH --> KOEIROCLIENT
    SPEAK --> EMOTE
    EMOTE --> EXPR
    EMOTE --> LIP
```

## Data Flow Architecture

### 1. User Input Flow

```mermaid
sequenceDiagram
    participant User
    participant MIC as MessageInputContainer
    participant Index as Index.tsx
    participant Chat as Chat API
    participant OpenAI as OpenAI API
    
    User->>MIC: Type/Speak Message
    MIC->>Index: onChatProcessStart(text)
    Index->>Chat: POST /api/chat
    Chat->>OpenAI: Stream Request
    OpenAI-->>Chat: Streaming Response
    Chat-->>Index: SSE Stream
    Index->>Index: Process Stream
```

### 2. Message Processing Flow

```mermaid
graph TD
    A[Streaming Text] --> B[Extract Sentences]
    B --> C{Has Emotion Tag?}
    C -->|Yes| D[Parse Emotion]
    C -->|No| E[Use Previous Emotion]
    D --> F[Remove Tag from Text]
    E --> F
    F --> G[Create Screenplay]
    G --> H[Add to Queue]
    H --> I[Process Sequentially]
```

### 3. Voice Synthesis & Animation Flow

```mermaid
sequenceDiagram
    participant Queue as Speech Queue
    participant TTS as TTS API
    participant Koeiro as Koeiromap
    participant Audio as Audio System
    participant VRM as VRM Model
    participant Lip as LipSync
    
    Queue->>TTS: POST /api/tts
    TTS->>Koeiro: Synthesize Request
    Koeiro-->>TTS: Audio (Base64)
    TTS-->>Queue: Audio Buffer
    Queue->>Audio: Play Audio
    Audio->>Lip: Analyze Volume
    Lip->>VRM: Update Mouth Shape
    Queue->>VRM: Set Expression
```

## Component Relationships

### Core System Modules

| Module | Responsibility | Dependencies |
|--------|---------------|--------------|
| **Viewer** | Three.js scene management | Three.js, @pixiv/three-vrm |
| **Model** | VRM model control | Viewer, EmoteController, LipSync |
| **EmoteController** | Expression & behavior management | ExpressionController, AutoBlink, AutoLookAt |
| **Chat System** | AI conversation handling | OpenAI API, Message processor |
| **Voice System** | Text-to-speech synthesis | Koeiromap API, Audio Context |
| **LipSync** | Audio-to-mouth animation | Web Audio API |

### API Layer Architecture

```mermaid
graph TD
    subgraph "Client"
        A[React App]
    end
    
    subgraph "Next.js API Routes"
        B[/api/chat]
        C[/api/tts]
    end
    
    subgraph "External Services"
        D[OpenAI API]
        E[Koeiromap API]
    end
    
    A -->|CORS-safe request| B
    A -->|CORS-safe request| C
    B -->|Server-side request<br/>with API key| D
    C -->|Server-side request<br/>with API key| E
```

## State Management Patterns

### 1. Component State (Local)
```typescript
// In React components
const [chatLog, setChatLog] = useState<Message[]>([]);
const [chatProcessing, setChatProcessing] = useState(false);
const [assistantMessage, setAssistantMessage] = useState("");
```

### 2. Context State (Global)
```typescript
// ViewerContext for 3D viewer instance
const ViewerContext = createContext<{ viewer: Viewer }>();
```

### 3. Persistent State
```typescript
// LocalStorage for settings and history
localStorage.setItem("chatVRMParams", JSON.stringify({
    systemPrompt,
    koeiroParam,
    chatLog
}));
```

## Key Architectural Patterns

### 1. Streaming Architecture
- **Pattern**: Server-Sent Events (SSE) for real-time AI responses
- **Benefits**: Lower latency, progressive UI updates, better perceived performance
- **Implementation**: ReadableStream with chunk processing

### 2. Queue-Based Processing
- **Pattern**: Sequential queue for voice synthesis
- **Benefits**: Rate limiting (1 req/sec), ordered playback, resource management
- **Implementation**: Promise-based queue with async/await

### 3. Component Composition
- **Pattern**: React component composition with hooks
- **Benefits**: Reusable UI components, clear separation of concerns
- **Implementation**: Functional components with custom hooks

### 4. Proxy Pattern
- **Pattern**: API routes as proxies to external services
- **Benefits**: Secure API key management, CORS handling
- **Implementation**: Next.js API routes

### 5. Observer Pattern
- **Pattern**: Event-driven updates for animations
- **Benefits**: Decoupled animation control, smooth transitions
- **Implementation**: Animation mixer with update loops

## Performance Architecture

### Rendering Pipeline
```mermaid
graph LR
    A[RequestAnimationFrame] --> B[Viewer.update]
    B --> C[Model.update]
    C --> D[LipSync.update]
    C --> E[EmoteController.update]
    C --> F[AnimationMixer.update]
    C --> G[VRM.update]
    G --> H[Renderer.render]
```

### Optimization Strategies

1. **Streaming Processing**
   - Process sentences as they arrive
   - Begin voice synthesis before full response
   - Progressive UI updates

2. **Resource Management**
   - Frustum culling disabled for VRM models
   - Texture and geometry cleanup on model change
   - Audio context reuse

3. **Caching**
   - LocalStorage for user preferences
   - In-memory emotion state
   - Audio buffer reuse

## Security Architecture

### API Key Management
```mermaid
graph TD
    A[Client Browser] -->|No API keys| B[Next.js Server]
    B -->|Secure storage| C[Environment Variables]
    C -->|Server-side only| D[External APIs]
```

### Data Flow Security
1. **Client-Server**: HTTPS encryption
2. **API Keys**: Server-side only, never exposed to client
3. **User Data**: Minimal storage, no sensitive data persistence
4. **CORS**: Handled by Next.js API proxy layer

## Deployment Architecture

### Build & Deployment
```mermaid
graph LR
    A[Source Code] --> B[Next.js Build]
    B --> C[Static Assets]
    B --> D[Server Functions]
    C --> E[CDN]
    D --> F[Node.js Server]
    E --> G[Users]
    F --> G
```

### Environment Configuration
- **Development**: Local development server with hot reload
- **Production**: Optimized build with minification
- **Environment Variables**: Separate configs for dev/prod

## Extension Points

### 1. Adding New Emotions
- Extend `EmotionType` enum
- Add expression mappings
- Update system prompt
- Map to voice styles

### 2. Custom VRM Models
- Drag-and-drop support
- Automatic bone mapping
- Expression validation
- Animation compatibility

### 3. Alternative AI Providers
- Implement streaming interface
- Maintain message format
- Handle provider-specific features

### 4. Additional Voice Providers
- Implement TTS interface
- Handle audio format conversion
- Support emotion mapping

## Monitoring & Debugging

### Debug Points
1. **Network**: API route requests and responses
2. **Rendering**: Three.js inspector, WebGL stats
3. **State**: React DevTools, console logging
4. **Audio**: Web Audio API analyzer

### Performance Metrics
- Frame rate (target: 60 FPS)
- API response time
- Voice synthesis latency
- Memory usage

## Future Architecture Considerations

### Scalability
- WebRTC for peer-to-peer features
- WebSocket for real-time collaboration
- Service worker for offline support

### Extensibility
- Plugin system for custom behaviors
- Modular animation system
- Configurable AI personalities

### Platform Support
- Mobile optimization
- VR/AR integration
- Multi-language support