import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants';
import { DEFAULT_PARAM, KoeiroParam } from '@/features/constants/koeiroParam';
import { ConfigStore, StorageData } from '@/types/store';
import { Message } from '@/features/messages/messages';
import { AppError, ErrorType, ErrorSeverity, errorHandler } from '@/lib/errorHandler';

export const useConfigStore = create<ConfigStore>()(
  subscribeWithSelector((set, get) => ({
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
    } catch (error: any) {
      const appError = new AppError(
        `Failed to load configuration from storage: ${error.message}`,
        ErrorType.UNKNOWN,
        ErrorSeverity.LOW,
        {
          originalError: error,
          context: {
            component: 'configStore',
            action: 'loadFromStorage'
          },
          userMessage: '設定の読み込みに失敗しました。デフォルト設定を使用します。',
          isUserFacing: false  // Don't show to user, just use defaults
        }
      );
      errorHandler.handle(appError);
      // Keep default values on error
    }
  },

  saveToStorage: (chatLog: Message[] = []) => {
    const { systemPrompt, koeiroParam } = get();
    
    try {
      const dataToSave: StorageData = {
        systemPrompt,
        koeiroParam,
        chatLog
      };
      
      localStorage.setItem('chatVRMParams', JSON.stringify(dataToSave));
    } catch (error: any) {
      const appError = new AppError(
        `Failed to save configuration to storage: ${error.message}`,
        ErrorType.UNKNOWN,
        ErrorSeverity.LOW,
        {
          originalError: error,
          context: {
            component: 'configStore',
            action: 'saveToStorage',
            metadata: {
              hasSystemPrompt: !!systemPrompt,
              hasKoeiroParam: !!koeiroParam,
              chatLogLength: chatLog.length
            }
          },
          userMessage: '設定の保存に失敗しました。',
          isUserFacing: false  // Don't interrupt user flow
        }
      );
      errorHandler.handle(appError);
    }
  }
})));