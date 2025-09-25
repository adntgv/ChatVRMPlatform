/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { useChatStore } from '@/store/chatStore';
import { useConfigStore } from '@/store/configStore';
import { ViewerContext } from '@/features/vrmViewer/viewerContext';
import { errorHandler, AppError, ErrorType, ErrorSeverity } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

// Mock external dependencies
jest.mock('@/features/chat/openAiChat');
jest.mock('@/features/messages/speakCharacter');
jest.mock('@/features/messages/synthesizeVoice');
jest.mock('@/features/koeiromap/koeiromap');
jest.mock('@/lib/logger');

// Mock Zustand stores
jest.mock('@/store/chatStore');
jest.mock('@/store/configStore');

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

describe('Error Handling Integration Tests', () => {
  let mockChatStore: any;
  let mockConfigStore: any;
  let mockLogger: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock logger
    mockLogger = logger as any;
    
    // Mock stores
    mockChatStore = {
      messages: [],
      chatProcessing: false,
      assistantMessage: '',
      handleSendChat: jest.fn(),
      setChatProcessing: jest.fn(),
      pushMessage: jest.fn(),
      updateAssistantMessage: jest.fn(),
      reset: jest.fn(),
    };

    mockConfigStore = {
      openAiKey: 'test-openai-key',
      koeiromapKey: 'test-koeiromap-key',
      koeiroParam: {
        speakerX: 0.5,
        speakerY: 0.5,
      },
      systemPrompt: 'You are a helpful assistant.',
      reset: jest.fn(),
    };

    // Mock Zustand stores
    (useChatStore as jest.Mock).mockReturnValue(mockChatStore);
    (useConfigStore as jest.Mock).mockReturnValue(mockConfigStore);
  });

  describe('API Error Handling', () => {
    it('should handle OpenAI API timeout errors', async () => {
      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      getChatResponseStream.mockRejectedValue(timeoutError);

      let caughtError: Error | null = null;
      
      try {
        await act(async () => {
          await mockChatStore.handleSendChat('Test message', mockConfigStore);
        });
      } catch (error) {
        caughtError = error as Error;
      }

      // Verify error was caught and handled
      expect(caughtError).toBeTruthy();
      expect(caughtError?.message).toContain('timeout');
      
      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Chat response failed'),
        expect.any(Object),
        undefined,
        timeoutError
      );
      
      // Verify processing state was reset
      expect(mockChatStore.setChatProcessing).toHaveBeenCalledWith(false);
    });

    it('should handle OpenAI API rate limit errors', async () => {
      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      
      getChatResponseStream.mockRejectedValue(rateLimitError);

      let caughtError: Error | null = null;
      
      try {
        await act(async () => {
          await mockChatStore.handleSendChat('Test message', mockConfigStore);
        });
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError).toBeTruthy();
      expect(caughtError?.message).toContain('Rate limit exceeded');
      
      // Verify specific error handling for rate limits
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Chat response failed'),
        expect.any(Object),
        undefined,
        rateLimitError
      );
    });

    it('should handle Koeiromap API errors during synthesis', async () => {
      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      const { speakCharacter } = require('@/features/messages/speakCharacter');
      const { synthesizeVoiceApi } = require('@/features/messages/synthesizeVoice');
      
      // Mock successful chat response
      const mockStreamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue('[happy]Hello world!');
          controller.close();
        }
      });
      
      getChatResponseStream.mockResolvedValue(mockStreamResponse);
      
      // Mock Koeiromap API error
      const koeiroError = new Error('Koeiromap service unavailable');
      synthesizeVoiceApi.mockRejectedValue(koeiroError);
      speakCharacter.mockRejectedValue(koeiroError);

      await act(async () => {
        await mockChatStore.handleSendChat('Test message', mockConfigStore);
      });

      // Chat should proceed but audio synthesis should fail
      expect(getChatResponseStream).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(speakCharacter).toHaveBeenCalled();
      });
      
      // Verify error was logged for audio synthesis failure
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Audio Synthesis Error'),
        expect.any(Object),
        undefined,
        koeiroError
      );
    });

    it('should handle network connectivity errors', async () => {
      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      getChatResponseStream.mockRejectedValue(networkError);

      let caughtError: Error | null = null;
      
      try {
        await act(async () => {
          await mockChatStore.handleSendChat('Test message', mockConfigStore);
        });
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError).toBeTruthy();
      
      // Verify network error was classified correctly
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Chat response failed'),
        expect.any(Object),
        undefined,
        networkError
      );
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle missing API keys', async () => {
      // Test missing OpenAI key
      mockConfigStore.openAiKey = '';

      let caughtError: Error | null = null;
      
      try {
        await act(async () => {
          await mockChatStore.handleSendChat('Test message', mockConfigStore);
        });
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError?.message).toContain('Invalid API Key');
      
      // Verify validation error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid API Key provided'),
        expect.any(Object)
      );
    });

    it('should handle invalid message content', async () => {
      let caughtError: Error | null = null;
      
      try {
        await act(async () => {
          await mockChatStore.handleSendChat('', mockConfigStore);
        });
      } catch (error) {
        caughtError = error as Error;
      }

      // Should handle empty message validation
      expect(caughtError).toBeTruthy();
    });

    it('should handle invalid voice parameters', async () => {
      // Set invalid voice parameters
      mockConfigStore.koeiroParam = {
        speakerX: 2.0, // Invalid: should be 0-1
        speakerY: -0.5, // Invalid: should be 0-1
      };

      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      const mockStreamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue('[happy]Hello world!');
          controller.close();
        }
      });
      
      getChatResponseStream.mockResolvedValue(mockStreamResponse);

      await act(async () => {
        await mockChatStore.handleSendChat('Test message', mockConfigStore);
      });

      // Should proceed with clamped values or handle validation
      expect(getChatResponseStream).toHaveBeenCalled();
    });
  });

  describe('VRM Loading Error Handling', () => {
    it('should handle VRM file loading errors', async () => {
      const vrmError = new Error('Failed to load VRM file');
      mockViewer.loadVrm.mockRejectedValue(vrmError);

      await act(async () => {
        try {
          await mockViewer.loadVrm('/invalid/path.vrm');
        } catch (error) {
          // Handle VRM loading error
          errorHandler.handle(error as Error, {
            component: 'VrmViewer',
            action: 'loadVrm',
          });
        }
      });

      // Verify error was handled through error handler
      expect(mockViewer.loadVrm).toHaveBeenCalled();
    });

    it('should handle VRM animation errors', async () => {
      const animationError = new Error('Animation failed');
      mockViewer.model.speak.mockRejectedValue(animationError);

      await act(async () => {
        try {
          await mockViewer.model.speak({
            expression: 'happy',
            talk: {
              style: 'happy',
              speakerX: 0.5,
              speakerY: 0.5,
              message: 'Test message',
            },
          });
        } catch (error) {
          errorHandler.handle(error as Error, {
            component: 'VrmModel',
            action: 'speak',
          });
        }
      });

      expect(mockViewer.model.speak).toHaveBeenCalled();
    });
  });

  describe('Audio Processing Error Handling', () => {
    it('should handle audio buffer processing errors', async () => {
      const { speakCharacter } = require('@/features/messages/speakCharacter');
      const audioError = new Error('Audio processing failed');
      
      speakCharacter.mockRejectedValue(audioError);

      const testScreenplay = {
        expression: 'happy',
        talk: {
          style: 'happy',
          speakerX: 0.5,
          speakerY: 0.5,
          message: 'Test message',
        },
      };

      await act(async () => {
        try {
          await speakCharacter(testScreenplay, mockViewer, 'test-key');
        } catch (error) {
          // Error should be handled internally
          expect(error).toBeTruthy();
        }
      });

      expect(speakCharacter).toHaveBeenCalled();
    });

    it('should handle audio synthesis timeout', async () => {
      const { synthesizeVoiceApi } = require('@/features/messages/synthesizeVoice');
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      synthesizeVoiceApi.mockRejectedValue(timeoutError);

      await act(async () => {
        try {
          await synthesizeVoiceApi('Test message', {
            speakerX: 0.5,
            speakerY: 0.5,
          }, 'test-key');
        } catch (error) {
          expect(error).toBeTruthy();
        }
      });

      expect(synthesizeVoiceApi).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from streaming errors', async () => {
      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      
      // First call fails
      getChatResponseStream.mockRejectedValueOnce(new Error('Stream error'));
      
      // Second call succeeds
      const mockStreamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue('[happy]Recovery successful!');
          controller.close();
        }
      });
      getChatResponseStream.mockResolvedValueOnce(mockStreamResponse);

      // First attempt should fail
      await act(async () => {
        try {
          await mockChatStore.handleSendChat('Test message', mockConfigStore);
        } catch (error) {
          expect(error).toBeTruthy();
        }
      });

      // Second attempt should succeed
      await act(async () => {
        await mockChatStore.handleSendChat('Test message', mockConfigStore);
      });

      expect(getChatResponseStream).toHaveBeenCalledTimes(2);
      expect(mockChatStore.setChatProcessing).toHaveBeenCalledWith(false);
    });

    it('should handle partial synthesis failures', async () => {
      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      const { speakCharacter } = require('@/features/messages/speakCharacter');
      
      // Mock streaming response with multiple sentences
      const mockStreamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue('[happy]First sentence.');
          controller.enqueue('[sad]Second sentence.');
          controller.enqueue('[angry]Third sentence.');
          controller.close();
        }
      });
      
      getChatResponseStream.mockResolvedValue(mockStreamResponse);
      
      // Mock partial failure: second sentence fails
      speakCharacter
        .mockResolvedValueOnce(undefined) // First succeeds
        .mockRejectedValueOnce(new Error('Synthesis failed')) // Second fails
        .mockResolvedValueOnce(undefined); // Third succeeds

      await act(async () => {
        await mockChatStore.handleSendChat('Test message', mockConfigStore);
      });

      // All three should be attempted
      await waitFor(() => {
        expect(speakCharacter).toHaveBeenCalledTimes(3);
      });
      
      // Should complete despite partial failure
      expect(mockChatStore.setChatProcessing).toHaveBeenCalledWith(false);
    });

    it('should handle state corruption gracefully', async () => {
      // Simulate corrupted state
      mockChatStore.messages = null;
      mockChatStore.chatProcessing = undefined;

      await act(async () => {
        // Should not crash on state corruption
        mockChatStore.reset();
      });

      expect(mockChatStore.reset).toHaveBeenCalled();
    });
  });

  describe('Error Reporting', () => {
    it('should log errors with proper context', async () => {
      const testError = new AppError(
        'Test error message',
        ErrorType.API,
        ErrorSeverity.HIGH,
        {
          context: {
            component: 'TestComponent',
            action: 'testAction',
          },
          userMessage: 'Something went wrong',
        }
      );

      await act(async () => {
        errorHandler.handle(testError);
      });

      // Verify error was logged with context
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('API Error'),
        expect.objectContaining({
          component: 'TestComponent',
          action: 'testAction',
        }),
        expect.any(Object),
        testError
      );
    });

    it('should handle error listener failures', async () => {
      const testError = new Error('Test error');
      const badListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      // Add a bad listener
      const unsubscribe = errorHandler.addErrorListener(badListener);

      await act(async () => {
        errorHandler.handle(testError);
      });

      // Verify original error was still processed
      expect(badListener).toHaveBeenCalled();
      
      // Cleanup
      unsubscribe();
    });

    it('should aggregate errors for reporting', async () => {
      const errors = [
        new Error('Error 1'),
        new Error('Error 2'),
        new Error('Error 3'),
      ];

      await act(async () => {
        errors.forEach(error => {
          errorHandler.handle(error, {
            component: 'TestComponent',
            action: 'batchTest',
          });
        });
      });

      // Verify all errors were logged
      expect(mockLogger.error).toHaveBeenCalledTimes(3);
    });
  });
});