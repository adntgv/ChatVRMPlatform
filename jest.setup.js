// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock the window.matchMedia API if it doesn't exist
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ReadableStream for streaming tests
global.ReadableStream = class ReadableStream {
  constructor(underlyingSource) {
    this.underlyingSource = underlyingSource;
    this.controller = {
      enqueue: jest.fn(),
      close: jest.fn(),
      error: jest.fn(),
    };
    
    // Start the stream
    if (underlyingSource && underlyingSource.start) {
      underlyingSource.start(this.controller);
    }
  }
  
  getReader() {
    return {
      read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
      releaseLock: jest.fn(),
    };
  }
};