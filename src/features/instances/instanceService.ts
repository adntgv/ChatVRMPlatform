import { Instance, InstancesState, InstanceTemplate, APIKeys } from './types';
import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants';
import { DEFAULT_PARAM } from '@/features/constants/koeiroParam';

const STORAGE_KEY = 'chatVRMInstances';
const ACTIVE_INSTANCE_KEY = 'chatVRMActiveInstance';

export class InstanceService {
  private static instance: InstanceService;

  private constructor() {}

  static getInstance(): InstanceService {
    if (!InstanceService.instance) {
      InstanceService.instance = new InstanceService();
    }
    return InstanceService.instance;
  }

  // Generate a unique ID for instances
  private generateId(): string {
    return `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convert File to data URL for storage
  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Load all instances from localStorage
  loadInstances(): InstancesState {
    if (typeof window === 'undefined') {
      return { instances: {}, activeInstanceId: null };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    const activeId = localStorage.getItem(ACTIVE_INSTANCE_KEY);

    if (!stored) {
      // Check for legacy data and migrate
      const legacyData = this.migrateLegacyData();
      if (legacyData) {
        return legacyData;
      }
      return { instances: {}, activeInstanceId: null };
    }

    try {
      const instances = JSON.parse(stored);
      return {
        instances,
        activeInstanceId: activeId
      };
    } catch (error) {
      console.error('Failed to load instances:', error);
      return { instances: {}, activeInstanceId: null };
    }
  }

  // Migrate legacy single-instance data to new format
  private migrateLegacyData(): InstancesState | null {
    const legacyData = localStorage.getItem('chatVRMParams');
    if (!legacyData) return null;

    try {
      const params = JSON.parse(legacyData);
      const instanceId = this.generateId();

      const instance: Instance = {
        id: instanceId,
        name: 'Default Character',
        description: 'Migrated from previous version',
        apiKeys: {},
        vrmModel: {
          name: 'Default VRM'
        },
        voice: params.koeiroParam || DEFAULT_PARAM,
        personality: {
          systemPrompt: params.systemPrompt || SYSTEM_PROMPT,
          language: 'ja'
        },
        chatHistory: params.chatLog || [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const state: InstancesState = {
        instances: {
          [instanceId]: instance
        },
        activeInstanceId: instanceId
      };

      // Save migrated data
      this.saveInstances(state.instances);
      this.setActiveInstance(instanceId);

      // Remove legacy data
      localStorage.removeItem('chatVRMParams');

      return state;
    } catch (error) {
      console.error('Failed to migrate legacy data:', error);
      return null;
    }
  }

  // Save instances to localStorage
  saveInstances(instances: Record<string, Instance>): void {
    if (typeof window === 'undefined') return;

    try {
      // Custom replacer to remove File objects and undefined values
      const replacer = (key: string, value: any) => {
        // Skip File objects
        if (value instanceof File) {
          return undefined;
        }
        return value;
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(instances, replacer));
    } catch (error) {
      console.error('Failed to save instances:', error);
    }
  }

  // Create a new instance
  async createInstance(data: Partial<Omit<Instance, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Instance> {
    const instanceId = this.generateId();

    // Handle VRM file conversion
    let vrmModel = data.vrmModel || { name: 'Default VRM' };
    if (vrmModel.file) {
      try {
        const dataUrl = await this.fileToDataUrl(vrmModel.file);
        vrmModel = {
          ...vrmModel,
          dataUrl,
          file: undefined // Don't store File object
        };
      } catch (error) {
        console.error('Failed to convert VRM file to data URL:', error);
      }
    }

    const instance: Instance = {
      id: instanceId,
      name: data.name || 'New Character',
      description: data.description,
      apiKeys: data.apiKeys || {},
      vrmModel,
      voice: data.voice || DEFAULT_PARAM,
      personality: data.personality || {
        systemPrompt: SYSTEM_PROMPT,
        language: 'en'
      },
      theme: data.theme,
      chatHistory: data.chatHistory || [],
      isPublic: data.isPublic || false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const state = this.loadInstances();
    state.instances[instanceId] = instance;
    this.saveInstances(state.instances);

    return instance;
  }

  // Update an existing instance
  async updateInstance(id: string, updates: Partial<Omit<Instance, 'id' | 'createdAt'>>): Promise<Instance | null> {
    const state = this.loadInstances();
    const instance = state.instances[id];

    if (!instance) return null;

    // Handle VRM file conversion if provided
    let processedUpdates = { ...updates };
    if (updates.vrmModel?.file) {
      try {
        const dataUrl = await this.fileToDataUrl(updates.vrmModel.file);
        processedUpdates.vrmModel = {
          ...updates.vrmModel,
          dataUrl,
          file: undefined // Don't store File object
        };
      } catch (error) {
        console.error('Failed to convert VRM file to data URL:', error);
        // Keep the original vrmModel without file
        processedUpdates.vrmModel = {
          ...updates.vrmModel,
          file: undefined
        };
      }
    }

    const updatedInstance: Instance = {
      ...instance,
      ...processedUpdates,
      id,
      createdAt: instance.createdAt,
      updatedAt: Date.now()
    };

    state.instances[id] = updatedInstance;
    this.saveInstances(state.instances);

    return updatedInstance;
  }

  // Delete an instance
  deleteInstance(id: string): boolean {
    const state = this.loadInstances();

    if (!state.instances[id]) return false;

    delete state.instances[id];
    this.saveInstances(state.instances);

    // If this was the active instance, clear it
    if (state.activeInstanceId === id) {
      this.setActiveInstance(null);
    }

    return true;
  }

  // Duplicate an instance
  async duplicateInstance(id: string): Promise<Instance | null> {
    const state = this.loadInstances();
    const original = state.instances[id];

    if (!original) return null;

    const duplicate = await this.createInstance({
      ...original,
      name: `${original.name} (Copy)`,
      chatHistory: [] // Start with fresh chat history
    });

    return duplicate;
  }

  // Get a single instance
  getInstance(id: string): Instance | null {
    const state = this.loadInstances();
    return state.instances[id] || null;
  }

  // Set the active instance
  setActiveInstance(id: string | null): void {
    if (typeof window === 'undefined') return;

    if (id === null) {
      localStorage.removeItem(ACTIVE_INSTANCE_KEY);
    } else {
      localStorage.setItem(ACTIVE_INSTANCE_KEY, id);

      // Update last used timestamp
      this.updateInstance(id, { lastUsed: Date.now() });
    }
  }

  // Get the active instance
  getActiveInstance(): Instance | null {
    const state = this.loadInstances();
    if (!state.activeInstanceId) return null;
    return state.instances[state.activeInstanceId] || null;
  }

  // Export instance to JSON
  exportInstance(id: string): string | null {
    const instance = this.getInstance(id);
    if (!instance) return null;

    const exportData = {
      ...instance,
      apiKeys: {} // Don't export API keys for security
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import instance from JSON
  async importInstance(jsonString: string, includeApiKeys: boolean = false): Promise<Instance | null> {
    try {
      const data = JSON.parse(jsonString);

      // Remove sensitive data if not explicitly included
      if (!includeApiKeys) {
        data.apiKeys = {};
      }

      // Create new instance with imported data
      const instance = await this.createInstance({
        ...data,
        name: `${data.name} (Imported)`,
        chatHistory: data.chatHistory || []
      });

      return instance;
    } catch (error) {
      console.error('Failed to import instance:', error);
      return null;
    }
  }

  // Clear all chat history for an instance
  clearChatHistory(id: string): boolean {
    const instance = this.updateInstance(id, { chatHistory: [] });
    return instance !== null;
  }

  // Update API keys for an instance
  updateApiKeys(id: string, apiKeys: APIKeys): boolean {
    const instance = this.updateInstance(id, { apiKeys });
    return instance !== null;
  }
}

// Instance templates for quick setup - Outcome-focused for validation
export const INSTANCE_TEMPLATES: InstanceTemplate[] = [
  {
    id: 'vtuber-cohost',
    name: 'VTuber Co-host',
    description: 'Keeps chat alive 24/7, answers FAQ, runs Just Chatting streams',
    icon: '🎬',
    config: {
      name: 'VTuber Co-host',
      description: 'Your 24/7 streaming companion that keeps viewers engaged',
      ttsProvider: 'elevenlabs',
      apiKeys: {
        openAI: process.env.NEXT_PUBLIC_DEMO_OPENAI_KEY || '',
        elevenlabs: process.env.NEXT_PUBLIC_DEMO_ELEVENLABS_KEY || ''
      },
      personality: {
        systemPrompt: `You are an energetic VTuber co-host. Your role is to:
- Keep chat engaged with fun questions and reactions
- Answer common stream questions (schedule, socials, past streams)
- React to viewer messages with personality and enthusiasm
- Use casual, friendly language with occasional emotes
- Keep responses short and conversational (1-2 sentences)
- Maintain high energy and positivity

When viewers ask about the stream, you have access to: schedule (Mon/Wed/Fri 7PM EST), Twitter (@streamername), and you love gaming and art streams.`,
        language: 'en'
      },
      voice: {
        voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - female, soft, energetic
        elevenlabsVoiceSettings: {
          stability: 0.4,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      },
      vrmModel: {
        name: 'Pikachu',
        url: '/pikachu.vrm'
      }
    }
  },
  {
    id: 'course-tutor',
    name: 'Course Tutor',
    description: 'Explains lessons, quizzes students, provides office-hours support',
    icon: '📚',
    config: {
      name: 'Course Tutor',
      description: 'Your personal teaching assistant available 24/7',
      ttsProvider: 'elevenlabs',
      apiKeys: {
        openAI: process.env.NEXT_PUBLIC_DEMO_OPENAI_KEY || '',
        elevenlabs: process.env.NEXT_PUBLIC_DEMO_ELEVENLABS_KEY || ''
      },
      personality: {
        systemPrompt: `You are an expert course tutor and teaching assistant. Your responsibilities:
- Explain complex concepts in simple, clear language
- Quiz students to test understanding
- Provide step-by-step guidance for problem-solving
- Offer encouragement and positive reinforcement
- Adapt explanations to the student's level
- Ask follow-up questions to ensure comprehension
- Maintain patience and supportiveness

You specialize in breaking down difficult topics into manageable pieces and helping students build confidence.`,
        language: 'en'
      },
      voice: {
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - female, calm, clear
        elevenlabsVoiceSettings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.1,
          use_speaker_boost: true
        }
      },
      vrmModel: {
        name: 'Scientist',
        url: '/scientist.vrm'
      }
    }
  },
  {
    id: 'website-greeter',
    name: 'Website Greeter',
    description: 'Captures leads, books calls, answers pricing questions',
    icon: '💼',
    config: {
      name: 'Website Greeter',
      description: 'Your professional website assistant that converts visitors',
      ttsProvider: 'elevenlabs',
      apiKeys: {
        openAI: process.env.NEXT_PUBLIC_DEMO_OPENAI_KEY || '',
        elevenlabs: process.env.NEXT_PUBLIC_DEMO_ELEVENLABS_KEY || ''
      },
      personality: {
        systemPrompt: `You are a professional website greeter and sales assistant. Your goals:
- Warmly welcome visitors and understand their needs
- Answer pricing questions clearly (Free tier: $0, Pro: $49/mo, Enterprise: custom)
- Qualify leads by asking about their use case and team size
- Offer to schedule a demo call for interested visitors
- Provide helpful resources and documentation links
- Handle objections professionally
- Capture contact information naturally in conversation

Be friendly but professional, solution-focused, and helpful. Keep responses concise and action-oriented.`,
        language: 'en'
      },
      voice: {
        voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - male, professional, deep
        elevenlabsVoiceSettings: {
          stability: 0.7,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true
        }
      },
      vrmModel: {
        name: 'Rabbit',
        url: '/rabbit.vrm'
      }
    }
  },
  // Legacy templates for existing users
  {
    id: 'friendly-assistant',
    name: 'Friendly Assistant',
    description: 'A helpful and cheerful AI assistant',
    config: {
      name: 'Friendly Assistant',
      personality: {
        systemPrompt: 'You are a friendly and helpful assistant. You speak cheerfully and positively, always trying to help and encourage users.',
        language: 'en'
      },
      voice: {
        speakerX: 3,
        speakerY: 3,
        preset: 'cute'
      },
      vrmModel: {
        name: 'Pikachu',
        url: '/pikachu.vrm'
      }
    }
  },
];

// Export singleton instance
export const instanceService = InstanceService.getInstance();