import { useConfigStore } from '@/store/configStore';
import { renderHook, act } from '@testing-library/react';

describe('ConfigStore - Voice Preset Functionality', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store to initial state
    useConfigStore.setState({
      systemPrompt: '',
      openAiKey: '',
      koeiromapKey: '',
      koeiroParam: { speakerX: 3, speakerY: 3 },
      selectedVoicePresetId: 'casual'
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('selectedVoicePresetId', () => {
    it('should have default selectedVoicePresetId as casual', () => {
      const { result } = renderHook(() => useConfigStore());
      expect(result.current.selectedVoicePresetId).toBe('casual');
    });

    it('should update selectedVoicePresetId', () => {
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.setSelectedVoicePresetId('professional');
      });

      expect(result.current.selectedVoicePresetId).toBe('professional');
    });

    it('should allow setting selectedVoicePresetId to null for custom voices', () => {
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.setSelectedVoicePresetId(null);
      });

      expect(result.current.selectedVoicePresetId).toBeNull();
    });

    it('should reset selectedVoicePresetId to default on resetToDefaults', () => {
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.setSelectedVoicePresetId('deep');
        result.current.resetToDefaults();
      });

      expect(result.current.selectedVoicePresetId).toBe('casual');
    });
  });

  describe('localStorage persistence for selectedVoicePresetId', () => {
    it('should save selectedVoicePresetId to localStorage', () => {
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.setSelectedVoicePresetId('cute');
        result.current.saveToStorage();
      });

      const stored = localStorage.getItem('chatVRMParams');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.selectedVoicePresetId).toBe('cute');
    });

    it('should load selectedVoicePresetId from localStorage', () => {
      const testData = {
        systemPrompt: 'Test prompt',
        koeiroParam: { speakerX: 5, speakerY: 5 },
        selectedVoicePresetId: 'robot',
        chatLog: []
      };
      
      localStorage.setItem('chatVRMParams', JSON.stringify(testData));
      
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.loadFromStorage();
      });

      expect(result.current.selectedVoicePresetId).toBe('robot');
    });

    it('should use default selectedVoicePresetId if not in localStorage', () => {
      const testData = {
        systemPrompt: 'Test prompt',
        koeiroParam: { speakerX: 5, speakerY: 5 },
        chatLog: []
        // selectedVoicePresetId intentionally omitted
      };
      
      localStorage.setItem('chatVRMParams', JSON.stringify(testData));
      
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.loadFromStorage();
      });

      expect(result.current.selectedVoicePresetId).toBe('casual');
    });

    it('should handle null selectedVoicePresetId in persistence', () => {
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.setSelectedVoicePresetId(null);
        result.current.saveToStorage();
      });

      const stored = localStorage.getItem('chatVRMParams');
      const parsed = JSON.parse(stored!);
      expect(parsed.selectedVoicePresetId).toBeNull();

      // Clear and reload
      act(() => {
        useConfigStore.setState({ selectedVoicePresetId: 'casual' });
        result.current.loadFromStorage();
      });

      expect(result.current.selectedVoicePresetId).toBeNull();
    });
  });

  describe('Integration with voice parameters', () => {
    it('should maintain both selectedVoicePresetId and koeiroParam independently', () => {
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.setSelectedVoicePresetId('happy');
        result.current.setKoeiroParam({ speakerX: 6, speakerY: 7 });
      });

      expect(result.current.selectedVoicePresetId).toBe('happy');
      expect(result.current.koeiroParam).toEqual({ speakerX: 6, speakerY: 7 });
    });

    it('should allow custom voice parameters with null presetId', () => {
      const { result } = renderHook(() => useConfigStore());
      
      act(() => {
        result.current.setSelectedVoicePresetId(null);
        result.current.setKoeiroParam({ speakerX: -2.5, speakerY: 8.3 });
      });

      expect(result.current.selectedVoicePresetId).toBeNull();
      expect(result.current.koeiroParam).toEqual({ speakerX: -2.5, speakerY: 8.3 });
    });
  });

  describe('Error handling', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      // Set corrupted data
      localStorage.setItem('chatVRMParams', 'invalid json');
      
      const { result } = renderHook(() => useConfigStore());
      
      // Should not throw, should use defaults
      act(() => {
        result.current.loadFromStorage();
      });

      expect(result.current.selectedVoicePresetId).toBe('casual');
    });

    it('should handle localStorage quota exceeded gracefully', () => {
      const { result } = renderHook(() => useConfigStore());
      
      // Mock localStorage.setItem to throw quota exceeded error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      act(() => {
        result.current.setSelectedVoicePresetId('whisper');
        result.current.saveToStorage();
      });

      // State should still be updated even if save failed
      expect(result.current.selectedVoicePresetId).toBe('whisper');

      // Restore original
      Storage.prototype.setItem = originalSetItem;
    });
  });
});