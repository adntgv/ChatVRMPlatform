# Performance Optimization Guide

## Overview

This guide provides strategies and techniques for optimizing the performance of the ChatVRM application. Performance is critical for maintaining smooth 60 FPS animations and responsive user interactions.

## Performance Metrics & Targets

### Key Metrics
- **Frame Rate**: Target 60 FPS, minimum 30 FPS
- **Time to First Speech**: < 2 seconds
- **Memory Usage**: < 500MB for typical session
- **Initial Load Time**: < 3 seconds
- **API Response Time**: < 500ms (excluding network)

### Monitoring Tools
```javascript
// FPS Monitor
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb
document.body.appendChild(stats.dom);

// Performance Observer
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        console.log(entry.name, entry.duration);
    }
});
observer.observe({ entryTypes: ['measure'] });
```

## 3D Rendering Optimizations

### 1. Model Optimization

#### VRM Model Guidelines
```typescript
// Check model complexity
function analyzeVRMModel(vrm: VRM) {
    const meshes = vrm.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            console.log(`Mesh: ${obj.name}`);
            console.log(`Vertices: ${obj.geometry.attributes.position.count}`);
            console.log(`Materials: ${obj.material.length || 1}`);
        }
    });
}

// Recommended limits
const VRM_OPTIMIZATION_TARGETS = {
    maxVertices: 50000,        // Total vertices
    maxMaterials: 10,          // Unique materials
    maxTextures: 8,            // Texture count
    maxTextureSize: 2048,      // Texture resolution
    maxBones: 100              // Bone count
};
```

#### Texture Optimization
```typescript
// Compress textures on load
function optimizeTextures(vrm: VRM) {
    vrm.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            const materials = Array.isArray(obj.material) 
                ? obj.material 
                : [obj.material];
            
            materials.forEach(material => {
                // Reduce texture size if too large
                if (material.map && material.map.image) {
                    const { width, height } = material.map.image;
                    if (width > 2048 || height > 2048) {
                        // Resize texture
                        material.map.minFilter = THREE.LinearMipmapLinearFilter;
                        material.map.generateMipmaps = true;
                    }
                }
            });
        }
    });
}
```

### 2. Rendering Pipeline Optimization

#### Frustum Culling Control
```typescript
// Disable frustum culling for VRM models to prevent disappearing parts
function configureFrustumCulling(vrm: VRM) {
    vrm.scene.traverse((obj) => {
        obj.frustumCulled = false;
    });
}
```

#### Level of Detail (LOD)
```typescript
// Implement LOD for complex scenes
class VRMLODSystem {
    private lod: THREE.LOD;
    
    constructor(vrm: VRM) {
        this.lod = new THREE.LOD();
        
        // High detail (close)
        this.lod.addLevel(vrm.scene, 0);
        
        // Medium detail (mid-range)
        const mediumDetail = this.createSimplifiedModel(vrm, 0.5);
        this.lod.addLevel(mediumDetail, 10);
        
        // Low detail (far)
        const lowDetail = this.createSimplifiedModel(vrm, 0.25);
        this.lod.addLevel(lowDetail, 20);
    }
    
    private createSimplifiedModel(vrm: VRM, detail: number): THREE.Object3D {
        // Implement mesh simplification
        // This is a placeholder - use actual simplification library
        return vrm.scene.clone();
    }
}
```

### 3. Animation Performance

#### Optimized Update Loop
```typescript
class OptimizedAnimationLoop {
    private lastTime = 0;
    private accumulatedTime = 0;
    private readonly targetFPS = 60;
    private readonly targetFrameTime = 1000 / this.targetFPS;
    
    update(currentTime: number) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Skip frame if running too fast
        this.accumulatedTime += deltaTime;
        if (this.accumulatedTime < this.targetFrameTime) {
            return;
        }
        
        // Update with fixed timestep
        while (this.accumulatedTime >= this.targetFrameTime) {
            this.fixedUpdate(this.targetFrameTime / 1000);
            this.accumulatedTime -= this.targetFrameTime;
        }
        
        // Interpolate for smooth rendering
        const alpha = this.accumulatedTime / this.targetFrameTime;
        this.render(alpha);
    }
    
    private fixedUpdate(deltaTime: number) {
        // Physics and game logic here
    }
    
    private render(interpolation: number) {
        // Rendering with interpolation
    }
}
```

