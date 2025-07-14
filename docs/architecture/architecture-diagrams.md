# ChatVRM Architecture Diagrams

This document contains all the architecture diagrams for the ChatVRM platform in Mermaid format. These can be rendered using any Mermaid-compatible viewer or documentation tool.

## 1. System Overview Diagram

```mermaid
graph TB
    subgraph "User Browser"
        subgraph "Frontend Application"
            UI[React UI Layer]
            THREE[Three.js 3D Engine]
            AUDIO[Audio Processing]
            STATE[State Management]
        end
        
        subgraph "Browser APIs"
            SPEECH[Web Speech API]
            WEBGL[WebGL API]
            WEBAUDIO[Web Audio API]
        end
    end
    
    subgraph "Next.js Application"
        PAGES[Pages/Routes]
        APIPROXY[API Proxy Layer]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI ChatGPT]
        KOEIRO[Koeiromap TTS]
    end
    
    UI --> STATE
    UI --> THREE
    UI --> AUDIO
    UI --> SPEECH
    THREE --> WEBGL
    AUDIO --> WEBAUDIO
    STATE --> PAGES
    PAGES --> APIPROXY
    APIPROXY --> OPENAI
    APIPROXY --> KOEIRO
    
    style UI fill:#e1f5fe
    style THREE fill:#e1f5fe
    style AUDIO fill:#e1f5fe
    style STATE fill:#e1f5fe
    style OPENAI fill:#fff3e0
    style KOEIRO fill:#fff3e0
```

## 2. Detailed Component Architecture

```mermaid
graph TD
    subgraph "Presentation Layer"
        A[VrmViewer Component]
        B[MessageInputContainer]
        C[ChatLog Component]
        D[Settings Panel]
        E[Menu Component]
    end
    
    subgraph "Business Logic Layer"
        subgraph "3D Rendering"
            F[Viewer.ts<br/>Scene Management]
            G[Model.ts<br/>VRM Control]
            H[EmoteController<br/>Expressions]
        end
        
        subgraph "Chat Processing"
            I[OpenAiChat.ts<br/>AI Integration]
            J[Messages.ts<br/>Text Processing]
            K[SpeakCharacter.ts<br/>Speech Control]
        end
        
        subgraph "Voice Synthesis"
            L[SynthesizeVoice.ts<br/>TTS Orchestration]
            M[Koeiromap.ts<br/>API Client]
            N[LipSync.ts<br/>Mouth Animation]
        end
    end
    
    subgraph "Data Layer"
        O[LocalStorage<br/>Persistence]
        P[React Context<br/>Global State]
        Q[Component State<br/>Local State]
    end
    
    A --> F
    F --> G
    G --> H
    B --> I
    I --> J
    J --> K
    K --> L
    L --> M
    K --> N
    N --> H
    D --> O
    E --> P
    C --> Q
```

## 3. Request Flow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant UI as UI Layer
    participant API as API Routes
    participant OAI as OpenAI
    participant TTS as Koeiromap
    participant VRM as VRM Model
    
    U->>UI: Input Message
    UI->>API: POST /api/chat
    API->>OAI: Stream Request
    
    loop Streaming Response
        OAI-->>API: Text Chunk
        API-->>UI: SSE Event
        UI->>UI: Extract Sentence
        
        opt Complete Sentence
            UI->>API: POST /api/tts
            API->>TTS: Synthesize Voice
            TTS-->>API: Audio Data
            API-->>UI: Audio Buffer
            UI->>VRM: Play Speech
            UI->>VRM: Update Expression
            UI->>VRM: Animate Lips
        end
    end
```

## 4. State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Initial: App Load
    
    Initial --> LoadSettings: Check LocalStorage
    LoadSettings --> ConfigureAPIs: Load API Keys
    
    ConfigureAPIs --> Ready: APIs Configured
    ConfigureAPIs --> Introduction: No API Keys
    
    Introduction --> ConfigureAPIs: Enter Keys
    
    Ready --> Chatting: User Input
    Chatting --> Processing: Send to AI
    Processing --> Speaking: Play Response
    Speaking --> Ready: Complete
    
    Ready --> LoadingVRM: Drop VRM File
    LoadingVRM --> Ready: Model Loaded
    
    state Processing {
        [*] --> Streaming
        Streaming --> Parsing
        Parsing --> Queueing
        Queueing --> [*]
    }
    
    state Speaking {
        [*] --> Synthesizing
        Synthesizing --> Playing
        Playing --> Animating
        Animating --> [*]
    }
```

## 5. Animation System Architecture

