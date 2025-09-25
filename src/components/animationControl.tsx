import React, { memo, useCallback, useRef } from 'react';
import { TextButton } from './textButton';

export interface Animation {
  id: string;
  name: string;
  url: string;
}

interface AnimationControlProps {
  animations: Animation[];
  currentAnimation: Animation | null;
  isPlaying: boolean;
  speed: number;
  loop: boolean;
  onAnimationUpload: (file: File) => void;
  onAnimationPlay: () => void;
  onAnimationStop: () => void;
  onSpeedChange: (speed: number) => void;
  onLoopToggle: (loop: boolean) => void;
  onAnimationSelect: (animation: Animation) => void;
  disabled?: boolean;
}

export const AnimationControl = memo(({
  animations,
  currentAnimation,
  isPlaying,
  speed,
  loop,
  onAnimationUpload,
  onAnimationPlay,
  onAnimationStop,
  onSpeedChange,
  onLoopToggle,
  onAnimationSelect,
  disabled = false
}: AnimationControlProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    onAnimationUpload(file);
    
    // Reset input
    event.target.value = '';
  }, [onAnimationUpload]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSpeedChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onSpeedChange(Number(event.target.value));
  }, [onSpeedChange]);

  const handleLoopChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onLoopToggle(event.target.checked);
  }, [onLoopToggle]);

  const hasAnimations = animations.length > 0;
  const hasSelectedAnimation = currentAnimation !== null;

  return (
    <div className="my-24">
      <div className="my-16 typography-20 font-bold">Animations</div>
      
      {/* Upload Section */}
      <div className="my-8">
        <TextButton onClick={handleUploadClick} disabled={disabled}>
          Upload VRMA File
        </TextButton>
        <input
          ref={fileInputRef}
          type="file"
          accept=".vrma"
          onChange={handleFileUpload}
          disabled={disabled}
          className="hidden"
          aria-label="Upload Animation"
        />
      </div>

      {/* Animation List */}
      <div className="my-8">
        {hasAnimations ? (
          <div className="grid grid-cols-2 gap-2">
            {animations.map((animation) => (
              <button
                key={animation.id}
                onClick={() => onAnimationSelect(animation)}
                disabled={disabled}
                aria-label={animation.name}
                className={`
                  px-4 py-2 rounded text-sm transition-all
                  ${currentAnimation?.id === animation.id
                    ? 'bg-primary text-white'
                    : 'bg-surface1 hover:bg-surface1-hover text-text1'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {animation.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-text2 text-sm">No animations loaded</p>
        )}
      </div>

      {/* Playback Controls */}
      <div className="my-8 flex items-center gap-2">
        <TextButton 
          onClick={isPlaying ? onAnimationStop : onAnimationPlay}
          disabled={disabled || !hasSelectedAnimation}
        >
          {isPlaying ? "Pause" : "Play"}
        </TextButton>
        <TextButton 
          onClick={onAnimationStop}
          disabled={disabled || !hasSelectedAnimation}
        >
          Stop
        </TextButton>
      </div>

      {/* Speed Control */}
      <div className="my-8">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="animation-speed" className="text-sm">Speed: {speed}x</label>
        </div>
        <input
          id="animation-speed"
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={speed}
          onChange={handleSpeedChange}
          disabled={disabled || !hasSelectedAnimation}
          className="w-full input-range"
          aria-label="Speed"
        />
      </div>

      {/* Loop Control */}
      <div className="my-8">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={loop}
            onChange={handleLoopChange}
            disabled={disabled || !hasSelectedAnimation}
            className="mr-2"
            aria-label="Loop"
          />
          <span className="text-sm">Loop Animation</span>
        </label>
      </div>
    </div>
  );
});

AnimationControl.displayName = 'AnimationControl';