#### Expression Update Batching
```typescript
// Batch expression updates
class ExpressionBatcher {
    private pendingUpdates = new Map<string, number>();
    
    setValue(key: string, value: number) {
        this.pendingUpdates.set(key, value);
    }
    
    applyUpdates(vrm: VRM) {
        this.pendingUpdates.forEach((value, key) => {
            vrm.expressionManager?.setValue(key, value);
        });
        this.pendingUpdates.clear();
    }
}
```

## Network & API Optimizations

### 1. Request Optimization

#### Connection Pooling
```typescript
// Reuse connections for API requests
const httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 10
});

const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 10
});
```

#### Request Debouncing
```typescript
// Debounce rapid requests
class DebouncedAPI {
    private timeout: NodeJS.Timeout | null = null;
    
    async makeRequest(
        fn: () => Promise<any>,
        delay: number = 300
    ): Promise<any> {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        
        return new Promise((resolve) => {
            this.timeout = setTimeout(async () => {
                const result = await fn();
                resolve(result);
            }, delay);
        });
    }
}
```

### 2. Streaming Optimization

#### Efficient Stream Processing
```typescript
// Optimize streaming response handling
async function* optimizedStreamProcessor(
    stream: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines only
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.trim()) {
                    yield line;
                }
            }
        }
        
        // Process remaining buffer
        if (buffer.trim()) {
            yield buffer;
        }
    } finally {
        reader.releaseLock();
    }
}
```

### 3. Caching Strategy

#### API Response Caching
```typescript
class APICache {
    private cache = new Map<string, {
        data: any;
        timestamp: number;
        ttl: number;
    }>();
    
    set(key: string, data: any, ttl: number = 300000) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    
    get(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.data;
    }
    
    clear() {
        this.cache.clear();
    }
}
```

## Memory Management

### 1. Resource Cleanup

#### VRM Model Cleanup
```typescript
function cleanupVRMModel(vrm: VRM) {
    // Dispose of geometries
    vrm.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            
            // Dispose of materials
            const materials = Array.isArray(obj.material) 
                ? obj.material 
                : [obj.material];
            
            materials.forEach(material => {
                // Dispose textures
                Object.values(material).forEach(value => {
                    if (value instanceof THREE.Texture) {
                        value.dispose();
                    }
                });
                material.dispose();
            });
        }
    });
    
    // Clear from scene
    vrm.scene.clear();
}
```

#### Audio Buffer Management
```typescript
class AudioBufferPool {
    private pool: AudioBuffer[] = [];
    private maxSize = 10;
    
    getBuffer(
        context: AudioContext,
        length: number,
        sampleRate: number
    ): AudioBuffer {
        // Try to reuse existing buffer
        const existing = this.pool.find(
            b => b.length >= length && b.sampleRate === sampleRate
        );
        
        if (existing) {
            this.pool = this.pool.filter(b => b !== existing);
            return existing;
        }
        
        // Create new buffer
        return context.createBuffer(1, length, sampleRate);
    }
    
    returnBuffer(buffer: AudioBuffer) {
        if (this.pool.length < this.maxSize) {
            this.pool.push(buffer);
        }
    }
}
```

### 2. Memory Leak Prevention

#### Event Listener Management
```typescript
class EventManager {
    private listeners = new Map<string, Set<Function>>();
    
    on(event: string, handler: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);
    }
    
    off(event: string, handler: Function) {
        this.listeners.get(event)?.delete(handler);
    }
    
    cleanup() {
        this.listeners.clear();
    }
}
```

#### React Component Cleanup
```typescript
// Proper cleanup in React components
useEffect(() => {
    const controller = new AbortController();
    let animationFrameId: number;
    
    const animate = () => {
        // Animation logic
        animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
        controller.abort();
        cancelAnimationFrame(animationFrameId);
    };
}, []);
```

## UI Performance

### 1. React Optimizations

#### Memoization
```typescript
// Memoize expensive computations
const MemoizedChatLog = React.memo(({ messages }: { messages: Message[] }) => {
    return (
        <div>
            {messages.map((msg, i) => (
                <MessageItem key={i} message={msg} />
            ))}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison
    return prevProps.messages.length === nextProps.messages.length;
});
```

