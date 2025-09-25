import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ViewerContext } from '@/features/vrmViewer/viewerContext';
import { useEmotionAnimationControls } from '@/hooks/useEmotionAnimationControls';

// Mock dependencies
jest.mock('@/lib/VRMAnimation/loadVRMAnimation');

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

describe('useEmotionAnimationControls', () => {
  let mockViewer: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Create mock viewer
    mockViewer = {
      model: {
        emoteController: {
          playEmotion: jest.fn(),
        },
        mixer: {
          stopAllAction: jest.fn(),
        },
        loadAnimation: jest.fn(),
      },
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ViewerContext.Provider value={{ viewer: mockViewer }}>
      {children}
    </ViewerContext.Provider>
  );

  it('should not cause infinite re-renders', () => {
    let renderCount = 0;
    
    const { result } = renderHook(() => {
      renderCount++;
      return useEmotionAnimationControls();
    }, { wrapper });

    // Initial render
    expect(renderCount).toBe(1);
    
    // Wait a bit to ensure no additional renders
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Should still be 1 render
    expect(renderCount).toBe(1);
  });

  it('should handle emotion changes without errors', () => {
    const { result } = renderHook(() => useEmotionAnimationControls(), { wrapper });

    act(() => {
      result.current.onEmotionChange('happy');
    });

    expect(result.current.currentEmotion).toBe('happy');
    expect(mockViewer.model.emoteController.playEmotion).toHaveBeenCalledWith('happy');
  });

  it('should handle animation operations without errors', async () => {
    const { result } = renderHook(() => useEmotionAnimationControls(), { wrapper });

    // Upload animation
    const file = new File(['test'], 'test.vrma', { type: 'application/octet-stream' });
    
    await act(async () => {
      await result.current.onAnimationUpload(file);
    });

    expect(result.current.animations).toHaveLength(1);
    
    // Stop animation
    act(() => {
      result.current.onAnimationStop();
    });

    expect(mockViewer.model.mixer.stopAllAction).toHaveBeenCalled();
  });

  it('should handle missing viewer model gracefully', () => {
    const noModelViewer = { model: null };
    
    const { result } = renderHook(() => useEmotionAnimationControls(), {
      wrapper: ({ children }) => (
        <ViewerContext.Provider value={{ viewer: noModelViewer as any }}>
          {children}
        </ViewerContext.Provider>
      ),
    });

    // Should not throw when changing emotion with no model
    expect(() => {
      act(() => {
        result.current.onEmotionChange('happy');
      });
    }).not.toThrow();
  });
});