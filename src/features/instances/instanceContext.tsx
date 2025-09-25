import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Instance, InstancesState, APIKeys } from './types';
import { instanceService, INSTANCE_TEMPLATES } from './instanceService';
import { Message } from '@/features/messages/messages';

interface InstanceContextType {
  instances: Record<string, Instance>;
  activeInstance: Instance | null;
  isLoading: boolean;

  // Instance operations
  createInstance: (data: Partial<Omit<Instance, 'id' | 'createdAt' | 'updatedAt'>>) => Instance | null;
  createFromTemplate: (templateId: string) => Instance | null;
  updateInstance: (id: string, updates: Partial<Omit<Instance, 'id' | 'createdAt'>>) => void;
  deleteInstance: (id: string) => void;
  duplicateInstance: (id: string) => Instance | null;

  // Active instance operations
  setActiveInstance: (id: string | null) => void;
  updateActiveInstanceChat: (chatHistory: Message[]) => void;
  updateActiveInstanceApiKeys: (apiKeys: APIKeys) => void;
  clearActiveInstanceChat: () => void;

  // Import/Export
  exportInstance: (id: string) => void;
  importInstance: (file: File) => Promise<void>;

  // Templates
  templates: typeof INSTANCE_TEMPLATES;
}

const InstanceContext = createContext<InstanceContextType | undefined>(undefined);

export function InstanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InstancesState>({
    instances: {},
    activeInstanceId: null
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load instances on mount
  useEffect(() => {
    const loadedState = instanceService.loadInstances();
    setState(loadedState);
    setIsLoading(false);
  }, []);

  // Create a new instance
  const createInstance = useCallback((data: Partial<Omit<Instance, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const instance = instanceService.createInstance(data);
    if (instance) {
      setState(prev => ({
        ...prev,
        instances: {
          ...prev.instances,
          [instance.id]: instance
        }
      }));
    }
    return instance;
  }, []);

  // Create instance from template
  const createFromTemplate = useCallback((templateId: string) => {
    const template = INSTANCE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    return createInstance(template.config);
  }, [createInstance]);

  // Update an instance
  const updateInstance = useCallback((id: string, updates: Partial<Omit<Instance, 'id' | 'createdAt'>>) => {
    const updated = instanceService.updateInstance(id, updates);
    if (updated) {
      setState(prev => ({
        ...prev,
        instances: {
          ...prev.instances,
          [id]: updated
        }
      }));
    }
  }, []);

  // Delete an instance
  const deleteInstance = useCallback((id: string) => {
    if (instanceService.deleteInstance(id)) {
      setState(prev => {
        const newInstances = { ...prev.instances };
        delete newInstances[id];

        return {
          instances: newInstances,
          activeInstanceId: prev.activeInstanceId === id ? null : prev.activeInstanceId
        };
      });
    }
  }, []);

  // Duplicate an instance
  const duplicateInstance = useCallback((id: string) => {
    const duplicate = instanceService.duplicateInstance(id);
    if (duplicate) {
      setState(prev => ({
        ...prev,
        instances: {
          ...prev.instances,
          [duplicate.id]: duplicate
        }
      }));
    }
    return duplicate;
  }, []);

  // Set active instance
  const setActiveInstance = useCallback((id: string | null) => {
    instanceService.setActiveInstance(id);
    setState(prev => ({
      ...prev,
      activeInstanceId: id
    }));
  }, []);

  // Update active instance chat history
  const updateActiveInstanceChat = useCallback((chatHistory: Message[]) => {
    if (!state.activeInstanceId) return;

    updateInstance(state.activeInstanceId, { chatHistory });
  }, [state.activeInstanceId, updateInstance]);

  // Update active instance API keys
  const updateActiveInstanceApiKeys = useCallback((apiKeys: APIKeys) => {
    if (!state.activeInstanceId) return;

    updateInstance(state.activeInstanceId, { apiKeys });
  }, [state.activeInstanceId, updateInstance]);

  // Clear active instance chat
  const clearActiveInstanceChat = useCallback(() => {
    if (!state.activeInstanceId) return;

    instanceService.clearChatHistory(state.activeInstanceId);
    updateInstance(state.activeInstanceId, { chatHistory: [] });
  }, [state.activeInstanceId, updateInstance]);

  // Export instance
  const exportInstance = useCallback((id: string) => {
    const jsonString = instanceService.exportInstance(id);
    if (!jsonString) return;

    const instance = state.instances[id];
    const filename = `${instance.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.instances]);

  // Import instance
  const importInstance = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const imported = instanceService.importInstance(text);

      if (imported) {
        setState(prev => ({
          ...prev,
          instances: {
            ...prev.instances,
            [imported.id]: imported
          }
        }));
      }
    } catch (error) {
      console.error('Failed to import instance:', error);
    }
  }, []);

  const activeInstance = state.activeInstanceId ? state.instances[state.activeInstanceId] || null : null;

  const value: InstanceContextType = {
    instances: state.instances,
    activeInstance,
    isLoading,
    createInstance,
    createFromTemplate,
    updateInstance,
    deleteInstance,
    duplicateInstance,
    setActiveInstance,
    updateActiveInstanceChat,
    updateActiveInstanceApiKeys,
    clearActiveInstanceChat,
    exportInstance,
    importInstance,
    templates: INSTANCE_TEMPLATES
  };

  return (
    <InstanceContext.Provider value={value}>
      {children}
    </InstanceContext.Provider>
  );
}

// Hook to use the instance context
export function useInstances() {
  const context = useContext(InstanceContext);
  if (context === undefined) {
    throw new Error('useInstances must be used within an InstanceProvider');
  }
  return context;
}

// Hook to get the active instance
export function useActiveInstance() {
  const { activeInstance } = useInstances();
  return activeInstance;
}

// Hook to get a specific instance
export function useInstance(id: string) {
  const { instances } = useInstances();
  return instances[id] || null;
}