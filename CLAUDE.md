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
- **Audio Synthesis Flow**: 
  1. Chat response stream → Extract sentences → Convert to screenplay (textsToScreenplay)
  2. Each sentence → Koeiromap API → Audio buffer → Character speech animation
  3. Zustand Integration: handleSendChat accepts audio params (koeiroParam, koeiromapKey, onSpeakAi)
  4. Rate limiting: 1 request/second enforced by speakCharacter queue

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

5. **Error Handling System**
   - `/src/lib/errorHandler.ts`: Centralized error handling utility
   - `/src/components/errorBoundary.tsx`: React error boundary component
   - `/src/pages/_app.tsx`: Global error boundary integration

#### Error Handling Architecture
- **Centralized Error Management**: All errors flow through the `errorHandler` singleton
- **Typed Error System**: `ErrorType` enum categorizes errors (API, VRM_LOADING, AUDIO, etc.)
- **Severity Levels**: `ErrorSeverity` enum (LOW, MEDIUM, HIGH, CRITICAL) controls response
- **Error Context**: Metadata includes component, action, and debugging information
- **User-Facing Messages**: Localized error messages for better user experience
- **React Error Boundary**: Catches component errors and provides fallback UI

**Using the Error System:**
```typescript
import { AppError, ErrorType, ErrorSeverity, errorHandler } from '@/lib/errorHandler';

// Create a typed error
const error = new AppError(
  'API request failed',
  ErrorType.API,
  ErrorSeverity.MEDIUM,
  {
    context: { component: 'ChatStore', action: 'sendMessage' },
    userMessage: 'チャットの送信に失敗しました。'
  }
);

// Handle the error
errorHandler.handle(error);

// Utility functions for common errors
handleApiError(error, 'OpenAI', { component: 'chat' });
handleNetworkError(error, { component: 'tts' });
handleValidationError('Invalid input', 'email');
```

### Environment Variables
```bash
# API Keys
OPEN_AI_KEY=your_openai_key                    # Server-side OpenAI API key fallback
KOEIROMAP_API_KEY=your_koeiromap_key          # Server-side Koeiromap API key fallback

# Base Configuration
BASE_PATH=/optional/base/path                  # For custom deployment paths

# API Endpoints (customizable for proxies or alternative services)
NEXT_PUBLIC_OPENAI_API_URL=https://api.openai.com/v1/chat/completions
NEXT_PUBLIC_KOEIROMAP_API_URL=https://api.rinna.co.jp/koeiromap/v1.0/infer
NEXT_PUBLIC_KOEIROMAP_CTTSE_URL=https://api.rinna.co.jp/models/cttse/koeiro

# Rate Limits & File Size Limits
NEXT_PUBLIC_SPEECH_SYNTHESIS_RATE_LIMIT_MS=1000  # Min delay between TTS requests
NEXT_PUBLIC_VRM_UPLOAD_MAX_SIZE_MB=50            # Max VRM file size

# Animation Configuration
NEXT_PUBLIC_SACCADE_MIN_INTERVAL=0.5             # Eye movement timing
NEXT_PUBLIC_BLINK_CLOSE_MAX=0.12                 # Blink animation values
NEXT_PUBLIC_BLINK_OPEN_MAX=5

# Lighting Settings
NEXT_PUBLIC_DIRECTIONAL_LIGHT_INTENSITY=0.6      # 3D scene lighting
NEXT_PUBLIC_AMBIENT_LIGHT_INTENSITY=0.4

# Additional configurations available in .env.example
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

 # Using Gemini CLI for Large Codebase Analysis

  When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
  context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

  ## File and Directory Inclusion Syntax

  Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
   gemini command:

  ### Examples:

  **Single file analysis:**
  ```bash
  gemini -p "@src/main.py Explain this file's purpose and structure"

  Multiple files:
  gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

  Entire directory:
  gemini -p "@src/ Summarize the architecture of this codebase"

  Multiple directories:
  gemini -p "@src/ @tests/ Analyze test coverage for the source code"

  Current directory and subdirectories:
  gemini -p "@./ Give me an overview of this entire project"
  
