# VRM Viewer Components Documentation

## Overview
The VRM Viewer is the core 3D rendering system that displays and animates VRM (Virtual Reality Model) characters. It's built on Three.js and uses the `@pixiv/three-vrm` library for VRM support.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  React UI       │────▶│   Viewer     │────▶│   Three.js      │
│  (vrmViewer)    │     │  (Context)   │     │   Scene         │
└─────────────────┘     └──────────────┘     └─────────────────┘
         │                       │                      │
         ▼                       ▼                      ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Drag & Drop    │     │    Model     │     │   Animation     │
│  File Handler   │     │   Manager    │     │   System        │
└─────────────────┘     └──────────────┘     └─────────────────┘
```

## Core Components

### 1. VrmViewer React Component
**File**: `/src/components/vrmViewer.tsx`

The main React component that bridges the UI with the 3D viewer.

**Key Features**:
- Canvas mounting and management
- Drag-and-drop VRM file support
- Loading state management
- Error boundary integration

**Usage**:
```tsx
<VrmViewer />
```

**Props**: None (uses context for viewer instance)

**Key Methods**:
- `canvasRef` callback - Initializes viewer when canvas mounts
- Drag/drop handlers - Allows users to load custom VRM models

### 2. Viewer Class
**File**: `/src/features/vrmViewer/viewer.ts`

Core Three.js scene management and rendering.

**Initialization**:
```typescript
const viewer = new Viewer();
viewer.setup(canvas);
```

**Scene Configuration**:
- **Camera**: Perspective, 20° FOV, positioned at (0, 1.3, 1.5)
- **Lighting**: 
  - Directional light (60% intensity)
  - Ambient light (40% intensity)
- **Renderer**: WebGL with alpha transparency

**Key Methods**:
```typescript
setup(canvas: HTMLCanvasElement): void
loadVrm(url: string): Promise<void>
unloadVrm(): void
update(): void  // Called every frame
resetCamera(): void
```

### 3. Model Class
**File**: `/src/features/vrmViewer/model.ts`

Handles VRM model loading, management, and updates.

**Features**:
- VRM file loading with progress tracking
- Animation system integration
- Emotion controller management
- Lip sync processing

**Loading Process**:
```typescript
// 1. Load VRM file
const gltf = await loader.loadAsync(url, onProgress);

// 2. Extract VRM from GLTF
const vrm = gltf.userData.vrm;

// 3. Initialize subsystems
this._emoteController = new EmoteController(vrm, camera);
this._lipSync = new LipSync(new AudioContext());
```

## Animation System

### VRM Animation Loader
**Directory**: `/src/lib/VRMAnimation/`

Custom implementation for loading and playing VRM animations.

**Key Classes**:
- `VRMAnimation` - Animation data container
- `VRMAnimationLoaderPlugin` - GLTF loader extension
- `loadVRMAnimation()` - Convenience loader function

**Animation Structure**:
```typescript
interface VRMAnimation {
  duration: number;
  tracks: {
    humanoid: Map<VRMHumanBoneName, {
      translation?: Vector3KeyframeTrack;
      rotation?: QuaternionKeyframeTrack;
    }>;
    expressions: Map<string, NumberKeyframeTrack>;
    lookAt?: {
      offsetFromHeadBone?: Vector3KeyframeTrack;
    };
  };
}
```

**Usage Example**:
```typescript
// Load animation
const clip = await loadVRMAnimation("idle_loop.vrma", vrm);

// Play animation
mixer.clipAction(clip).play();
```

## Emotion & Expression System

### EmoteController
**File**: `/src/features/emoteController/emoteController.ts`

Manages character expressions, emotions, and automatic behaviors.

**Features**:
- Emotion presets (happy, angry, sad, relaxed, neutral)
- Automatic blinking
- Eye tracking (look-at)
- Lip synchronization

**API**:
```typescript
// Change emotion
emoteController.playEmotion("happy");

