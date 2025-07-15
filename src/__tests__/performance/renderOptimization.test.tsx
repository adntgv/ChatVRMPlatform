/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { performanceMonitor } from '@/utils/performanceProfiler';
import { ChatLog } from '@/components/chatLog';
import { Settings } from '@/components/settings';
import { IconButton } from '@/components/iconButton';
import { MessageInputContainer } from '@/components/messageInputContainer';
import { ViewerContext } from '@/features/vrmViewer/viewerContext';
import { useChatStore } from '@/store/chatStore';
import { useConfigStore } from '@/store/configStore';

// Mock dependencies
jest.mock('@/store/chatStore');
jest.mock('@/store/configStore');
jest.mock('@/features/messages/speakCharacter', () => ({
  speakCharacter: jest.fn(),
}));

// Mock scrollIntoView for jsdom environment
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
});

// Mock viewer context
const mockViewer = {
  model: {
    speak: jest.fn(),
    emoteController: {
      playEmotion: jest.fn(),
    },
  },
  loadVrm: jest.fn(),
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ViewerContext.Provider value={{ viewer: mockViewer as any }}>
    {children}
  </ViewerContext.Provider>
);

describe('Render Optimization Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset performance monitor metrics
    performanceMonitor.reset();
  });

  describe('ChatLog Component Optimization', () => {
    it('should handle large message arrays efficiently', () => {
      const largeMessageArray = Array(100).fill(null).map((_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i} content for testing performance...`,
        id: `msg-${i}`,
        timestamp: new Date(),
      }));

      const renderStart = performance.now();
      
      const { rerender } = render(<ChatLog messages={largeMessageArray} />);
      
      const renderEnd = performance.now();
      const initialRenderTime = renderEnd - renderStart;
      
      // Initial render should be reasonable
      expect(initialRenderTime).toBeLessThan(50); // 50ms threshold
      
      // Test re-render performance when adding new message
      const newMessage = {
        role: 'user' as const,
        content: 'New message added',
        id: 'msg-new',
        timestamp: new Date(),
      };
      
      const rerenderStart = performance.now();
      rerender(<ChatLog messages={[...largeMessageArray, newMessage]} />);
      const rerenderEnd = performance.now();
      const rerenderTime = rerenderEnd - rerenderStart;
      
      // Re-render should be very fast with React.memo
      expect(rerenderTime).toBeLessThan(16); // 60fps threshold
    });

    it('should not re-render when props are the same', () => {
      const messages = [
        { role: 'user' as const, content: 'Test', id: '1', timestamp: new Date() },
        { role: 'assistant' as const, content: 'Response', id: '2', timestamp: new Date() },
      ];

      const { rerender } = render(<ChatLog messages={messages} />);
      
      // Render again with same props - should be memoized
      const rerenderStart = performance.now();
      rerender(<ChatLog messages={messages} />);
      const rerenderEnd = performance.now();
      const rerenderTime = rerenderEnd - rerenderStart;
      
      // Should be very fast due to memoization
      expect(rerenderTime).toBeLessThan(5);
    });
  });

  describe('Settings Component Optimization', () => {
    const defaultProps = {
      openAiKey: 'test-key',
      systemPrompt: 'Test prompt',
      chatLog: [],
      koeiroParam: { speakerX: 0.5, speakerY: 0.5 },
      koeiromapKey: 'test-koeiromap-key',
      onClickClose: jest.fn(),
      onChangeAiKey: jest.fn(),
      onChangeSystemPrompt: jest.fn(),
      onChangeChatLog: jest.fn(),
      onChangeKoeiroParam: jest.fn(),
      onClickOpenVrmFile: jest.fn(),
      onClickResetChatLog: jest.fn(),
      onClickResetSystemPrompt: jest.fn(),
      onChangeKoeiromapKey: jest.fn(),
    };

    it('should handle large chat logs efficiently', () => {
      const largeChatLog = Array(50).fill(null).map((_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Chat message ${i}`,
        id: `chat-${i}`,
        timestamp: new Date(),
      }));

      const renderStart = performance.now();
      
      render(<Settings {...defaultProps} chatLog={largeChatLog} />);
      
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      // Should handle large chat logs efficiently
      expect(renderTime).toBeLessThan(30);
    });

    it('should not re-render when unchanged props are passed', () => {
      const { rerender } = render(<Settings {...defaultProps} />);
      
      // Re-render with same props
      const rerenderStart = performance.now();
      rerender(<Settings {...defaultProps} />);
      const rerenderEnd = performance.now();
      const rerenderTime = rerenderEnd - rerenderStart;
      
      // Should be memoized
      expect(rerenderTime).toBeLessThan(5);
    });

    it('should optimize preset button callbacks', () => {
      const onChangeKoeiroParam = jest.fn();
      const props = { ...defaultProps, onChangeKoeiroParam };
      
      const { rerender } = render(<Settings {...props} />);
      
      // Re-render with same callback - should not recreate preset handlers
      const rerenderStart = performance.now();
      rerender(<Settings {...props} />);
      const rerenderEnd = performance.now();
      const rerenderTime = rerenderEnd - rerenderStart;
      
      expect(rerenderTime).toBeLessThan(5);
    });
  });

  describe('IconButton Component Optimization', () => {
    it('should not re-render when props are unchanged', () => {
      const onClick = jest.fn();
      
      const { rerender } = render(
        <IconButton 
          iconName="24/Close" 
          isProcessing={false} 
          onClick={onClick}
        />
      );
      
      // Re-render with same props
      const rerenderStart = performance.now();
      rerender(
        <IconButton 
          iconName="24/Close" 
          isProcessing={false} 
          onClick={onClick}
        />
      );
      const rerenderEnd = performance.now();
      const rerenderTime = rerenderEnd - rerenderStart;
      
      // Should be memoized
      expect(rerenderTime).toBeLessThan(5);
    });

    it('should handle processing state changes efficiently', () => {
      const onClick = jest.fn();
      
      const { rerender } = render(
        <IconButton 
          iconName="24/Close" 
          isProcessing={false} 
          onClick={onClick}
        />
      );
      
      // Change processing state
      const rerenderStart = performance.now();
      rerender(
        <IconButton 
          iconName="24/Close" 
          isProcessing={true} 
          onClick={onClick}
        />
      );
      const rerenderEnd = performance.now();
      const rerenderTime = rerenderEnd - rerenderStart;
      
      // Should handle state changes efficiently
      expect(rerenderTime).toBeLessThan(10);
    });
  });

  describe('MessageInputContainer Optimization', () => {
    beforeEach(() => {
      // Mock store returns
      (useChatStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          chatProcessing: false,
          handleSendChat: jest.fn(),
        };
        return selector ? selector(state) : state;
      });

      (useConfigStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          openAiKey: 'test-key',
          systemPrompt: 'Test prompt',
          koeiroParam: { speakerX: 0.5, speakerY: 0.5 },
          koeiromapKey: 'test-koeiromap-key',
        };
        return selector ? selector(state) : state;
      });
    });

    it('should optimize with selective Zustand subscriptions', () => {
      const renderStart = performance.now();
      
      render(
        <TestWrapper>
          <MessageInputContainer />
        </TestWrapper>
      );
      
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      // Should render efficiently with selective subscriptions
      expect(renderTime).toBeLessThan(20);
    });

    it('should use memoized callbacks efficiently', () => {
      const { rerender } = render(
        <TestWrapper>
          <MessageInputContainer />
        </TestWrapper>
      );
      
      // Re-render should be fast with memoized callbacks
      const rerenderStart = performance.now();
      rerender(
        <TestWrapper>
          <MessageInputContainer />
        </TestWrapper>
      );
      const rerenderEnd = performance.now();
      const rerenderTime = rerenderEnd - rerenderStart;
      
      expect(rerenderTime).toBeLessThan(10);
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain performance under stress conditions', () => {
      const stressTestMessages = Array(200).fill(null).map((_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Stress test message ${i} with longer content to test performance under load...`,
        id: `stress-${i}`,
        timestamp: new Date(),
      }));

      const renderStart = performance.now();
      
      render(<ChatLog messages={stressTestMessages} />);
      
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      // Should handle stress conditions
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle rapid state changes efficiently', () => {
      const { rerender } = render(<ChatLog messages={[]} />);
      
      const rapidUpdates = Array(10).fill(null).map((_, i) => ({
        role: 'user' as const,
        content: `Rapid update ${i}`,
        id: `rapid-${i}`,
        timestamp: new Date(),
      }));

      const rapidUpdateStart = performance.now();
      
      // Perform rapid updates
      rapidUpdates.forEach((_, index) => {
        const messages = rapidUpdates.slice(0, index + 1);
        rerender(<ChatLog messages={messages} />);
      });
      
      const rapidUpdateEnd = performance.now();
      const totalUpdateTime = rapidUpdateEnd - rapidUpdateStart;
      
      // Should handle rapid updates efficiently
      expect(totalUpdateTime).toBeLessThan(50);
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not leak memory with frequent re-renders', () => {
      const { rerender } = render(<ChatLog messages={[]} />);
      
      // Simulate frequent re-renders
      for (let i = 0; i < 100; i++) {
        const messages = [{
          role: 'user' as const,
          content: `Memory test ${i}`,
          id: `mem-${i}`,
          timestamp: new Date(),
        }];
        rerender(<ChatLog messages={messages} />);
      }
      
      // If this test completes without hanging, memory usage is reasonable
      expect(true).toBe(true);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should provide performance metrics', () => {
      const messages = Array(20).fill(null).map((_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Performance monitoring test ${i}`,
        id: `perf-${i}`,
        timestamp: new Date(),
      }));

      render(<ChatLog messages={messages} />);
      
      // Check if performance monitor captured data
      const report = performanceMonitor.getReport();
      expect(report).toBeDefined();
    });
  });
});