```mermaid
graph LR
    subgraph "Update Loop (60 FPS)"
        A[RequestAnimationFrame]
        B[Delta Time Calc]
        C[Update Components]
        D[Render Scene]
    end
    
    subgraph "Animation Components"
        E[Animation Mixer<br/>VRMA Playback]
        F[Emote Controller<br/>Facial Expressions]
        G[Auto Blink<br/>Eye Animation]
        H[Auto LookAt<br/>Eye Tracking]
        I[Lip Sync<br/>Mouth Movement]
    end
    
    subgraph "VRM Model"
        J[Bone Transforms]
        K[Morph Targets]
        L[Expression Manager]
    end
    
    A --> B
    B --> C
    C --> E
    C --> F
    C --> G
    C --> H
    C --> I
    
    E --> J
    F --> L
    G --> K
    H --> J
    I --> K
    
    J --> D
    K --> D
    L --> D
```

## 6. Voice Processing Pipeline

```mermaid
graph TD
    A[Text with Emotion Tags] --> B{Parse Emotion}
    B -->|Extract Tag| C[Emotion Type]
    B -->|Remove Tag| D[Clean Text]
    
    C --> E[Map to Voice Style]
    D --> E
    
    E --> F[TTS API Request]
    F --> G[Base64 Audio]
    
    G --> H[Decode Audio]
    H --> I[Create Audio Buffer]
    
    I --> J[Audio Context]
    J --> K[Analyzer Node]
    K --> L[Volume Analysis]
    
    L --> M[Smooth Volume]
    M --> N[Map to Viseme]
    N --> O[Update Mouth Shape]
    
    I --> P[Play Audio]
    P --> Q[Speech Complete]
```

## 7. Error Handling Architecture

```mermaid
graph TD
    A[User Action] --> B{Validation}
    B -->|Invalid| C[Show Error]
    B -->|Valid| D[Process Request]
    
    D --> E{API Call}
    E -->|Success| F[Handle Response]
    E -->|Network Error| G[Retry Logic]
    E -->|API Error| H[Error Message]
    
    G --> I{Retry Count}
    I -->|< Max| E
    I -->|>= Max| J[Fallback Behavior]
    
    F --> K{Response Valid}
    K -->|Yes| L[Update UI]
    K -->|No| M[Log Error]
    
    subgraph "Error Types"
        N[API Key Missing]
        O[Network Timeout]
        P[Invalid Response]
        Q[Audio Playback Error]
        R[Model Load Error]
    end
```

## 8. Data Model Relationships

```mermaid
erDiagram
    Message {
        string role
        string content
        timestamp createdAt
    }
    
    Screenplay {
        string expression
        Talk talk
    }
    
    Talk {
        string message
        string style
        KoeiroParam koeiroParam
    }
    
    KoeiroParam {
        number speakerX
        number speakerY
    }
    
    VRMModel {
        string url
        VRM vrm
        EmoteController emoteController
        LipSync lipSync
    }
    
    EmotionType {
        enum neutral
        enum happy
        enum angry
        enum sad
        enum relaxed
    }
    
    ChatSession ||--o{ Message : contains
    Message ||--|| Screenplay : generates
    Screenplay ||--|| Talk : includes
    Talk ||--|| KoeiroParam : uses
    VRMModel ||--|| EmoteController : has
    Screenplay ||--|| EmotionType : specifies
```

## 9. Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV[Local Dev Server<br/>npm run dev]
    end
    
    subgraph "Build Process"
        BUILD[Next.js Build<br/>npm run build]
        OPTIMIZE[Optimization<br/>- Minification<br/>- Tree Shaking<br/>- Code Splitting]
    end
    
    subgraph "Production Assets"
        STATIC[Static Files<br/>- HTML<br/>- CSS<br/>- JS Bundles]
        SERVER[Server Functions<br/>- API Routes<br/>- SSR Pages]
    end
    
    subgraph "Hosting"
        CDN[CDN<br/>Static Assets]
        NODE[Node.js Server<br/>Dynamic Routes]
    end
    
    subgraph "Client"
        BROWSER[User Browser]
    end
    
    DEV --> BUILD
    BUILD --> OPTIMIZE
    OPTIMIZE --> STATIC
    OPTIMIZE --> SERVER
    STATIC --> CDN
    SERVER --> NODE
    CDN --> BROWSER
    NODE --> BROWSER
```

## 10. Security Architecture

```mermaid
graph TD
    subgraph "Client Side"
        A[Browser Application]
        B[No API Keys]
        C[HTTPS Only]
    end
    
    subgraph "Server Side"
        D[Next.js Server]
        E[Environment Variables]
        F[API Key Storage]
    end
    
    subgraph "External APIs"
        G[OpenAI API]
        H[Koeiromap API]
    end
    
    A -->|Public Request| D
    D -->|Read Keys| E
    E --> F
    D -->|Authenticated Request| G
    D -->|Authenticated Request| H
    
    style B fill:#ffe0e0
    style F fill:#e0ffe0
```

## Usage Instructions

These diagrams can be rendered using:
1. GitHub's built-in Mermaid support
2. Mermaid Live Editor (mermaid.live)
3. VS Code with Mermaid extensions
4. Any Markdown viewer with Mermaid support

To view the diagrams:
1. Copy the Mermaid code block
2. Paste into a Mermaid-compatible viewer
3. The diagram will render automatically