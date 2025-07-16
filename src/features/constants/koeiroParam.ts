export type KoeiroParam = {
  speakerX: number;
  speakerY: number;
};

export type VoicePreset = {
  id: string;
  name: string;
  description: string;
  params: KoeiroParam;
  category: "emotional" | "professional" | "casual" | "character";
};

export const DEFAULT_PARAM: KoeiroParam = {
  speakerX: 3,
  speakerY: 3,
} as const;

// Legacy presets for backward compatibility
export const PRESET_A: KoeiroParam = {
  speakerX: 4.5,
  speakerY: 10,
} as const;

export const PRESET_B: KoeiroParam = {
  speakerX: 3,
  speakerY: 3,
} as const;

export const PRESET_C: KoeiroParam = {
  speakerX: -5.5,
  speakerY: -3,
} as const;

export const PRESET_D: KoeiroParam = {
  speakerX: 3.5,
  speakerY: -8,
} as const;

// Enhanced voice presets with descriptions
export const VOICE_PRESETS: VoicePreset[] = [
  // Emotional voices
  {
    id: "cute",
    name: "Cute",
    description: "High-pitched, cheerful voice perfect for friendly characters",
    params: { speakerX: 4.5, speakerY: 10 },
    category: "emotional"
  },
  {
    id: "happy",
    name: "Happy",
    description: "Bright and upbeat voice with positive energy",
    params: { speakerX: 6, speakerY: 7 },
    category: "emotional"
  },
  {
    id: "gentle",
    name: "Gentle",
    description: "Soft and soothing voice, calm and reassuring",
    params: { speakerX: -2, speakerY: 5 },
    category: "emotional"
  },
  
  // Professional voices
  {
    id: "professional",
    name: "Professional",
    description: "Clear and confident voice for business or formal settings",
    params: { speakerX: 0, speakerY: 0 },
    category: "professional"
  },
  {
    id: "announcer",
    name: "Announcer",
    description: "Strong, clear voice suitable for presentations",
    params: { speakerX: 2, speakerY: -2 },
    category: "professional"
  },
  
  // Casual voices
  {
    id: "casual",
    name: "Casual",
    description: "Relaxed and natural conversational voice",
    params: { speakerX: 3, speakerY: 3 },
    category: "casual"
  },
  {
    id: "energetic",
    name: "Energetic",
    description: "Dynamic voice full of enthusiasm",
    params: { speakerX: 3, speakerY: 3 },
    category: "casual"
  },
  
  // Character voices
  {
    id: "cool",
    name: "Cool",
    description: "Low-pitched, calm voice with a mysterious tone",
    params: { speakerX: -5.5, speakerY: -3 },
    category: "character"
  },
  {
    id: "deep",
    name: "Deep",
    description: "Deep, mature voice with gravitas",
    params: { speakerX: 3.5, speakerY: -8 },
    category: "character"
  },
  {
    id: "robot",
    name: "Robotic",
    description: "Mechanical, digital-sounding voice",
    params: { speakerX: -8, speakerY: -5 },
    category: "character"
  },
  {
    id: "whisper",
    name: "Whisper",
    description: "Quiet, intimate voice for subtle communication",
    params: { speakerX: -3, speakerY: 8 },
    category: "character"
  }
];

// Helper function to get preset by ID
export function getVoicePresetById(id: string): VoicePreset | undefined {
  return VOICE_PRESETS.find(preset => preset.id === id);
}

// Helper function to get presets by category
export function getVoicePresetsByCategory(category: VoicePreset["category"]): VoicePreset[] {
  return VOICE_PRESETS.filter(preset => preset.category === category);
}
