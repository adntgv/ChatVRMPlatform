import { 
  VOICE_PRESETS, 
  getVoicePresetById, 
  getVoicePresetsByCategory,
  VoicePreset 
} from '@/features/constants/koeiroParam';

describe('Voice Presets', () => {
  describe('VOICE_PRESETS', () => {
    it('should contain all required voice presets', () => {
      expect(VOICE_PRESETS.length).toBeGreaterThan(0);
      
      // Check for specific presets
      const presetIds = VOICE_PRESETS.map(p => p.id);
      expect(presetIds).toContain('cute');
      expect(presetIds).toContain('professional');
      expect(presetIds).toContain('cool');
      expect(presetIds).toContain('deep');
    });

    it('should have valid structure for each preset', () => {
      VOICE_PRESETS.forEach(preset => {
        expect(preset).toHaveProperty('id');
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('params');
        expect(preset).toHaveProperty('category');
        
        // Validate params
        expect(preset.params).toHaveProperty('speakerX');
        expect(preset.params).toHaveProperty('speakerY');
        expect(typeof preset.params.speakerX).toBe('number');
        expect(typeof preset.params.speakerY).toBe('number');
        
        // Validate X and Y are within valid range
        expect(preset.params.speakerX).toBeGreaterThanOrEqual(-10);
        expect(preset.params.speakerX).toBeLessThanOrEqual(10);
        expect(preset.params.speakerY).toBeGreaterThanOrEqual(-10);
        expect(preset.params.speakerY).toBeLessThanOrEqual(10);
        
        // Validate category
        expect(['emotional', 'professional', 'casual', 'character']).toContain(preset.category);
      });
    });

    it('should have unique IDs for all presets', () => {
      const ids = VOICE_PRESETS.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getVoicePresetById', () => {
    it('should return the correct preset for a valid ID', () => {
      const preset = getVoicePresetById('cute');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('Cute');
      expect(preset?.params.speakerX).toBe(4.5);
      expect(preset?.params.speakerY).toBe(10);
    });

    it('should return undefined for an invalid ID', () => {
      const preset = getVoicePresetById('invalid-id');
      expect(preset).toBeUndefined();
    });
  });

  describe('getVoicePresetsByCategory', () => {
    it('should return all presets for a given category', () => {
      const emotionalPresets = getVoicePresetsByCategory('emotional');
      expect(emotionalPresets.length).toBeGreaterThan(0);
      emotionalPresets.forEach(preset => {
        expect(preset.category).toBe('emotional');
      });
    });

    it('should return empty array for invalid category', () => {
      const presets = getVoicePresetsByCategory('invalid' as VoicePreset['category']);
      expect(presets).toEqual([]);
    });

    it('should return different presets for different categories', () => {
      const emotional = getVoicePresetsByCategory('emotional');
      const professional = getVoicePresetsByCategory('professional');
      const casual = getVoicePresetsByCategory('casual');
      const character = getVoicePresetsByCategory('character');
      
      // Each category should have at least one preset
      expect(emotional.length).toBeGreaterThan(0);
      expect(professional.length).toBeGreaterThan(0);
      expect(casual.length).toBeGreaterThan(0);
      expect(character.length).toBeGreaterThan(0);
    });
  });

  describe('Legacy preset compatibility', () => {
    it('should maintain backward compatibility with PRESET_A through PRESET_D', () => {
      const { PRESET_A, PRESET_B, PRESET_C, PRESET_D } = require('@/features/constants/koeiroParam');
      
      // PRESET_A should match "Cute" preset
      expect(PRESET_A.speakerX).toBe(4.5);
      expect(PRESET_A.speakerY).toBe(10);
      
      // PRESET_B should match "Energetic" preset
      expect(PRESET_B.speakerX).toBe(3);
      expect(PRESET_B.speakerY).toBe(3);
      
      // PRESET_C should match "Cool" preset
      expect(PRESET_C.speakerX).toBe(-5.5);
      expect(PRESET_C.speakerY).toBe(-3);
      
      // PRESET_D should match "Deep" preset
      expect(PRESET_D.speakerX).toBe(3.5);
      expect(PRESET_D.speakerY).toBe(-8);
    });
  });
});