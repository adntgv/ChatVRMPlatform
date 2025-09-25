# Browser Compatibility Matrix

## Overview

This document details the browser compatibility requirements and known issues for the ChatVRM application. Due to the use of modern web APIs, certain browsers and versions have limited or no support.

## Browser Support Matrix

### Desktop Browsers

| Browser | Minimum Version | Full Support | Notes |
|---------|----------------|--------------|-------|
| **Chrome** | 80+ | ✅ Yes | Recommended browser |
| **Edge (Chromium)** | 80+ | ✅ Yes | Full feature parity with Chrome |
| **Firefox** | 75+ | ⚠️ Partial | No Web Speech API support |
| **Safari** | 14+ | ⚠️ Partial | Limited Web Speech API, WebGL issues |
| **Opera** | 67+ | ✅ Yes | Chromium-based, full support |

### Mobile Browsers

| Browser | Platform | Support | Notes |
|---------|----------|---------|-------|
| **Chrome** | Android | ⚠️ Partial | Performance limitations |
| **Safari** | iOS | ⚠️ Partial | No Web Speech API, audio restrictions |
| **Edge** | Android/iOS | ⚠️ Partial | Same as platform default |
| **Firefox** | Android | ❌ Limited | No Web Speech API, performance issues |

## Feature Compatibility

### Core Features

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| **WebGL 2.0** | ✅ | ✅ | ✅ | ✅ |
| **Web Audio API** | ✅ | ✅ | ✅ | ✅ |
| **Web Speech API** | ✅ | ✅ | ❌ | ⚠️ |
| **Drag & Drop** | ✅ | ✅ | ✅ | ✅ |
| **Server-Sent Events** | ✅ | ✅ | ✅ | ✅ |
| **ES2020 Features** | ✅ | ✅ | ✅ | ✅ |

### Advanced Features

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| **WebGL Extensions** | ✅ | ✅ | ⚠️ | ⚠️ |
| **OffscreenCanvas** | ✅ | ✅ | ✅ | ❌ |
| **AudioWorklet** | ✅ | ✅ | ✅ | ✅ |
| **SIMD** | ✅ | ✅ | ❌ | ❌ |

## API-Specific Compatibility

### Web Speech API
The Web Speech API is critical for voice input functionality.

```javascript
// Feature detection
const speechRecognitionSupported = () => {
    return 'webkitSpeechRecognition' in window || 
           'SpeechRecognition' in window;
};

// Browser-specific implementation
const SpeechRecognition = window.SpeechRecognition || 
                         window.webkitSpeechRecognition;
```

**Support Status:**
- ✅ **Chrome/Edge**: Full support with `webkitSpeechRecognition`
- ❌ **Firefox**: No support (planned but not implemented)
- ⚠️ **Safari**: Limited support, requires user permission

### WebGL Requirements

```javascript
// WebGL capability detection
function checkWebGLSupport() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || 
               canvas.getContext('webgl') || 
               canvas.getContext('experimental-webgl');
    
    if (!gl) {
        return { supported: false, version: 0 };
    }
    
    const isWebGL2 = gl instanceof WebGL2RenderingContext;
    
    return {
        supported: true,
        version: isWebGL2 ? 2 : 1,
        renderer: gl.getParameter(gl.RENDERER),
        vendor: gl.getParameter(gl.VENDOR),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
    };
}
```

**Minimum Requirements:**
- WebGL 1.0 support (WebGL 2.0 preferred)
- Hardware acceleration enabled
- Sufficient VRAM for textures (minimum 512MB)

### Audio Context Restrictions

Different browsers have varying restrictions on audio playback:

```javascript
// Handle browser-specific audio restrictions
async function initializeAudio() {
    const AudioContext = window.AudioContext || 
                        window.webkitAudioContext;
    const context = new AudioContext();
    
    // Safari requires user interaction
    if (context.state === 'suspended') {
        await context.resume();
    }
    
    return context;
}

// iOS-specific handling
function handleIOSAudio() {
    // iOS requires user interaction to play audio
    document.addEventListener('touchstart', () => {
        const audio = new Audio();
        audio.play().catch(() => {
            // Silent catch - just to unlock audio
        });
    }, { once: true });
}
```

## Known Issues by Browser

### Chrome/Edge Issues
1. **Memory Usage**: High memory consumption with complex VRM models
2. **GPU Process**: May crash with too many textures
3. **Solution**: Implement texture compression and LOD

### Firefox Issues
1. **No Web Speech API**: Voice input not available
2. **WebGL Performance**: Slower than Chromium browsers
3. **Audio Latency**: Higher latency in Web Audio API
4. **Solutions**: 
   - Provide text-only input fallback
   - Optimize rendering pipeline
   - Pre-buffer audio when possible

### Safari Issues
1. **Web Speech API**: Requires explicit permission
2. **WebGL Limitations**: Some extensions not supported
3. **Audio Autoplay**: Strict autoplay policies
4. **CORS**: More restrictive CORS policies
5. **Solutions**:
   - Request permissions explicitly
   - Fallback for missing WebGL features
   - User interaction required for audio
   - Ensure proper CORS headers

