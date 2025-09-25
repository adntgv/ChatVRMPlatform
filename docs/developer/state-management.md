# State Management Guide

## Overview
ChatVRM uses React's built-in state management capabilities with a pragmatic approach: local state for component-specific data, Context API for shared resources, and localStorage for persistence. This guide explains the patterns and best practices used throughout the application.

## State Management Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Storage                       │
│                    (localStorage)                        │
└───────────────────────┬─────────────────────────────────┘
                        │ Persistence
┌───────────────────────┴─────────────────────────────────┐
│                   Application State                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐       ┌─────────────────┐        │
│  │  Global State   │       │   Local State    │        │
│  │  (Context API)  │       │    (useState)    │        │
│  └────────┬────────┘       └────────┬────────┘        │
│           │                          │                   │
│  ┌────────┴────────┐      ┌─────────┴────────┐        │
│  │ ViewerContext   │      │ Component State  │        │
│  │ (3D Viewer)     │      │ (UI, Forms)      │        │
│  └─────────────────┘      └──────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

## State Categories

### 1. Global State (Context API)

#### ViewerContext
**File**: `/src/features/vrmViewer/viewerContext.ts`

Provides global access to the 3D viewer instance.

```typescript
export const ViewerContext = createContext<{
  viewer: Viewer;
}>({
  viewer: new Viewer(),
});

// Usage in components
const { viewer } = useContext(ViewerContext);
```

**Why Context?**
- Single viewer instance shared across components
- Avoids prop drilling
- Centralized 3D scene management

### 2. Local Component State

#### Main Application State
**File**: `/src/pages/index.tsx`

Core application state managed at the root level:

```typescript
// Configuration State
const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
const [openAiKey, setOpenAiKey] = useState("");
const [koeiromapKey, setKoeiromapKey] = useState("");
const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_PARAM);

// Chat State
const [chatProcessing, setChatProcessing] = useState(false);
const [chatLog, setChatLog] = useState<Message[]>([]);
const [assistantMessage, setAssistantMessage] = useState("");
```

#### Component-Specific State
Examples throughout the application:

```typescript
// Menu Component
const [openMenu, setOpenMenu] = useState(false);

// Settings Component
const [openSettings, setOpenSettings] = useState(false);

// VRM Viewer Component
const [isLoading, setIsLoading] = useState(true);
```

### 3. Persistent State (localStorage)

#### Settings Persistence
**Key**: `chatVRMParams`

Automatically synced with localStorage:

```typescript
// Load on mount
useEffect(() => {
  const saved = localStorage.getItem("chatVRMParams");
  if (saved) {
    const params = JSON.parse(saved);
    setSystemPrompt(params.systemPrompt ?? SYSTEM_PROMPT);
    setKoeiroParam(params.koeiroParam ?? DEFAULT_PARAM);
    setChatLog(params.chatLog ?? []);
  }
}, []);

// Save on change
useEffect(() => {
  localStorage.setItem("chatVRMParams", JSON.stringify({
    systemPrompt,
    koeiroParam,
    chatLog
  }));
}, [systemPrompt, koeiroParam, chatLog]);
```

**Persisted Data**:
- System prompt (AI personality)
- Voice parameters (Koeiromap settings)
- Chat history

## State Flow Patterns

### 1. Props Drilling vs Context

**When to use Context**:
```typescript
// GOOD: Shared resource needed by many components
<ViewerContext.Provider value={{ viewer }}>
  <App /> {/* Many nested components need viewer */}
</ViewerContext.Provider>
```

**When to use Props**:
```typescript
// GOOD: Direct parent-child relationship
<MessageInputContainer
  isChatProcessing={chatProcessing}
  onChatProcessStart={handleSendChat}
/>
```

### 2. State Lifting Pattern

Chat state is lifted to the root component for centralized management:

```typescript
// index.tsx (parent)
const [chatLog, setChatLog] = useState<Message[]>([]);

// Pass down to children
<ChatLog messages={chatLog} />
<MessageInput onSend={(msg) => setChatLog([...chatLog, msg])} />
```

### 3. Callback Pattern

Child components communicate with parents through callbacks:

```typescript
// Parent defines handler
const handleSendChat = useCallback(async (text: string) => {
  // Process chat...
}, [dependencies]);

// Child invokes callback
<MessageInputContainer onChatProcessStart={handleSendChat} />
```

## State Update Patterns

### 1. Immutable Updates

Always create new objects/arrays:

```typescript
// GOOD: Create new array
setChatLog([...chatLog, newMessage]);

// GOOD: Create new object
setKoeiroParam({ ...koeiroParam, speakerX: newValue });

// BAD: Mutating existing state
chatLog.push(newMessage); // Don't do this!
```