#
 Or use --all_files flag:
  gemini --all_files -p "Analyze the project structure and dependencies"

  Implementation Verification Examples

  Check if a feature is implemented:
  gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

  Verify authentication implementation:
  gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

  Check for specific patterns:
  gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

  Verify error handling:
  gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

  Check for rate limiting:
  gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

  Verify caching strategy:
  gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

  Check for specific security measures:
  gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

  Verify test coverage for features:
  gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

  When to Use Gemini CLI

  Use gemini -p when:
  - Analyzing entire codebases or large directories
  - Comparing multiple large files
  - Need to understand project-wide patterns or architecture
  - Current context window is insufficient for the task
  - Working with files totaling more than 100KB
  - Verifying if specific features, patterns, or security measures are implemented
  - Checking for the presence of certain coding patterns across the entire codebase

  Important Notes

  - Paths in @ syntax are relative to your current working directory when invoking gemini
  - The CLI will include file contents directly in the context
  - No need for --yolo flag for read-only analysis
  - Gemini's context window can handle entire codebases that would overflow Claude's context
  - When checking implementations, be specific about what you're looking for to get accurate results

## Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the gemini command:

### Examples:

**Single file analysis:**
```bash
gemini -p "@src/main.py Explain this file's purpose and structure"
```

**Multiple files:**
```bash
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"
```

**Entire directory:**
```bash
gemini -p "@src/ Summarize the architecture of this codebase"
```

**Multiple directories:**
```bash
gemini -p "@src/ @tests/ Analyze test coverage for the source code"
```

**Current directory and subdirectories:**
```bash
gemini -p "@./ Give me an overview of this entire project"
# Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"
```

### Implementation Verification Examples

**Check if a feature is implemented:**
```bash
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"
```

**Verify authentication implementation:**
```bash
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"
```

**Check for specific patterns:**
```bash
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"
```

**Verify error handling:**
```bash
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"
```

**Check for rate limiting:**
```bash
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"
```

**Verify caching strategy:**
```bash
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"
```

**Check for specific security measures:**
```bash
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"
```

**Verify test coverage for features:**
```bash
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"
```

### When to Use Gemini CLI

Use gemini -p when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

### Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results

## Development Best Practices & Workflow

### State Management Implementation Guidelines
When implementing state management or similar architectural changes:
1. **Always consult Gemini CLI early** for architecture decisions using the entire codebase context
2. **Create comprehensive TypeScript interfaces** before implementation
3. **Follow strict TDD approach**: Write failing tests → Implement → Verify all tests pass
4. **Maintain backward compatibility** during migrations - preserve existing functionality
5. **Track progress meticulously** using TodoWrite tool and update tasks.md frequently

### Testing Strategy
1. **Unit tests first**: Test business logic in isolation
2. **Integration tests**: Test how components work together
3. **Performance benchmarks**: For critical paths (especially in 3D/real-time features)
4. **Consider feature flags** for gradual rollouts of major changes

#### Common Testing Patterns & Mocking:
```javascript
// Browser API mocking for jsdom environment
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
});

// ReadableStream polyfill for streaming tests
global.ReadableStream = class ReadableStream {
  constructor() {}
  getReader() {
    return {
      read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
      releaseLock: jest.fn(),
    };
  }
};

// Three.js mocking with required methods
jest.mock('three', () => ({
  Scene: jest.fn(() => ({
    add: jest.fn(),
    remove: jest.fn(), 
    traverse: jest.fn(),
  })),
  Clock: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}));

// Zustand store mocking for component tests
jest.mock('@/store/chatStore', () => ({
  useChatStore: jest.fn((selector) => {
    const mockState = {
      chatProcessing: false,
      chatLog: [],
      handleSendChat: jest.fn(),
    };
    return selector ? selector(mockState) : mockState;
  }),
}));

// Enhanced Zustand mocking pattern for stores with multiple selectors
jest.mock('@/store/configStore', () => ({
  useConfigStore: jest.fn()
}));

// In test setup:
const mockSetSelectedVoicePresetId = jest.fn();
(useConfigStore as unknown as jest.Mock).mockImplementation((selector) => {
  const state = {
    selectedVoicePresetId: 'casual',
    setSelectedVoicePresetId: mockSetSelectedVoicePresetId,
    koeiroParam: { speakerX: 3, speakerY: 3 }
  };
  return selector ? selector(state) : state;
});
```

#### Integration Testing Approach:
1. **Test complete flows**: User input → API call → State update → UI update
2. **Mock external APIs**: Create realistic mock responses for OpenAI, Koeiromap
3. **Test error scenarios**: Network failures, API errors, validation errors
4. **Performance assertions**: Verify operations complete within expected timeframes

### Migration Best Practices
1. **Document migration steps** in tasks.md as subtasks
2. **Create interfaces for external services** with mock implementations first
3. **Migrate incrementally**: Core logic → State → UI components
4. **Validate each step**: Run tests after each migration phase

