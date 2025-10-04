import { Message } from "@/features/messages/messages";
import { KoeiroParam } from "@/features/constants/koeiroParam";

export interface VRMModelConfig {
  url?: string;
  name: string;
  file?: File;
  dataUrl?: string; // For persisting uploaded files as data URLs
}

export interface APIKeys {
  openAI?: string;
  koeiromap?: string;
}

export interface ThemeConfig {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface Instance {
  id: string;
  name: string;
  description?: string;
  apiKeys: APIKeys;
  vrmModel: VRMModelConfig;
  voice: KoeiroParam & {
    preset?: string;
  };
  personality: {
    systemPrompt: string;
    language: 'en' | 'ja';
  };
  theme?: ThemeConfig;
  chatHistory: Message[];
  isPublic?: boolean;
  createdAt: number;
  updatedAt: number;
  lastUsed?: number;
}

export interface InstancesState {
  instances: Record<string, Instance>;
  activeInstanceId: string | null;
}

export interface InstanceTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  config: Partial<Omit<Instance, 'id' | 'createdAt' | 'updatedAt'>>;
}