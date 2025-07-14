# Technical Decision Records

## Overview

This document records significant technical decisions made during the development of ChatVRM. Each record explains the context, decision, rationale, and implications.

## ADR-001: Framework Selection - Next.js

**Date**: 2023-04
**Status**: Accepted
**Context**: Need a React framework that supports both client and server-side functionality for API proxying.

### Decision
Use Next.js as the primary application framework.

### Rationale
- **API Routes**: Built-in support for serverless functions to proxy external APIs
- **SSR/SSG**: Flexibility for rendering strategies
- **File-based Routing**: Simplified project structure
- **Optimization**: Built-in performance optimizations
- **Deployment**: Easy deployment to Vercel or other platforms

### Consequences
- **Positive**: 
  - Simplified API key management
  - Better SEO potential
  - Excellent developer experience
- **Negative**: 
  - Larger bundle size than pure React
  - Learning curve for Next.js specific features

## ADR-002: 3D Rendering - Three.js with @pixiv/three-vrm

**Date**: 2023-04
**Status**: Accepted
**Context**: Need to render and animate VRM 3D models in the browser.

### Decision
Use Three.js with the @pixiv/three-vrm library for VRM support.

### Rationale
- **Three.js**: De facto standard for web 3D graphics
- **@pixiv/three-vrm**: Official VRM implementation for Three.js
- **Community**: Large ecosystem and community support
- **Performance**: Excellent WebGL performance
- **Documentation**: Well-documented with many examples

### Consequences
- **Positive**: 
  - Full control over 3D rendering
  - Extensive VRM format support
  - Custom shader and effect possibilities
- **Negative**: 
  - Steeper learning curve than higher-level libraries
  - Manual optimization required

## ADR-003: AI Integration - OpenAI ChatGPT API

**Date**: 2023-04
**Status**: Accepted
**Context**: Need conversational AI capabilities with Japanese language support.

### Decision
Use OpenAI's ChatGPT API (gpt-3.5-turbo) with streaming support.

### Rationale
- **Quality**: State-of-the-art conversational AI
- **Japanese Support**: Excellent Japanese language capabilities
- **Streaming**: Real-time response streaming for better UX
- **API Stability**: Reliable and well-documented API
- **Cost**: Reasonable pricing for the use case

### Consequences
- **Positive**: 
  - High-quality conversations
  - Low latency with streaming
  - Consistent API experience
- **Negative**: 
  - Dependency on external service
  - API costs scale with usage
  - Requires API key management

## ADR-004: Voice Synthesis - Koeiromap API

**Date**: 2023-04
**Status**: Accepted
**Context**: Need high-quality Japanese text-to-speech with emotion support.

### Decision
Use Koeiromap API for Japanese voice synthesis.

### Rationale
- **Quality**: Natural-sounding Japanese voices
- **Emotion Support**: Multiple voice styles (happy, sad, etc.)
- **Customization**: Voice characteristic parameters (X, Y axes)
- **Integration**: Simple REST API
- **Performance**: Fast synthesis times

### Consequences
- **Positive**: 
  - Expressive character voices
  - Good emotion-to-voice mapping
  - Reliable service
- **Negative**: 
  - Limited to Japanese language
  - Requires separate API key
  - Rate limiting (1 req/sec)

## ADR-005: State Management - React Hooks + Context

**Date**: 2023-04
**Status**: Accepted
**Context**: Need state management for a medium-complexity application.

### Decision
Use React's built-in hooks and Context API instead of external state management libraries.

### Rationale
- **Simplicity**: No additional dependencies
- **Sufficient**: Adequate for current application complexity
- **Modern**: Follows current React best practices
- **Performance**: Good performance with proper optimization
- **Learning**: Lower learning curve for contributors

### Consequences
- **Positive**: 
  - Smaller bundle size
  - Simpler mental model
  - Easier onboarding
- **Negative**: 
  - Manual optimization needed for complex state
  - No time-travel debugging
  - Potential prop drilling in some cases

## ADR-006: Animation System - Custom Implementation

**Date**: 2023-05
**Status**: Accepted
**Context**: Need smooth character animations with VRM-specific features.

### Decision
Build custom animation controllers on top of Three.js animation system.

### Rationale
- **Control**: Full control over animation behavior
- **VRM-specific**: Tailored for VRM model requirements
- **Integration**: Better integration with emotion system
- **Performance**: Can optimize for specific use cases
- **Extensibility**: Easy to add new animation types

### Consequences
- **Positive**: 
  - Precise control over animations
  - Optimized for VRM models
  - Custom blending and transitions