#### Virtual Scrolling
```typescript
// Implement virtual scrolling for long chat logs
import { FixedSizeList } from 'react-window';

const VirtualChatLog = ({ messages }: { messages: Message[] }) => {
    const Row = ({ index, style }: { index: number; style: any }) => (
        <div style={style}>
            <MessageItem message={messages[index]} />
        </div>
    );
    
    return (
        <FixedSizeList
            height={600}
            itemCount={messages.length}
            itemSize={100}
            width="100%"
        >
            {Row}
        </FixedSizeList>
    );
};
```

### 2. CSS Optimizations

#### GPU Acceleration
```css
/* Use GPU acceleration for animations */
.animated-element {
    will-change: transform;
    transform: translateZ(0); /* Force GPU layer */
}

/* Optimize transitions */
.smooth-transition {
    transition: transform 0.3s ease-out;
    contain: layout style paint;
}
```

#### CSS Containment
```css
/* Limit reflow/repaint scope */
.chat-message {
    contain: content;
}

.settings-panel {
    contain: strict;
}
```

## Bundle Size Optimization

### 1. Code Splitting

#### Dynamic Imports
```typescript
// Lazy load heavy components
const VrmViewer = dynamic(
    () => import('../components/vrmViewer'),
    { 
        loading: () => <LoadingSpinner />,
        ssr: false 
    }
);

// Conditional feature loading
if (userWantsAdvancedFeatures) {
    const { AdvancedFeatures } = await import('../features/advanced');
    AdvancedFeatures.initialize();
}
```

### 2. Tree Shaking

#### Import Optimization
```typescript
// Bad - imports entire library
import * as THREE from 'three';

// Good - imports only needed parts
import { 
    Scene, 
    PerspectiveCamera, 
    WebGLRenderer 
} from 'three';
```

### 3. Compression

#### Next.js Configuration
```javascript
// next.config.js
module.exports = {
    compress: true,
    
    // Optimize images
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
    },
    
    // Minimize JS
    swcMinify: true,
};
```

## Performance Testing

### 1. Load Testing Script
```typescript
// Performance test suite
async function runPerformanceTests() {
    const results = {
        renderingFPS: 0,
        memoryUsage: 0,
        apiLatency: 0,
        speechLatency: 0
    };
    
    // Test rendering performance
    let frames = 0;
    const startTime = performance.now();
    
    const measureFPS = () => {
        frames++;
        if (performance.now() - startTime < 1000) {
            requestAnimationFrame(measureFPS);
        } else {
            results.renderingFPS = frames;
        }
    };
    
    measureFPS();
    
    // Test memory usage
    if (performance.memory) {
        results.memoryUsage = performance.memory.usedJSHeapSize / 1048576;
    }
    
    // Test API latency
    const apiStart = performance.now();
    await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ test: true })
    });
    results.apiLatency = performance.now() - apiStart;
    
    return results;
}
```

### 2. Performance Budget

```javascript
// performance.budget.js
module.exports = {
    bundles: [
        {
            name: 'main',
            maxSize: '300kb'
        },
        {
            name: 'vendor',
            maxSize: '500kb'
        }
    ],
    metrics: {
        FCP: 1500,  // First Contentful Paint
        LCP: 2500,  // Largest Contentful Paint
        TTI: 3500,  // Time to Interactive
        CLS: 0.1    // Cumulative Layout Shift
    }
};
```

## Best Practices Summary

### Do's
1. **Profile First**: Always measure before optimizing
2. **Batch Updates**: Group DOM and WebGL updates
3. **Use Web Workers**: Offload heavy computations
4. **Lazy Load**: Load resources only when needed
5. **Cache Aggressively**: Cache API responses and computed values

### Don'ts
1. **Don't Over-optimize**: Focus on actual bottlenecks
2. **Avoid Premature Optimization**: Build first, optimize later
3. **Don't Block Main Thread**: Use async operations
4. **Avoid Memory Leaks**: Always cleanup resources
5. **Don't Ignore Mobile**: Test on lower-end devices

## Monitoring Checklist

- [ ] Chrome DevTools Performance profiling
- [ ] Memory heap snapshots
- [ ] Network waterfall analysis
- [ ] Lighthouse performance audit
- [ ] Real user monitoring (RUM)
- [ ] FPS counter in development
- [ ] Bundle size tracking
- [ ] API response time logging