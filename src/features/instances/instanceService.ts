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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
    } catch (error) {
      console.error('Failed to save instances:', error);
    }
  }

  // Create a new instance
  createInstance(data: Partial<Omit<Instance, 'id' | 'createdAt' | 'updatedAt'>>): Instance {
    const instanceId = this.generateId();

    const instance: Instance = {
      id: instanceId,
      name: data.name || 'New Character',
      description: data.description,
      apiKeys: data.apiKeys || {},
      vrmModel: data.vrmModel || { name: 'Default VRM' },
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
  updateInstance(id: string, updates: Partial<Omit<Instance, 'id' | 'createdAt'>>): Instance | null {
    const state = this.loadInstances();
    const instance = state.instances[id];

    if (!instance) return null;

    const updatedInstance: Instance = {
      ...instance,
      ...updates,
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
  duplicateInstance(id: string): Instance | null {
    const state = this.loadInstances();
    const original = state.instances[id];

    if (!original) return null;

    const duplicate = this.createInstance({
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
  importInstance(jsonString: string, includeApiKeys: boolean = false): Instance | null {
    try {
      const data = JSON.parse(jsonString);

      // Remove sensitive data if not explicitly included
      if (!includeApiKeys) {
        data.apiKeys = {};
      }

      // Create new instance with imported data
      const instance = this.createInstance({
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

// Instance templates for quick setup
export const INSTANCE_TEMPLATES: InstanceTemplate[] = [
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
      }
    }
  },
  {
    id: 'professional-advisor',
    name: 'Professional Advisor',
    description: 'A formal and knowledgeable consultant',
    config: {
      name: 'Professional Advisor',
      personality: {
        systemPrompt: 'You are a professional advisor providing expert consultation. You communicate formally and precisely, offering detailed and accurate information.',
        language: 'en'
      },
      voice: {
        speakerX: -2,
        speakerY: -2,
        preset: 'mature'
      }
    }
  },
  {
    id: 'creative-companion',
    name: 'Creative Companion',
    description: 'An imaginative and artistic character',
    config: {
      name: 'Creative Companion',
      personality: {
        systemPrompt: 'You are a creative and imaginative companion who loves art, stories, and creative expression. You speak poetically and inspire creativity in conversations.',
        language: 'en'
      },
      voice: {
        speakerX: 5,
        speakerY: 5,
        preset: 'energetic'
      }
    }
  }
];

// Export singleton instance
export const instanceService = InstanceService.getInstance();