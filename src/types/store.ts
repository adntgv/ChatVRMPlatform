import { Message } from "@/features/messages/messages";
import { KoeiroParam } from "@/features/constants/koeiroParam";

// Chat Store Types
export interface ChatState {
  chatProcessing: boolean;
  chatLog: Message[];
  assistantMessage: string;
}

export interface ChatActions {
  setChatProcessing: (processing: boolean) => void;
  setChatLog: (log: Message[]) => void;
  setAssistantMessage: (message: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (index: number, content: string) => void;
  clearChat: () => void;
  handleSendChat: (
    text: string, 
    openAiKey: string, 
    systemPrompt: string,
    koeiroParam: KoeiroParam,
    koeiromapKey: string,
    onSpeakAi: (screenplay: any) => void
  ) => Promise<void>;
  getChatLog: () => Message[];
}

export interface ChatStore extends ChatState, ChatActions {}

// Configuration Store Types
export interface ConfigState {
  systemPrompt: string;
  openAiKey: string;
  koeiromapKey: string;
  koeiroParam: KoeiroParam;
}

export interface ConfigActions {
  setSystemPrompt: (prompt: string) => void;
  setOpenAiKey: (key: string) => void;
  setKoeiromapKey: (key: string) => void;
  setKoeiroParam: (param: KoeiroParam) => void;
  resetToDefaults: () => void;
  loadFromStorage: () => void;
  saveToStorage: (chatLog?: Message[]) => void;
}

export interface ConfigStore extends ConfigState, ConfigActions {}

// Persistence Types
export interface StorageData {
  systemPrompt?: string;
  koeiroParam?: KoeiroParam;
  chatLog?: Message[];
}