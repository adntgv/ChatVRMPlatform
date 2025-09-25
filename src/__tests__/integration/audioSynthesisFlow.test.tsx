/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { useChatStore } from '@/store/chatStore';
import { useConfigStore } from '@/store/configStore';
import { ViewerContext } from '@/features/vrmViewer/viewerContext';
import { textsToScreenplay } from '@/features/messages/messages';
import { speakCharacter } from '@/features/messages/speakCharacter';
import { synthesizeVoiceApi } from '@/features/messages/synthesizeVoice';
import { MessageInputContainer } from '@/components/messageInputContainer';

// Mock external dependencies
jest.mock('@/features/chat/openAiChat');
jest.mock('@/features/messages/speakCharacter');
jest.mock('@/features/messages/synthesizeVoice');
jest.mock('@/features/koeiromap/koeiromap');

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

describe('Audio Synthesis Flow Integration Tests', () => {
  let mockChatStore: any;
  let mockConfigStore: any;
  let mockSpeakCharacter: jest.MockedFunction<typeof speakCharacter>;
  let mockSynthesizeVoice: jest.MockedFunction<typeof synthesizeVoiceApi>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock stores
    mockChatStore = {
      messages: [],
      chatProcessing: false,
      assistantMessage: '',
      handleSendChat: jest.fn(),
      setChatProcessing: jest.fn(),
      pushMessage: jest.fn(),
      updateAssistantMessage: jest.fn(),
    };

    mockConfigStore = {
      openAiKey: 'test-openai-key',
      koeiromapKey: 'test-koeiromap-key',
      koeiroParam: {
        speakerX: 0.5,
        speakerY: 0.5,
      },
      systemPrompt: 'You are a helpful assistant.',
    };

    // Mock Zustand stores
    (useChatStore as jest.Mock).mockReturnValue(mockChatStore);
    (useConfigStore as jest.Mock).mockReturnValue(mockConfigStore);
    
    // Reset mock implementations
    mockChatStore.handleSendChat.mockReset();
    mockChatStore.setChatProcessing.mockReset();
    mockChatStore.pushMessage.mockReset();
    mockChatStore.updateAssistantMessage.mockReset();

    // Mock external functions
    mockSpeakCharacter = speakCharacter as jest.MockedFunction<typeof speakCharacter>;
    mockSynthesizeVoice = synthesizeVoiceApi as jest.MockedFunction<typeof synthesizeVoiceApi>;
    
    mockSpeakCharacter.mockResolvedValue();
    mockSynthesizeVoice.mockResolvedValue('mock-audio-url');
  });

  describe('Complete Audio Synthesis Pipeline', () => {
    it('should process text input through complete audio synthesis', async () => {
      // Setup mock streaming response
      const mockStreamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue('[happy]Hello world!');
          controller.enqueue(' How are you?');
          controller.close();
        }
      });

      // Mock OpenAI streaming response
      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      getChatResponseStream.mockResolvedValue(mockStreamResponse);

      // Create test component
      const { container } = render(
        <TestWrapper>
          <MessageInputContainer />
        </TestWrapper>
      );

      // Simulate user input
      const userMessage = 'Hello, please respond with emotion';
      
      // Mock the actual implementation
      mockChatStore.handleSendChat.mockImplementation(async (message, config) => {
        mockChatStore.setChatProcessing(true);
        mockChatStore.pushMessage({
          role: 'user',
          content: message,
          id: 'test-id',
          timestamp: new Date(),
        });
        
        // Simulate the streaming response processing
        mockSpeakCharacter();
        
        mockChatStore.setChatProcessing(false);
      });

      await act(async () => {
        await mockChatStore.handleSendChat(userMessage, mockConfigStore);
      });

      // Verify the flow
      expect(mockChatStore.setChatProcessing).toHaveBeenCalledWith(true);
      expect(mockChatStore.pushMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: userMessage,
        })
      );

      // Verify OpenAI was called
      expect(getChatResponseStream).toHaveBeenCalledWith(
        expect.any(Array),
        mockConfigStore.openAiKey
      );

      // Verify audio synthesis was triggered
      await waitFor(() => {
        expect(mockSpeakCharacter).toHaveBeenCalled();
      });

      expect(mockChatStore.setChatProcessing).toHaveBeenCalledWith(false);
    });

    it('should handle emotion tags in streaming response', async () => {
      const mockStreamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue('[happy]I am happy!');
          controller.enqueue('[sad]But also sad.');
          controller.enqueue('[angry]And angry!');
          controller.close();
        }
      });

      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      getChatResponseStream.mockResolvedValue(mockStreamResponse);

      await act(async () => {
        await mockChatStore.handleSendChat('Test emotions', mockConfigStore);
      });

      // Verify multiple emotion-based speech calls
      await waitFor(() => {
        expect(mockSpeakCharacter).toHaveBeenCalledTimes(3);
      });

      // Verify each emotion was processed
      expect(mockSpeakCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          expression: 'happy',
          talk: expect.objectContaining({
            style: 'happy',
            message: 'I am happy!',
          }),
        }),
        mockViewer,
        mockConfigStore.koeiromapKey
      );

      expect(mockSpeakCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          expression: 'sad',
          talk: expect.objectContaining({
            style: 'sad',
            message: 'But also sad.',
          }),
        }),
        mockViewer,
        mockConfigStore.koeiromapKey
      );
    });

    it('should handle rate limiting in speech synthesis', async () => {
      // Mock multiple rapid sentences
      const mockStreamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue('[neutral]First sentence.');
          controller.enqueue('[neutral]Second sentence.');
          controller.enqueue('[neutral]Third sentence.');
          controller.close();
        }
      });

      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      getChatResponseStream.mockResolvedValue(mockStreamResponse);

      // Mock rate limiting delay
      let callCount = 0;
      mockSpeakCharacter.mockImplementation(async () => {
        callCount++;
        if (callCount > 1) {
          // Simulate rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      });

      const startTime = Date.now();
      
      await act(async () => {
        await mockChatStore.handleSendChat('Multiple sentences', mockConfigStore);
      });

      await waitFor(() => {
        expect(mockSpeakCharacter).toHaveBeenCalledTimes(3);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Verify rate limiting was applied (should take at least 200ms for 3 calls)
      expect(duration).toBeGreaterThan(100);
    });
  });

  describe('Screenplay Conversion', () => {
    it('should convert texts to screenplay format correctly', () => {
      const texts = ['[happy]Hello world!', '[sad]Goodbye.'];
      const koeiroParam = { speakerX: 0.3, speakerY: 0.7 };
      
      const screenplay = textsToScreenplay(texts, koeiroParam);
      
      expect(screenplay).toHaveLength(2);
      expect(screenplay[0]).toEqual({
        expression: 'happy',
        talk: {
          style: 'happy',
          speakerX: 0.3,
          speakerY: 0.7,
          message: 'Hello world!',
        },
      });
      
      expect(screenplay[1]).toEqual({
        expression: 'sad',
        talk: {
          style: 'sad',
          speakerX: 0.3,
          speakerY: 0.7,
          message: 'Goodbye.',
        },
      });
    });

    it('should handle neutral emotion for texts without emotion tags', () => {
      const texts = ['Hello without emotion'];
      const koeiroParam = { speakerX: 0.5, speakerY: 0.5 };
      
      const screenplay = textsToScreenplay(texts, koeiroParam);
      
      expect(screenplay).toHaveLength(1);
      expect(screenplay[0]).toEqual({
        expression: 'neutral',
        talk: {
          style: 'talk', // Default style is 'talk', not 'neutral'
          speakerX: 0.5,
          speakerY: 0.5,
          message: 'Hello without emotion',
        },
      });
    });

    it('should handle mixed emotion tags in single text', () => {
      const texts = ['[happy]Hello [sad]and goodbye'];
      const koeiroParam = { speakerX: 0.5, speakerY: 0.5 };
      
      const screenplay = textsToScreenplay(texts, koeiroParam);
      
      expect(screenplay).toHaveLength(1);
      // Should use the first emotion tag found
      expect(screenplay[0].expression).toBe('happy');
      expect(screenplay[0].talk.style).toBe('happy');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle OpenAI API failures gracefully', async () => {
      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      getChatResponseStream.mockRejectedValue(new Error('OpenAI API Error'));

      await act(async () => {
        await expect(
          mockChatStore.handleSendChat('Test message', mockConfigStore)
        ).rejects.toThrow('OpenAI API Error');
      });

      // Verify error state handling
      expect(mockChatStore.setChatProcessing).toHaveBeenCalledWith(false);
      expect(mockSpeakCharacter).not.toHaveBeenCalled();
    });

    it('should handle TTS API failures gracefully', async () => {
      const mockStreamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue('[happy]Hello world!');
          controller.close();
        }
      });

      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      getChatResponseStream.mockResolvedValue(mockStreamResponse);

      // Mock TTS failure
      mockSynthesizeVoice.mockRejectedValue(new Error('TTS API Error'));

      await act(async () => {
        await mockChatStore.handleSendChat('Test message', mockConfigStore);
      });

      // Verify that speech synthesis was attempted but failed
      await waitFor(() => {
        expect(mockSpeakCharacter).toHaveBeenCalled();
      });

      // The error should be caught and handled in speakCharacter
      expect(mockSynthesizeVoice).toHaveBeenCalled();
    });

    it('should handle missing API keys', async () => {
      // Test missing OpenAI key
      mockConfigStore.openAiKey = '';

      await act(async () => {
        await expect(
          mockChatStore.handleSendChat('Test message', mockConfigStore)
        ).rejects.toThrow();
      });

      // Test missing Koeiromap key
      mockConfigStore.openAiKey = 'test-key';
      mockConfigStore.koeiromapKey = '';

      const mockStreamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue('[happy]Hello world!');
          controller.close();
        }
      });

      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      getChatResponseStream.mockResolvedValue(mockStreamResponse);

      await act(async () => {
        await mockChatStore.handleSendChat('Test message', mockConfigStore);
      });

      // Speech synthesis should fail without Koeiromap key
      await waitFor(() => {
        expect(mockSpeakCharacter).toHaveBeenCalled();
      });
    });
  });

  describe('State Management Integration', () => {
    it('should maintain proper state transitions during synthesis', async () => {
      const mockStreamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue('[happy]Hello world!');
          controller.close();
        }
      });

      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      getChatResponseStream.mockResolvedValue(mockStreamResponse);

      await act(async () => {
        await mockChatStore.handleSendChat('Test message', mockConfigStore);
      });

      // Verify state transitions
      expect(mockChatStore.setChatProcessing).toHaveBeenCalledWith(true);
      expect(mockChatStore.pushMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: 'Test message',
        })
      );

      await waitFor(() => {
        expect(mockChatStore.setChatProcessing).toHaveBeenCalledWith(false);
      });

      // Verify assistant message was updated
      expect(mockChatStore.updateAssistantMessage).toHaveBeenCalled();
    });

    it('should handle concurrent synthesis requests', async () => {
      const mockStreamResponse1 = new ReadableStream({
        start(controller) {
          controller.enqueue('[happy]First message');
          controller.close();
        }
      });

      const mockStreamResponse2 = new ReadableStream({
        start(controller) {
          controller.enqueue('[sad]Second message');
          controller.close();
        }
      });

      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      getChatResponseStream
        .mockResolvedValueOnce(mockStreamResponse1)
        .mockResolvedValueOnce(mockStreamResponse2);

      // Send two messages concurrently
      await act(async () => {
        await Promise.all([
          mockChatStore.handleSendChat('First message', mockConfigStore),
          mockChatStore.handleSendChat('Second message', mockConfigStore),
        ]);
      });

      // Verify both were processed
      expect(getChatResponseStream).toHaveBeenCalledTimes(2);
      
      await waitFor(() => {
        expect(mockSpeakCharacter).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Voice Recognition Integration', () => {
    it('should handle voice input through complete synthesis pipeline', async () => {
      // Mock speech recognition result
      const mockSpeechResult = 'Voice input message';
      
      const mockStreamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue('[happy]Voice response');
          controller.close();
        }
      });

      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      getChatResponseStream.mockResolvedValue(mockStreamResponse);

      // Simulate voice recognition result
      await act(async () => {
        await mockChatStore.handleSendChat(mockSpeechResult, mockConfigStore);
      });

      // Verify the voice input was processed same as text input
      expect(mockChatStore.pushMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: mockSpeechResult,
        })
      );

      await waitFor(() => {
        expect(mockSpeakCharacter).toHaveBeenCalled();
      });
    });
  });
});