## Mobile-Specific Considerations

### Performance Limitations
```javascript
// Detect mobile and adjust quality
function getMobileOptimizations() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(
        navigator.userAgent
    );
    
    if (isMobile) {
        return {
            maxVertices: 25000,      // Reduced from 50000
            textureSize: 1024,       // Reduced from 2048
            shadowsEnabled: false,
            antialiasing: false,
            targetFPS: 30           // Reduced from 60
        };
    }
    
    return null; // Use desktop settings
}
```

### Touch Input Handling
```javascript
// Mobile-friendly drag and drop
function setupMobileFileInput() {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    
    // Fallback for mobile
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
}
```

## Polyfills and Fallbacks

### Required Polyfills
```javascript
// polyfills.js
// TextDecoder for older browsers
if (!window.TextDecoder) {
    window.TextDecoder = require('text-encoding').TextDecoder;
}

// Fetch API for older browsers
if (!window.fetch) {
    window.fetch = require('whatwg-fetch').fetch;
}

// AbortController for older browsers
if (!window.AbortController) {
    window.AbortController = require('abort-controller');
}
```

### Feature Detection and Fallbacks
```javascript
class FeatureDetector {
    static features = {
        webgl: false,
        webgl2: false,
        webaudio: false,
        speechRecognition: false,
        dragAndDrop: false,
        serviceWorker: false,
        webrtc: false
    };
    
    static detect() {
        // WebGL
        const canvas = document.createElement('canvas');
        this.features.webgl = !!(
            canvas.getContext('webgl') || 
            canvas.getContext('experimental-webgl')
        );
        this.features.webgl2 = !!canvas.getContext('webgl2');
        
        // Web Audio
        this.features.webaudio = !!(
            window.AudioContext || 
            window.webkitAudioContext
        );
        
        // Speech Recognition
        this.features.speechRecognition = !!(
            window.SpeechRecognition || 
            window.webkitSpeechRecognition
        );
        
        // Drag and Drop
        this.features.dragAndDrop = 'draggable' in 
            document.createElement('div');
        
        // Service Worker
        this.features.serviceWorker = 'serviceWorker' in navigator;
        
        // WebRTC
        this.features.webrtc = !!(
            window.RTCPeerConnection || 
            window.webkitRTCPeerConnection
        );
        
        return this.features;
    }
    
    static getMissingFeatures() {
        return Object.entries(this.features)
            .filter(([_, supported]) => !supported)
            .map(([feature]) => feature);
    }
}
```

## Testing Recommendations

### Browser Testing Checklist
- [ ] Chrome (Latest, Latest-1, Latest-2)
- [ ] Edge (Latest, Latest-1)
- [ ] Firefox (Latest, Latest-1)
- [ ] Safari (Latest on macOS)
- [ ] Chrome on Android
- [ ] Safari on iOS

### Feature Testing Checklist
- [ ] VRM model loading and rendering
- [ ] Voice input (where supported)
- [ ] Text input fallback
- [ ] Audio playback
- [ ] Drag and drop file upload
- [ ] API communication
- [ ] Memory usage under load
- [ ] Performance on low-end devices

### Automated Testing
```javascript
// browser-test.config.js
module.exports = {
    browsers: [
        'Chrome',
        'Chrome Mobile',
        'Edge',
        'Firefox',
        'Safari'
    ],
    tests: [
        'webgl-support',
        'audio-playback',
        'api-communication',
        'file-upload',
        'memory-usage'
    ]
};
```

## User Agent Detection

```javascript
class BrowserDetector {
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = 'Unknown';
        
        if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Edg') > -1) {
            browser = 'Edge';
            version = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Firefox') > -1) {
            browser = 'Firefox';
            version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
            browser = 'Safari';
            version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
        }
        
        return {
            browser,
            version: parseInt(version),
            isMobile: /Mobile|Android|iPhone|iPad/i.test(ua),
            isSupported: this.checkSupport(browser, version)
        };
    }
    
    static checkSupport(browser, version) {
        const minVersions = {
            'Chrome': 80,
            'Edge': 80,
            'Firefox': 75,
            'Safari': 14
        };
        
        return version >= (minVersions[browser] || 0);
    }
}
```

## Recommendations for Users

### For Best Experience
1. Use **Chrome** or **Edge** (Chromium) latest version
2. Enable hardware acceleration in browser settings
3. Ensure sufficient RAM (4GB+ recommended)
4. Use a dedicated GPU for complex models
5. Keep browser updated to latest version

### Troubleshooting Steps
1. **Check WebGL Support**: Visit `chrome://gpu` or `about:gpu`
2. **Clear Browser Cache**: May resolve loading issues
3. **Disable Extensions**: Some extensions interfere with WebGL
4. **Update Graphics Drivers**: Essential for WebGL performance
5. **Check Console**: F12 for error messages

### Fallback Options
For unsupported browsers:
1. Display compatibility warning
2. Provide download links for supported browsers
3. Offer limited text-only interface
4. Link to browser update instructions