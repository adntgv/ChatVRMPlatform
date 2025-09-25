import React, { memo, useCallback, useState, useEffect } from "react";
import { VoicePreset, KoeiroParam, VOICE_PRESETS, getVoicePresetsByCategory } from "@/features/constants/koeiroParam";
import { TextButton } from "./textButton";
import { useConfigStore } from "@/store/configStore";

type Props = {
  currentParams: KoeiroParam;
  onVoiceChange: (x: number, y: number) => void;
  onCustomParamsChange?: (x: number, y: number) => void;
  showAdvanced?: boolean;
};

export const VoiceSelection = memo(({
  currentParams,
  onVoiceChange,
  onCustomParamsChange,
  showAdvanced = true,
}: Props) => {
  const selectedVoicePresetId = useConfigStore(state => state.selectedVoicePresetId);
  const setSelectedVoicePresetId = useConfigStore(state => state.setSelectedVoicePresetId);
  
  const [selectedCategory, setSelectedCategory] = useState<VoicePreset["category"]>("emotional");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customX, setCustomX] = useState(currentParams.speakerX);
  const [customY, setCustomY] = useState(currentParams.speakerY);

  const categories: VoicePreset["category"][] = ["emotional", "professional", "casual", "character"];

  // Check if we're in custom mode on mount and when params change
  useEffect(() => {
    const matchingPreset = VOICE_PRESETS.find(preset => 
      Math.abs(preset.params.speakerX - currentParams.speakerX) < 0.01 && 
      Math.abs(preset.params.speakerY - currentParams.speakerY) < 0.01
    );
    
    if (!matchingPreset) {
      setIsCustomMode(true);
      setSelectedVoicePresetId(null);
    } else if (matchingPreset.id !== selectedVoicePresetId) {
      setSelectedVoicePresetId(matchingPreset.id);
    }
  }, [currentParams, selectedVoicePresetId, setSelectedVoicePresetId]);

  const handlePresetSelect = useCallback((preset: VoicePreset) => {
    onVoiceChange(preset.params.speakerX, preset.params.speakerY);
    setSelectedVoicePresetId(preset.id);
    setIsCustomMode(false);
  }, [onVoiceChange, setSelectedVoicePresetId]);

  const handleCustomMode = useCallback(() => {
    setIsCustomMode(true);
    setSelectedVoicePresetId(null);
    setCustomX(currentParams.speakerX);
    setCustomY(currentParams.speakerY);
  }, [currentParams, setSelectedVoicePresetId]);

  const handleCustomXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setCustomX(value);
    if (onCustomParamsChange) {
      onCustomParamsChange(value, customY);
    } else {
      onVoiceChange(value, customY);
    }
  }, [customY, onCustomParamsChange, onVoiceChange]);

  const handleCustomYChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setCustomY(value);
    if (onCustomParamsChange) {
      onCustomParamsChange(customX, value);
    } else {
      onVoiceChange(customX, value);
    }
  }, [customX, onCustomParamsChange, onVoiceChange]);

  const isPresetActive = (preset: VoicePreset) => {
    return !isCustomMode && selectedVoicePresetId === preset.id;
  };

  const filteredPresets = getVoicePresetsByCategory(selectedCategory);

  return (
    <div className="voice-selection">
      <div className="my-16 typography-20 font-bold">Voice Selection</div>
      
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-8 mb-16">
        {categories.map(category => (
          <TextButton
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? "bg-primary text-white" : ""}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </TextButton>
        ))}
        {showAdvanced && (
          <TextButton
            onClick={handleCustomMode}
            className={isCustomMode ? "bg-primary text-white" : ""}
          >
            Custom
          </TextButton>
        )}
      </div>

      {/* Voice Presets Grid */}
      {!isCustomMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          {filteredPresets.map(preset => (
            <div
              key={preset.id}
              className={`voice-preset-card p-16 rounded-8 cursor-pointer transition-all ${
                isPresetActive(preset) 
                  ? "bg-primary text-white" 
                  : "bg-surface1 hover:bg-surface1-hover"
              }`}
              onClick={() => handlePresetSelect(preset)}
            >
              <div className="font-bold text-16 mb-4">{preset.name}</div>
              <div className="text-14 opacity-80">{preset.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Voice Controls */}
      {isCustomMode && showAdvanced && (
        <div className="custom-voice-controls my-24 p-16 bg-surface1 rounded-8">
          <div className="mb-16 text-14">
            Adjust the X and Y parameters to create your custom voice:
          </div>
          
          <div className="mb-16">
            <div className="select-none mb-8">
              <span className="font-bold">Pitch (X): </span>
              <span>{customX.toFixed(1)}</span>
              <span className="text-12 ml-8 opacity-60">(-10 = Lower, 10 = Higher)</span>
            </div>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.1}
              value={customX}
              className="w-full input-range"
              onChange={handleCustomXChange}
            />
          </div>
          
          <div className="mb-16">
            <div className="select-none mb-8">
              <span className="font-bold">Energy (Y): </span>
              <span>{customY.toFixed(1)}</span>
              <span className="text-12 ml-8 opacity-60">(-10 = Calm, 10 = Energetic)</span>
            </div>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.1}
              value={customY}
              className="w-full input-range"
              onChange={handleCustomYChange}
            />
          </div>
        </div>
      )}

      {/* Current Voice Display */}
      <div className="current-voice-display mt-16 p-12 bg-surface2 rounded-8">
        <div className="text-12 opacity-60 mb-4">Current Voice Parameters:</div>
        <div className="flex gap-16 text-14">
          <span>X: {currentParams.speakerX.toFixed(1)}</span>
          <span>Y: {currentParams.speakerY.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
});

VoiceSelection.displayName = 'VoiceSelection';