### Performance Considerations for 3D Applications
1. **Minimize re-renders**: Use granular state subscriptions (Zustand selectors)
2. **Separate concerns**: Business logic in stores, UI logic in components
3. **Profile before optimizing**: Use React DevTools and Chrome Performance tab
4. **Consider WebWorkers** for heavy computations that dont need DOM access

### Critical State Management Patterns (Prevent Infinite Loops)

#### Zustand Selector Anti-patterns to Avoid:
```javascript
// ❌ BAD: Creating objects in selectors causes infinite re-renders
const configState = useConfigStore(state => ({
  openAiKey: state.openAiKey,
  systemPrompt: state.systemPrompt,
}));

// ✅ GOOD: Use individual selectors
const openAiKey = useConfigStore(state => state.openAiKey);
const systemPrompt = useConfigStore(state => state.systemPrompt);

// ✅ GOOD: Or use shallow equality check
import { shallow } from 'zustand/shallow';
const configState = useConfigStore(
  state => ({ openAiKey: state.openAiKey, systemPrompt: state.systemPrompt }),
  shallow
);
```

#### Avoiding Circular Dependencies in useCallback:
```javascript
// ❌ BAD: Circular dependency causes infinite loop
const handleXChange = useCallback((x) => {
  onChange(x, state.y);
}, [onChange, state.y]); // state.y changes → recreates callback → triggers effect → loop

// ✅ GOOD: Use ref to track values without re-renders
const stateRef = useRef(state);
useEffect(() => {
  stateRef.current = state;
}, [state]);

const handleXChange = useCallback((x) => {
  onChange(x, stateRef.current.y);
}, [onChange]); // Stable dependencies
```

#### Testing for Infinite Loops:
```javascript
// Add this test to catch infinite re-renders early
it('should not cause infinite re-renders', () => {
  let renderCount = 0;
  
  const { result } = renderHook(() => {
    renderCount++;
    return useYourHook();
  });

  expect(renderCount).toBe(1); // Should only render once
});
```

#### State Persistence Patterns:
```javascript
// Handling null vs undefined in localStorage persistence
// ❌ BAD: Using nullish coalescing for nullable values
const selectedVoicePresetId = params.selectedVoicePresetId ?? 'default';
// This converts null (valid custom voice state) to 'default'

// ✅ GOOD: Explicitly check for undefined
const selectedVoicePresetId = params.selectedVoicePresetId !== undefined 
  ? params.selectedVoicePresetId 
  : 'default';
// This preserves null for custom voice while providing default for missing values

// ✅ GOOD: Type your storage data interface
interface StorageData {
  systemPrompt?: string;
  koeiroParam?: KoeiroParam;
  selectedVoicePresetId?: string | null;  // Explicitly nullable
  chatLog?: Message[];
}
```

#### React Performance Optimization Patterns:
```javascript
// Selective Zustand subscriptions - minimize re-renders
const chatProcessing = useChatStore(state => state.chatProcessing);
const handleSendChat = useChatStore(state => state.handleSendChat);

// Memoized components prevent unnecessary re-renders
const ChatLog = memo(({ messages }) => {
  // Component implementation
});

// Memoized callbacks prevent child re-renders
const handleSendMessage = useCallback((message) => {
  sendMessage(message);
}, [sendMessage]);

// Memoized expensive calculations
const processedMessages = useMemo(() => {
  return messages.map(msg => processMessage(msg));
}, [messages]);

// Selective state objects to minimize subscriptions
const configState = useConfigStore(state => ({
  openAiKey: state.openAiKey,
  systemPrompt: state.systemPrompt,
  koeiroParam: state.koeiroParam,
  koeiromapKey: state.koeiromapKey,
}));
```

#### Performance Testing Targets:
- **Initial renders**: <50ms for components with large datasets
- **Re-renders**: <16ms for 60fps user experience
- **State updates**: <10ms for smooth interactions
- **Memory usage**: Stable across frequent re-renders

### Documentation Requirements
1. **Update relevant docs** immediately after implementation
2. **Include "why" not just "what"** in architectural decisions
3. **Add examples** for complex features or APIs
4. **Keep tasks.md as single source of truth** for project progress

### Collaboration with Gemini CLI
Use Gemini for:
- Architecture reviews: `gemini -p "@src/ Review this architecture and suggest improvements"`
- Code quality checks: `gemini -p "@src/store/ Are there any anti-patterns in this state management?"`
- Performance analysis: `gemini -p "@src/components/ Identify potential performance bottlenecks"`
- Test coverage gaps: `gemini -p "@src/ @__tests__/ What critical paths lack test coverage?"`