- **Negative**: 
  - More code to maintain
  - Need to handle edge cases
  - Requires animation expertise

## ADR-007: Streaming Architecture - Server-Sent Events

**Date**: 2023-05
**Status**: Accepted
**Context**: Need real-time streaming of AI responses for better UX.

### Decision
Use Server-Sent Events (SSE) for streaming ChatGPT responses.

### Rationale
- **Simplicity**: Simpler than WebSockets for one-way data
- **HTTP/2 Compatible**: Works well with modern infrastructure
- **Automatic Reconnection**: Built-in retry logic
- **Text-based**: Perfect for streaming text responses
- **Browser Support**: Wide browser compatibility

### Consequences
- **Positive**: 
  - Simple implementation
  - Reliable streaming
  - Good error handling
- **Negative**: 
  - One-way communication only
  - Text-only data
  - Connection limits in some browsers

## ADR-008: Voice Input - Web Speech API

**Date**: 2023-05
**Status**: Accepted
**Context**: Need voice input capabilities for hands-free interaction.

### Decision
Use the Web Speech API for voice recognition.

### Rationale
- **Native**: No external dependencies
- **Free**: No additional API costs
- **Integration**: Direct browser integration
- **Performance**: Low latency recognition
- **Languages**: Good language support

### Consequences
- **Positive**: 
  - Zero cost
  - Good performance
  - Simple implementation
- **Negative**: 
  - Browser compatibility issues
  - Limited customization
  - Requires HTTPS

## ADR-009: File Loading - Drag & Drop

**Date**: 2023-06
**Status**: Accepted
**Context**: Need user-friendly way to load custom VRM models.

### Decision
Implement drag-and-drop file loading for VRM models.

### Rationale
- **UX**: Intuitive user interaction
- **Standard**: Common pattern users expect
- **Simple**: Easy to implement with HTML5
- **Direct**: No server upload needed
- **Privacy**: Files stay client-side

### Consequences
- **Positive**: 
  - Better user experience
  - No server storage needed
  - Instant loading
- **Negative**: 
  - Large files may cause UI freeze
  - No file validation before load
  - Memory management concerns

## ADR-010: Error Handling - Graceful Degradation

**Date**: 2023-06
**Status**: Accepted
**Context**: Need robust error handling for external service failures.

### Decision
Implement graceful degradation for all external service failures.

### Rationale
- **UX**: Application remains usable during failures
- **Reliability**: Reduces impact of external dependencies
- **Debugging**: Clear error messages for users
- **Recovery**: Automatic retry where appropriate
- **Fallbacks**: Alternative flows when services fail

### Consequences
- **Positive**: 
  - Better reliability
  - Improved user experience
  - Easier debugging
- **Negative**: 
  - More complex code
  - Additional testing needed
  - Fallback limitations

## ADR-011: Build System - Next.js Built-in

**Date**: 2023-06
**Status**: Accepted
**Context**: Need build system for production deployment.

### Decision
Use Next.js built-in build system without custom webpack configuration.

### Rationale
- **Simplicity**: Zero configuration needed
- **Optimization**: Built-in optimizations sufficient
- **Maintenance**: Less configuration to maintain
- **Updates**: Automatic improvements with Next.js updates
- **Standards**: Follows Next.js best practices

### Consequences
- **Positive**: 
  - Simple build process
  - Reliable builds
  - Good default optimizations
- **Negative**: 
  - Less customization options
  - Dependent on Next.js decisions
  - Some advanced optimizations not possible

## ADR-012: Testing Strategy - Manual Testing

**Date**: 2023-07
**Status**: Accepted (Temporary)
**Context**: MVP development phase with rapid iteration needs.

### Decision
Rely on manual testing initially, plan for automated tests later.

### Rationale
- **Speed**: Faster initial development
- **Flexibility**: Easy to change implementation
- **Focus**: Concentrate on features first
- **Validation**: Manual testing sufficient for MVP
- **Plan**: Add tests once core features stabilize

### Consequences
- **Positive**: 
  - Rapid development
  - Quick iterations
  - Focus on UX
- **Negative**: 
  - No regression protection
  - Manual testing overhead
  - Technical debt

## Future Considerations

### Planned Decisions
1. **Automated Testing**: Jest + React Testing Library
2. **E2E Testing**: Playwright or Cypress
3. **Performance Monitoring**: Web Vitals integration
4. **Analytics**: Privacy-focused analytics solution
5. **Internationalization**: i18n framework selection

### Review Schedule
- Quarterly review of decisions
- Update based on new requirements
- Document any changes or reversals