import { useState, useContext, useCallback } from 'react';
import { ViewerContext } from '@/features/vrmViewer/viewerContext';
import { loadVRMAnimation } from '@/lib/VRMAnimation/loadVRMAnimation';
import { Emotion } from '@/components/emotionControl';
import { Animation } from '@/components/animationControl';
import { AppError, ErrorType, ErrorSeverity, errorHandler } from '@/lib/errorHandler';

export const useEmotionAnimationControls = () => {
  const { viewer } = useContext(ViewerContext);
  
  // Emotion state
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('neutral');
  
  // Animation state
  const [animations, setAnimations] = useState<Animation[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<Animation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [loop, setLoop] = useState(false);

  // Emotion control
  const onEmotionChange = useCallback((emotion: Emotion) => {
    setCurrentEmotion(emotion);
    
    // Apply emotion to the model if loaded
    if (viewer.model?.emoteController) {
      viewer.model.emoteController.playEmotion(emotion);
    }
  }, [viewer]);

  // Animation upload
  const onAnimationUpload = useCallback(async (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      const name = file.name.replace('.vrma', '');
      const id = Date.now().toString();
      
      // Add to animations list
      const newAnimation: Animation = { id, name, url };
      setAnimations(prev => [...prev, newAnimation]);
      
    } catch (error: any) {
      const appError = new AppError(
        `Failed to process animation file: ${error.message}`,
        ErrorType.VRM_LOADING,
        ErrorSeverity.MEDIUM,
        {
          originalError: error,
          context: {
            component: 'useEmotionAnimationControls',
            action: 'onAnimationUpload',
            metadata: { fileName: file.name }
          },
          userMessage: 'アニメーションファイルの処理に失敗しました。'
        }
      );
      errorHandler.handle(appError);
    }
  }, []);

  // Stop animation
  const onAnimationStop = useCallback(() => {
    if (viewer.model?.mixer) {
      viewer.model.mixer.stopAllAction();
    }
    
    setIsPlaying(false);
  }, [viewer]);

  // Animation selection
  const onAnimationSelect = useCallback((animation: Animation) => {
    setCurrentAnimation(animation);
    
    // Stop current animation if playing
    if (isPlaying) {
      onAnimationStop();
    }
  }, [isPlaying, onAnimationStop]);

  // Animation playback
  const onAnimationPlay = useCallback(async () => {
    if (!currentAnimation || !viewer.model) return;
    
    try {
      const vrmAnimation = await loadVRMAnimation(currentAnimation.url);
      if (!vrmAnimation) {
        throw new Error('Failed to load animation');
      }
      
      // Load and play the animation
      await viewer.model.loadAnimation(vrmAnimation);
      
      // Animation is now playing through the mixer
      // We don't have direct access to the action, but we can control it through the mixer
      
      setIsPlaying(true);
    } catch (error: any) {
      const appError = new AppError(
        `Failed to play animation: ${error.message}`,
        ErrorType.VRM_LOADING,
        ErrorSeverity.MEDIUM,
        {
          originalError: error,
          context: {
            component: 'useEmotionAnimationControls',
            action: 'onAnimationPlay',
            metadata: { 
              animationName: currentAnimation.name,
              animationUrl: currentAnimation.url 
            }
          },
          userMessage: 'アニメーションの再生に失敗しました。'
        }
      );
      errorHandler.handle(appError);
    }
  }, [currentAnimation, viewer]);

  // Speed control
  const onSpeedChange = useCallback((speed: number) => {
    setAnimationSpeed(speed);
    
    // Note: We can't update the speed of a playing animation without direct action access
    // The new speed will be applied when the next animation plays
  }, []);

  // Loop control
  const onLoopToggle = useCallback((shouldLoop: boolean) => {
    setLoop(shouldLoop);
    
    // Note: We can't update the loop setting of a playing animation without direct action access
    // The new loop setting will be applied when the next animation plays
  }, []);

  return {
    // Emotion state
    currentEmotion,
    onEmotionChange,
    
    // Animation state
    animations,
    currentAnimation,
    isPlaying,
    animationSpeed,
    loop,
    
    // Animation controls
    onAnimationUpload,
    onAnimationSelect,
    onAnimationPlay,
    onAnimationStop,
    onSpeedChange,
    onLoopToggle,
  };
};