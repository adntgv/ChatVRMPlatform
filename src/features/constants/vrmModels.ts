export interface VrmModelInfo {
  id: string;
  name: string;
  fileName: string;
  url: string;
  description: string;
  category: 'cute' | 'professional' | 'creative' | 'superhero' | 'animal';
}

export const PUBLIC_VRM_MODELS: VrmModelInfo[] = [
  {
    id: 'avatarsample-b',
    name: 'Default Avatar',
    fileName: 'AvatarSample_B.vrm',
    url: '/AvatarSample_B.vrm',
    description: 'Standard humanoid character model',
    category: 'professional'
  },
  {
    id: 'pikachu',
    name: 'Pikachu',
    fileName: 'pikachu.vrm',
    url: '/pikachu.vrm',
    description: 'Cute yellow electric mouse',
    category: 'cute'
  },
  {
    id: 'pikachu-doctor',
    name: 'Dr. Pikachu',
    fileName: 'pikachu-doctor.vrm',
    url: '/pikachu-doctor.vrm',
    description: 'Medical professional pikachu',
    category: 'professional'
  },
  {
    id: 'scientist',
    name: 'Scientist',
    fileName: 'scientist.vrm',
    url: '/scientist.vrm',
    description: 'Professional scientist character',
    category: 'professional'
  },
  {
    id: 'rabbit',
    name: 'Rabbit',
    fileName: 'rabbit.vrm',
    url: '/rabbit.vrm',
    description: 'Adorable rabbit character',
    category: 'animal'
  },
  {
    id: 'superman',
    name: 'Superman',
    fileName: 'superman.vrm',
    url: '/superman.vrm',
    description: 'Heroic superhero character',
    category: 'superhero'
  }
];

// Helper function to get VRM model by ID
export function getVrmModelById(id: string): VrmModelInfo | undefined {
  return PUBLIC_VRM_MODELS.find(model => model.id === id);
}

// Helper function to get VRM models by category
export function getVrmModelsByCategory(category: VrmModelInfo['category']): VrmModelInfo[] {
  return PUBLIC_VRM_MODELS.filter(model => model.category === category);
}

// Get default VRM model
export function getDefaultVrmModel(): VrmModelInfo {
  return PUBLIC_VRM_MODELS[0]; // AvatarSample_B
}
