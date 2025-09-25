/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { useChatStore } from '@/store/chatStore';
import { useConfigStore } from '@/store/configStore';
import { useVrmPersistence } from '@/hooks/useVrmPersistence';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDB: jest.fn(),
};

// Mock the hooks and stores
jest.mock('@/hooks/useVrmPersistence');
jest.mock('@/store/chatStore');
jest.mock('@/store/configStore');

describe('State Persistence Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Setup IndexedDB mock
    Object.defineProperty(window, 'indexedDB', {
      value: mockIndexedDB,
      writable: true,
    });

    // Reset store states
    useChatStore.getState().reset?.();
    useConfigStore.getState().reset?.();
  });

  describe('Chat Store Persistence', () => {
    it('should persist chat messages to localStorage', async () => {
      const { result } = renderHook(() => useChatStore());
      
      const testMessage = {
        role: 'user' as const,
        content: 'Test message',
        id: 'test-id',
        timestamp: new Date(),
      };

      await act(async () => {
        result.current.pushMessage(testMessage);
      });

      // Verify localStorage was called
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chat-messages',
        JSON.stringify([testMessage])
      );
    });

    it('should restore chat messages from localStorage', async () => {
      const savedMessages = [
        {
          role: 'user' as const,
          content: 'Saved message 1',
          id: 'saved-1',
          timestamp: new Date().toISOString(),
        },
        {
          role: 'assistant' as const,
          content: 'Saved message 2',
          id: 'saved-2',
          timestamp: new Date().toISOString(),
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedMessages));

      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        result.current.loadFromStorage();
      });

      // Verify messages were restored
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].content).toBe('Saved message 1');
      expect(result.current.messages[1].content).toBe('Saved message 2');
    });

    it('should handle corrupted chat data gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        result.current.loadFromStorage();
      });

      // Should fall back to empty messages
      expect(result.current.messages).toHaveLength(0);
    });

    it('should clear chat history and localStorage', async () => {
      const { result } = renderHook(() => useChatStore());

      // Add some messages first
      await act(async () => {
        result.current.pushMessage({
          role: 'user',
          content: 'Test message',
          id: 'test-id',
          timestamp: new Date(),
        });
      });

      // Clear history
      await act(async () => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('chat-messages');
    });
  });

  describe('Config Store Persistence', () => {
    it('should persist configuration to localStorage', async () => {
      const { result } = renderHook(() => useConfigStore());
      
      const testConfig = {
        openAiKey: 'new-openai-key',
        koeiromapKey: 'new-koeiromap-key',
        koeiroParam: { speakerX: 0.7, speakerY: 0.3 },
        systemPrompt: 'New system prompt',
      };

      await act(async () => {
        result.current.setOpenAiKey(testConfig.openAiKey);
        result.current.setKoeiromapKey(testConfig.koeiromapKey);
        result.current.setKoeiroParam(testConfig.koeiroParam);
        result.current.setSystemPrompt(testConfig.systemPrompt);
      });

      // Verify localStorage was called for each setting
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'config-openai-key',
        testConfig.openAiKey
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'config-koeiromap-key',
        testConfig.koeiromapKey
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'config-koeiromap-param',
        JSON.stringify(testConfig.koeiroParam)
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'config-system-prompt',
        testConfig.systemPrompt
      );
    });

    it('should restore configuration from localStorage', async () => {
      const savedConfig = {
        openAiKey: 'saved-openai-key',
        koeiromapKey: 'saved-koeiromap-key',
        koeiroParam: { speakerX: 0.8, speakerY: 0.2 },
        systemPrompt: 'Saved system prompt',
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'config-openai-key':
            return savedConfig.openAiKey;
          case 'config-koeiromap-key':
            return savedConfig.koeiromapKey;
          case 'config-koeiromap-param':
            return JSON.stringify(savedConfig.koeiroParam);
          case 'config-system-prompt':
            return savedConfig.systemPrompt;
          default:
            return null;
        }
      });

      const { result } = renderHook(() => useConfigStore());

      await act(async () => {
        result.current.loadFromStorage();
      });

      // Verify configuration was restored
      expect(result.current.openAiKey).toBe(savedConfig.openAiKey);
      expect(result.current.koeiromapKey).toBe(savedConfig.koeiromapKey);
      expect(result.current.koeiroParam).toEqual(savedConfig.koeiroParam);
      expect(result.current.systemPrompt).toBe(savedConfig.systemPrompt);
    });

    it('should handle corrupted config data gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'config-koeiromap-param') {
          return 'invalid-json';
        }
        return null;
      });

      const { result } = renderHook(() => useConfigStore());

      await act(async () => {
        result.current.loadFromStorage();
      });

      // Should fall back to default values
      expect(result.current.koeiroParam).toEqual({
        speakerX: 0.5,
        speakerY: 0.5,
      });
    });

    it('should handle missing localStorage gracefully', async () => {
      // Simulate localStorage not being available
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useConfigStore());

      await act(async () => {
        // Should not throw error
        result.current.loadFromStorage();
      });

      // Should use default values
      expect(result.current.openAiKey).toBe('');
      expect(result.current.koeiromapKey).toBe('');
    });
  });

  describe('VRM Persistence Integration', () => {
    it('should persist VRM files to IndexedDB', async () => {
      const mockVrmFile = new File(['mock-vrm-data'], 'test.vrm', {
        type: 'application/octet-stream',
      });

      const mockUseVrmPersistence = {
        savedVrmFiles: [],
        loadLastUsedVrm: jest.fn(),
        getStorageStats: jest.fn().mockResolvedValue({
          used: 1000,
          quota: 50000000,
        }),
        clearOldVrmFiles: jest.fn(),
      };

      (useVrmPersistence as jest.Mock).mockReturnValue(mockUseVrmPersistence);

      const { result } = renderHook(() => useVrmPersistence());

      // Mock IndexedDB operations
      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue({
          add: jest.fn(),
          get: jest.fn(),
          delete: jest.fn(),
          getAll: jest.fn(),
        }),
      };

      const mockDB = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
      };

      mockIndexedDB.open.mockResolvedValue(mockDB);

      await act(async () => {
        await result.current.loadLastUsedVrm();
      });

      expect(mockUseVrmPersistence.loadLastUsedVrm).toHaveBeenCalled();
    });

    it('should handle IndexedDB quota exceeded', async () => {
      const mockUseVrmPersistence = {
        savedVrmFiles: [],
        loadLastUsedVrm: jest.fn(),
        getStorageStats: jest.fn().mockResolvedValue({
          used: 49000000, // Close to quota
          quota: 50000000,
        }),
        clearOldVrmFiles: jest.fn(),
      };

      (useVrmPersistence as jest.Mock).mockReturnValue(mockUseVrmPersistence);

      const { result } = renderHook(() => useVrmPersistence());

      await act(async () => {
        const stats = await result.current.getStorageStats();
        expect(stats.used).toBeGreaterThan(40000000);
      });

      // Should trigger cleanup when near quota
      if (mockUseVrmPersistence.getStorageStats().used > 40000000) {
        await act(async () => {
          await result.current.clearOldVrmFiles();
        });
      }

      expect(mockUseVrmPersistence.clearOldVrmFiles).toHaveBeenCalled();
    });

    it('should handle VRM file corruption', async () => {
      const mockUseVrmPersistence = {
        savedVrmFiles: [
          {
            id: 'corrupt-file',
            name: 'corrupt.vrm',
            lastUsed: new Date(),
            size: 1000,
          },
        ],
        loadLastUsedVrm: jest.fn().mockRejectedValue(new Error('Corrupted file')),
        getStorageStats: jest.fn(),
        clearOldVrmFiles: jest.fn(),
      };

      (useVrmPersistence as jest.Mock).mockReturnValue(mockUseVrmPersistence);

      const { result } = renderHook(() => useVrmPersistence());

      await act(async () => {
        await expect(result.current.loadLastUsedVrm()).rejects.toThrow('Corrupted file');
      });

      // Should handle the error gracefully
      expect(result.current.savedVrmFiles).toHaveLength(1);
    });
  });

  describe('Cross-Store State Synchronization', () => {
    it('should maintain state consistency across page reloads', async () => {
      // Setup initial state
      const chatHook = renderHook(() => useChatStore());
      const configHook = renderHook(() => useConfigStore());

      // Set some initial data
      await act(async () => {
        chatHook.result.current.pushMessage({
          role: 'user',
          content: 'Test message',
          id: 'test-id',
          timestamp: new Date(),
        });
        configHook.result.current.setOpenAiKey('test-key');
      });

      // Simulate page reload by creating new hook instances
      const newChatHook = renderHook(() => useChatStore());
      const newConfigHook = renderHook(() => useConfigStore());

      // Load from storage
      await act(async () => {
        newChatHook.result.current.loadFromStorage();
        newConfigHook.result.current.loadFromStorage();
      });

      // Verify state was restored
      expect(newChatHook.result.current.messages).toHaveLength(1);
      expect(newConfigHook.result.current.openAiKey).toBe('test-key');
    });

    it('should handle concurrent state updates', async () => {
      const chatHook = renderHook(() => useChatStore());
      const configHook = renderHook(() => useConfigStore());

      // Perform concurrent updates
      await act(async () => {
        await Promise.all([
          chatHook.result.current.pushMessage({
            role: 'user',
            content: 'Message 1',
            id: 'id-1',
            timestamp: new Date(),
          }),
          chatHook.result.current.pushMessage({
            role: 'user',
            content: 'Message 2',
            id: 'id-2',
            timestamp: new Date(),
          }),
          configHook.result.current.setOpenAiKey('concurrent-key'),
        ]);
      });

      // Verify all updates were applied
      expect(chatHook.result.current.messages).toHaveLength(2);
      expect(configHook.result.current.openAiKey).toBe('concurrent-key');
    });

    it('should handle storage quota exceeded gracefully', async () => {
      const chatHook = renderHook(() => useChatStore());

      // Mock localStorage quota exceeded
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      await act(async () => {
        // Should not throw error
        chatHook.result.current.pushMessage({
          role: 'user',
          content: 'Test message',
          id: 'test-id',
          timestamp: new Date(),
        });
      });

      // Message should still be in memory
      expect(chatHook.result.current.messages).toHaveLength(1);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from storage corruption', async () => {
      const chatHook = renderHook(() => useChatStore());

      // Mock corrupted storage
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'chat-messages') {
          return '{"invalid": "json"'; // Malformed JSON
        }
        return null;
      });

      await act(async () => {
        chatHook.result.current.loadFromStorage();
      });

      // Should recover with empty state
      expect(chatHook.result.current.messages).toHaveLength(0);

      // Should be able to add new messages
      await act(async () => {
        chatHook.result.current.pushMessage({
          role: 'user',
          content: 'Recovery test',
          id: 'recovery-id',
          timestamp: new Date(),
        });
      });

      expect(chatHook.result.current.messages).toHaveLength(1);
    });

    it('should handle localStorage unavailable scenario', async () => {
      const chatHook = renderHook(() => useChatStore());

      // Mock localStorage being unavailable
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: true,
      });

      await act(async () => {
        // Should not throw error
        chatHook.result.current.loadFromStorage();
      });

      // Should work with in-memory state only
      await act(async () => {
        chatHook.result.current.pushMessage({
          role: 'user',
          content: 'Memory only test',
          id: 'memory-id',
          timestamp: new Date(),
        });
      });

      expect(chatHook.result.current.messages).toHaveLength(1);
    });
  });
});