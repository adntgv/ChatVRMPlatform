import { create } from 'zustand';
import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants';
import { DEFAULT_PARAM, KoeiroParam } from '@/features/constants/koeiroParam';
import { ConfigStore, StorageData } from '@/types/store';
import { Message } from '@/features/messages/messages';

export const useConfigStore = create<ConfigStore>((set, get) => ({
  // Initial state
  systemPrompt: SYSTEM_PROMPT,
  openAiKey: '',
  koeiromapKey: '',
  koeiroParam: DEFAULT_PARAM,

  // Basic setters
  setSystemPrompt: (prompt: string) => 
    set({ systemPrompt: prompt }),

  setOpenAiKey: (key: string) => 
    set({ openAiKey: key }),

  setKoeiromapKey: (key: string) => 
    set({ koeiromapKey: key }),

  setKoeiroParam: (param: KoeiroParam) => 
    set({ koeiroParam: param }),

  // Reset to defaults
  resetToDefaults: () => 
    set({
      systemPrompt: SYSTEM_PROMPT,
      openAiKey: '',
      koeiromapKey: '',
      koeiroParam: DEFAULT_PARAM
    }),

  // localStorage integration
  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem('chatVRMParams');
      if (stored) {
        const params: StorageData = JSON.parse(stored);
        set({
          systemPrompt: params.systemPrompt ?? SYSTEM_PROMPT,
          koeiroParam: params.koeiroParam ?? DEFAULT_PARAM
        });
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
      // Keep default values on error
    }
  },

  saveToStorage: (chatLog: Message[] = []) => {
    try {
      const { systemPrompt, koeiroParam } = get();
      
      const dataToSave: StorageData = {
        systemPrompt,
        koeiroParam,
        chatLog
      };
      
      localStorage.setItem('chatVRMParams', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }
}));