// Update lip sync
emoteController.lipSync("aa", 0.5);
```

### Expression Controller
**File**: `/src/features/emoteController/expressionController.ts`

Handles VRM expression morphing and blending.

**Supported Expressions**:
- `neutral` - Default state
- `happy` - Joy expression
- `angry` - Anger expression  
- `sad` - Sadness expression
- `relaxed` - Calm expression

### Auto Behaviors

#### AutoBlink
**File**: `/src/features/emoteController/autoBlink.ts`

Realistic eye blinking system.

**Configuration**:
```typescript
{
  interval: 4.0,  // seconds between blinks
  speed: 0.2,     // blink duration
}
```

#### AutoLookAt
**File**: `/src/features/emoteController/autoLookAt.ts`

Eye tracking and head movement.

**Features**:
- Smooth target following
- Saccadic eye movements
- Head-eye coordination (40% head, 60% eyes)

## Custom Plugins

### VRMLookAtSmootherLoaderPlugin
**Directory**: `/src/lib/VRMLookAtSmootherLoaderPlugin/`

Enhances default VRM look-at behavior with:
- Smooth interpolation
- Realistic saccades
- User attention limiting

**Configuration**:
```typescript
{
  smoothFactor: 0.1,      // Lerp factor
  userLimitAngle: 90,     // Max angle in degrees
  saccadeProbability: 0.05 // 5% chance per frame
}
```

## Lip Sync System

### LipSync Class
**File**: `/src/features/lipSync/lipSync.ts`

Real-time audio analysis for mouth animation.

**Process**:
1. Analyze audio volume
2. Smooth volume changes
3. Map to "aa" mouth shape
4. Adjust for current emotion

**Usage**:
```typescript
// Analyze audio
const volume = lipSync.update();

// Apply to character
emoteController.lipSync("aa", volume);
```

## Update Loop

The viewer runs a continuous update loop:

```
requestAnimationFrame
    ↓
viewer.update()
    ↓
model.update(deltaTime)
    ├── lipSync.update()
    ├── emoteController.update()
    ├── animationMixer.update()
    └── vrm.update()
    ↓
renderer.render(scene, camera)
```

## Best Practices

### Performance
1. **Disable frustum culling** for VRM models to prevent disappearing parts
2. **Use delta time** for smooth animations regardless of frame rate
3. **Cleanup resources** when switching models

### Model Loading
```typescript
// Always unload previous model
await viewer.unloadVrm();

// Load new model with error handling
try {
  await viewer.loadVrm(modelUrl);
} catch (error) {
  console.error("Failed to load VRM:", error);
}
```

### Animation Playback
```typescript
// Load and play animation
const clip = await loadVRMAnimation(animationUrl, vrm);
const action = mixer.clipAction(clip);

// Configure playback
action.setLoop(THREE.LoopRepeat);
action.play();
```

### Emotion Changes
```typescript
// Play emotion with optional duration
emoteController.playEmotion("happy");

// Reset to neutral
emoteController.playEmotion("neutral");
```

## Extending the Viewer

### Adding New Expressions
1. Add expression name to `EmotionType` in `emoteConstants.ts`
2. Update expression mapping in `expressionController.ts`
3. Add UI controls in settings

### Custom Animations
1. Create VRMA files using VRM animation tools
2. Load using `loadVRMAnimation()`
3. Control playback with AnimationMixer

### Post-Processing Effects
```typescript
// Add to viewer.setup()
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new BloomPass());
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Model parts disappearing | Ensure `frustumCulled = false` on all meshes |
| Stiff movements | Check `VRMLookAtSmoother` configuration |
| No expressions | Verify VRM has required expression morphs |
| Animation not playing | Check animation format and bone mapping |

### Debug Mode
```typescript
// Enable OrbitControls for debugging
viewer._controls.enabled = true;

// Log VRM structure
console.log(vrm.humanoid.humanBones);
console.log(vrm.expressionManager.expressions);
```

## API Reference

### Viewer Context
```typescript
const { viewer } = useContext(ViewerContext);
```

### Loading Models
```typescript
await viewer.loadVrm(url: string): Promise<void>
viewer.unloadVrm(): void
```

### Camera Control
```typescript
viewer.resetCamera(): void
viewer.camera.position.set(x, y, z)
viewer.camera.lookAt(target)
```

### Model Access
```typescript
const model = viewer.model;
const vrm = model?.vrm;
const emoteController = model?.emoteController;
```