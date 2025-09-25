// Mock implementation for chat store
export const useChatStore = jest.fn(() => ({
  messages: [],
  chatProcessing: false,
  assistantMessage: '',
  handleSendChat: jest.fn(),
  setChatProcessing: jest.fn(),
  pushMessage: jest.fn(),
  updateAssistantMessage: jest.fn(),
  clearMessages: jest.fn(),
  loadFromStorage: jest.fn(),
  reset: jest.fn(),
}));

// Mock the store state getter
useChatStore.getState = jest.fn(() => ({
  messages: [],
  chatProcessing: false,
  assistantMessage: '',
  handleSendChat: jest.fn(),
  setChatProcessing: jest.fn(),
  pushMessage: jest.fn(),
  updateAssistantMessage: jest.fn(),
  clearMessages: jest.fn(),
  loadFromStorage: jest.fn(),
  reset: jest.fn(),
}));