### 2. Functional Updates

Use when new state depends on previous:

```typescript
// GOOD: Functional update
setChatLog(prev => [...prev, newMessage]);

// Risky: May use stale state
setChatLog([...chatLog, newMessage]);
```

### 3. Batched Updates

React automatically batches updates in event handlers:

```typescript
const handleReset = () => {
  // These are batched into one render
  setChatLog([]);
  setAssistantMessage("");
  setChatProcessing(false);
};
```

## Common State Patterns

### 1. Loading States

```typescript
const [isLoading, setIsLoading] = useState(true);

// Start loading
setIsLoading(true);

try {
  await someAsyncOperation();
} finally {
  setIsLoading(false);
}
```

### 2. Error Handling

```typescript
const [error, setError] = useState<string | null>(null);

try {
  await riskyOperation();
  setError(null);
} catch (e) {
  setError(e.message);
}
```

### 3. Form State

```typescript
// Controlled input pattern
const [inputValue, setInputValue] = useState("");

<input
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
/>
```

### 4. Toggle State

```typescript
const [isOpen, setIsOpen] = useState(false);

// Toggle pattern
const toggle = () => setIsOpen(prev => !prev);
```

## Performance Considerations

### 1. useCallback for Stable References

Prevent unnecessary re-renders:

```typescript
const handleSpeakAi = useCallback(async (screenplay) => {
  // Handler logic...
}, [viewer, koeiromapKey]); // Only recreate if dependencies change
```

### 2. State Colocation

Keep state as close to where it's used:

```typescript
// GOOD: Menu state in Menu component
function Menu() {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}

// BAD: Menu state in root component (unless needed elsewhere)
```

### 3. Avoid Unnecessary State

Derive values instead of storing them:

```typescript
// BAD: Redundant state
const [fullName, setFullName] = useState("");
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");

// GOOD: Derived value
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const fullName = `${firstName} ${lastName}`;
```

## Best Practices

### 1. State Initialization

```typescript
// Lazy initial state for expensive operations
const [state, setState] = useState(() => {
  return expensiveComputation();
});
```

### 2. Effect Dependencies

Always include all dependencies:

```typescript
useEffect(() => {
  // Effect using chatLog and koeiromapKey
}, [chatLog, koeiromapKey]); // Include all deps
```

### 3. Cleanup

Clean up effects and subscriptions:

```typescript
useEffect(() => {
  const timer = setTimeout(() => {}, 1000);
  
  return () => clearTimeout(timer); // Cleanup
}, []);
```

## State Debugging

### 1. React DevTools

Use React DevTools to inspect:
- Component state values
- Context values
- Props flow
- Component re-renders

### 2. Console Logging

```typescript
// Log state changes
useEffect(() => {
  console.log("Chat log updated:", chatLog);
}, [chatLog]);
```

### 3. State Validation

Add validation for critical state:

```typescript
useEffect(() => {
  if (openAiKey && !openAiKey.startsWith('sk-')) {
    console.warn('Invalid OpenAI key format');
  }
}, [openAiKey]);
```

## Anti-Patterns to Avoid

### 1. Modifying State Directly
```typescript
// BAD
state.property = newValue;
setState(state);

// GOOD
setState({ ...state, property: newValue });
```

### 2. Using State for Derived Values
```typescript
// BAD
const [doubleCount, setDoubleCount] = useState(0);
useEffect(() => {
  setDoubleCount(count * 2);
}, [count]);

// GOOD
const doubleCount = count * 2;
```

### 3. Excessive Global State
```typescript
// BAD: Everything in context
<GlobalContext.Provider value={{
  every, single, piece, of, state
}}>

// GOOD: Only truly global state
<ViewerContext.Provider value={{ viewer }}>
```

## Migration Path

If the application grows and requires more sophisticated state management:

### 1. **Small Growth**: Enhanced Context
```typescript
// Create multiple contexts
const ChatContext = createContext();
const SettingsContext = createContext();
const UIContext = createContext();
```

### 2. **Medium Growth**: useReducer
```typescript
const [state, dispatch] = useReducer(reducer, initialState);
```

### 3. **Large Growth**: External Library
Consider Zustand, Jotai, or Redux Toolkit for:
- Complex state logic
- Time-travel debugging
- Middleware requirements
- Multi-store needs

## Summary

ChatVRM's state management is intentionally simple and pragmatic:
- **Local state** for component-specific data
- **Context API** for the shared viewer instance
- **localStorage** for persistence
- **Callbacks** for child-parent communication

This approach provides a good balance of simplicity and functionality for the application's current needs while remaining flexible for future growth.