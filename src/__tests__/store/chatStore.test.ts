import { act, renderHook } from '@testing-library/react';
import { useChatStore } from '@/store/chatStore';
import { Message } from '@/features/messages/messages';

// Mock the OpenAI chat function
jest.mock('@/features/chat/openAiChat', () => ({
  getChatResponseStream: jest.fn()
}));

describe('chatStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useChatStore());
    act(() => {
      result.current.clearChat();
      result.current.setChatProcessing(false);
      result.current.setAssistantMessage('');
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useChatStore());
      
      expect(result.current.chatProcessing).toBe(false);
      expect(result.current.chatLog).toEqual([]);
      expect(result.current.assistantMessage).toBe('');
    });
  });

  describe('state setters', () => {
    it('should update chatProcessing state', () => {
      const { result } = renderHook(() => useChatStore());
      
      act(() => {
        result.current.setChatProcessing(true);
      });
      
      expect(result.current.chatProcessing).toBe(true);
    });

    it('should update assistantMessage state', () => {
      const { result } = renderHook(() => useChatStore());
      const testMessage = 'Hello from assistant';
      
      act(() => {
        result.current.setAssistantMessage(testMessage);
      });
      
      expect(result.current.assistantMessage).toBe(testMessage);
    });

    it('should update chatLog state', () => {
      const { result } = renderHook(() => useChatStore());
      const testLog: Message[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];
      
      act(() => {
        result.current.setChatLog(testLog);
      });
      
      expect(result.current.chatLog).toEqual(testLog);
    });
  });

  describe('chat actions', () => {
    it('should add a message to the chat log', () => {
      const { result } = renderHook(() => useChatStore());
      const newMessage: Message = { role: 'user', content: 'Test message' };
      
      act(() => {
        result.current.addMessage(newMessage);
      });
      
      expect(result.current.chatLog).toHaveLength(1);
      expect(result.current.chatLog[0]).toEqual(newMessage);
    });

    it('should add multiple messages to the chat log', () => {
      const { result } = renderHook(() => useChatStore());
      const firstMessage: Message = { role: 'user', content: 'First' };
      const secondMessage: Message = { role: 'assistant', content: 'Second' };
      
      act(() => {
        result.current.addMessage(firstMessage);
        result.current.addMessage(secondMessage);
      });
      
      expect(result.current.chatLog).toHaveLength(2);
      expect(result.current.chatLog).toEqual([firstMessage, secondMessage]);
    });

    it('should update a message in the chat log', () => {
      const { result } = renderHook(() => useChatStore());
      const initialMessages: Message[] = [
        { role: 'user', content: 'Original message' },
        { role: 'assistant', content: 'Assistant response' }
      ];
      
      act(() => {
        result.current.setChatLog(initialMessages);
      });
      
      act(() => {
        result.current.updateMessage(0, 'Updated message');
      });
      
      expect(result.current.chatLog[0].content).toBe('Updated message');
      expect(result.current.chatLog[0].role).toBe('user');
      expect(result.current.chatLog[1]).toEqual(initialMessages[1]);
    });

    it('should clear the chat log', () => {
      const { result } = renderHook(() => useChatStore());
      const initialMessages: Message[] = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Message 2' }
      ];
      
      act(() => {
        result.current.setChatLog(initialMessages);
      });
      
      expect(result.current.chatLog).toHaveLength(2);
      
      act(() => {
        result.current.clearChat();
      });
      
      expect(result.current.chatLog).toEqual([]);
    });
  });

  describe('handleSendChat', () => {
    it('should set processing to true when sending chat', async () => {
      const { result } = renderHook(() => useChatStore());
      
      // Mock the getChatResponseStream to return a promise that never resolves
      // so we can test the processing state
      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      getChatResponseStream.mockImplementation(() => new Promise(() => {}));
      
      act(() => {
        result.current.handleSendChat('Test message', 'test-api-key', 'test-prompt');
      });
      
      expect(result.current.chatProcessing).toBe(true);
    });

    it('should add user message to chat log when sending', async () => {
      const { result } = renderHook(() => useChatStore());
      const userMessage = 'Hello, AI!';
      
      const { getChatResponseStream } = require('@/features/chat/openAiChat');
      getChatResponseStream.mockImplementation(() => new Promise(() => {}));
      
      act(() => {
        result.current.handleSendChat(userMessage, 'test-api-key', 'test-prompt');
      });
      
      expect(result.current.chatLog).toHaveLength(1);
      expect(result.current.chatLog[0]).toEqual({
        role: 'user',
        content: userMessage
      });
    });

    it('should set assistantMessage to error when no API key provided', async () => {
      const { result } = renderHook(() => useChatStore());
      
      await act(async () => {
        await result.current.handleSendChat('Test message', '', 'test-prompt');
      });
      
      expect(result.current.assistantMessage).toBe('API key not entered');
      expect(result.current.chatProcessing).toBe(false);
    });

    it('should not add message when text is empty', async () => {
      const { result } = renderHook(() => useChatStore());
      
      await act(async () => {
        await result.current.handleSendChat('', 'test-api-key', 'test-prompt');
      });
      
      expect(result.current.chatLog).toHaveLength(0);
      expect(result.current.chatProcessing).toBe(false);
    });
  });
});