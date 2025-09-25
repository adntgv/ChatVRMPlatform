import { act, renderHook } from '@testing-library/react';
import { useConfigStore } from '@/store/configStore';
import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants';
import { DEFAULT_PARAM, KoeiroParam } from '@/features/constants/koeiroParam';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('configStore', () => {
  beforeEach(() => {
    // Reset mocks and store state before each test
    jest.clearAllMocks();
    const { result } = renderHook(() => useConfigStore());
    act(() => {
      result.current.resetToDefaults();
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useConfigStore());
      
      expect(result.current.systemPrompt).toBe(SYSTEM_PROMPT);
      expect(result.current.openAiKey).toBe('');
      expect(result.current.koeiromapKey).toBe('');
      expect(result.current.koeiroParam).toEqual(DEFAULT_PARAM);
    });
  });

  describe('state setters', () => {
    it('should update systemPrompt', () => {
      const { result } = renderHook(() => useConfigStore());
      const newPrompt = 'Custom system prompt';
      
      act(() => {
        result.current.setSystemPrompt(newPrompt);
      });
      
      expect(result.current.systemPrompt).toBe(newPrompt);
    });

    it('should update openAiKey', () => {
      const { result } = renderHook(() => useConfigStore());
      const apiKey = 'sk-test-key-123';
      
      act(() => {
        result.current.setOpenAiKey(apiKey);
      });
      
      expect(result.current.openAiKey).toBe(apiKey);
    });

    it('should update koeiromapKey', () => {
      const { result } = renderHook(() => useConfigStore());
      const apiKey = 'koeiromap-key-456';
      
      act(() => {
        result.current.setKoeiromapKey(apiKey);
      });
      
      expect(result.current.koeiromapKey).toBe(apiKey);
    });

    it('should update koeiroParam', () => {
      const { result } = renderHook(() => useConfigStore());
      const newParam: KoeiroParam = {
        ...DEFAULT_PARAM,
        speakerX: 0.8,
        speakerY: 0.7
      };
      
      act(() => {
        result.current.setKoeiroParam(newParam);
      });
      
      expect(result.current.koeiroParam).toEqual(newParam);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all values to defaults', () => {
      const { result } = renderHook(() => useConfigStore());
      
      // Set some custom values
      act(() => {
        result.current.setSystemPrompt('Custom prompt');
        result.current.setOpenAiKey('some-key');
        result.current.setKoeiromapKey('another-key');
        result.current.setKoeiroParam({ ...DEFAULT_PARAM, speakerX: 0.9 });
      });
      
      // Reset to defaults
      act(() => {
        result.current.resetToDefaults();
      });
      
      expect(result.current.systemPrompt).toBe(SYSTEM_PROMPT);
      expect(result.current.openAiKey).toBe('');
      expect(result.current.koeiromapKey).toBe('');
      expect(result.current.koeiroParam).toEqual(DEFAULT_PARAM);
    });
  });

  describe('localStorage integration', () => {
    it('should save to localStorage when saveToStorage is called', () => {
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.setSystemPrompt('Test prompt');
        result.current.setKoeiroParam({ ...DEFAULT_PARAM, speakerX: 0.5 });
        result.current.saveToStorage();
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chatVRMParams',
        JSON.stringify({
          systemPrompt: 'Test prompt',
          koeiroParam: { ...DEFAULT_PARAM, speakerX: 0.5 },
          chatLog: [] // This would come from chat store in real implementation
        })
      );
    });

    it('should load from localStorage when loadFromStorage is called', () => {
      const storedData = {
        systemPrompt: 'Stored prompt',
        koeiroParam: { ...DEFAULT_PARAM, speakerX: 0.3 }
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));
      
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.loadFromStorage();
      });
      
      expect(result.current.systemPrompt).toBe('Stored prompt');
      expect(result.current.koeiroParam).toEqual({ ...DEFAULT_PARAM, speakerX: 0.3 });
    });

    it('should handle missing localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.loadFromStorage();
      });
      
      // Should maintain default values
      expect(result.current.systemPrompt).toBe(SYSTEM_PROMPT);
      expect(result.current.koeiroParam).toEqual(DEFAULT_PARAM);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.loadFromStorage();
      });
      
      // Should maintain default values when JSON parsing fails
      expect(result.current.systemPrompt).toBe(SYSTEM_PROMPT);
      expect(result.current.koeiroParam).toEqual(DEFAULT_PARAM);
    });

    it('should handle partial localStorage data', () => {
      const partialData = {
        systemPrompt: 'Only prompt stored'
        // Missing koeiroParam
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(partialData));
      
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.loadFromStorage();
      });
      
      expect(result.current.systemPrompt).toBe('Only prompt stored');
      expect(result.current.koeiroParam).toEqual(DEFAULT_PARAM); // Should fall back to default
    });
  });
});