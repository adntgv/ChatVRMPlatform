// Mock implementation for config store
export const useConfigStore = jest.fn(() => ({
  openAiKey: '',
  koeiromapKey: '',
  koeiroParam: {
    speakerX: 0.5,
    speakerY: 0.5,
  },
  systemPrompt: 'You are a helpful assistant.',
  setOpenAiKey: jest.fn(),
  setKoeiromapKey: jest.fn(),
  setKoeiroParam: jest.fn(),
  setSystemPrompt: jest.fn(),
  loadFromStorage: jest.fn(),
  reset: jest.fn(),
}));

// Mock the store state getter
useConfigStore.getState = jest.fn(() => ({
  openAiKey: '',
  koeiromapKey: '',
  koeiroParam: {
    speakerX: 0.5,
    speakerY: 0.5,
  },
  systemPrompt: 'You are a helpful assistant.',
  setOpenAiKey: jest.fn(),
  setKoeiromapKey: jest.fn(),
  setKoeiroParam: jest.fn(),
  setSystemPrompt: jest.fn(),
  loadFromStorage: jest.fn(),
  reset: jest.fn(),
}));