import React, { memo, useCallback } from 'react';

export type Emotion = 'neutral' | 'happy' | 'angry' | 'sad' | 'relaxed';

interface EmotionControlProps {
  currentEmotion: Emotion;
  onEmotionChange: (emotion: Emotion) => void;
  disabled?: boolean;
}

const emotionConfig: Record<Emotion, { label: string; icon: string }> = {
  neutral: { label: 'Neutral', icon: '😐' },
  happy: { label: 'Happy', icon: '😊' },
  angry: { label: 'Angry', icon: '😠' },
  sad: { label: 'Sad', icon: '😢' },
  relaxed: { label: 'Relaxed', icon: '😌' }
};

export const EmotionControl = memo(({ currentEmotion, onEmotionChange, disabled = false }: EmotionControlProps) => {
  const handleEmotionClick = useCallback((emotion: Emotion) => {
    if (!disabled && emotion !== currentEmotion) {
      onEmotionChange(emotion);
    }
  }, [currentEmotion, onEmotionChange, disabled]);

  return (
    <div className="my-24">
      <div className="my-16 typography-20 font-bold">Emotions</div>
      <div className="grid grid-cols-5 gap-2">
        {(Object.keys(emotionConfig) as Emotion[]).map((emotion) => {
          const { label, icon } = emotionConfig[emotion];
          const isActive = emotion === currentEmotion;
          
          return (
            <button
              key={emotion}
              onClick={() => handleEmotionClick(emotion)}
              disabled={disabled}
              aria-label={emotion}
              className={`
                px-4 py-6 rounded-lg text-center transition-all
                ${isActive 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-surface1 hover:bg-surface1-hover text-text1'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="text-2xl block mb-2">{icon}</span>
              <span className="text-sm">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

EmotionControl.displayName = 'EmotionControl';