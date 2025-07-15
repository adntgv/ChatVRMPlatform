// Mock implementation for VRM persistence hook
export const useVrmPersistence = jest.fn(() => ({
  savedVrmFiles: [],
  loadLastUsedVrm: jest.fn(),
  getStorageStats: jest.fn().mockResolvedValue({
    used: 1000,
    quota: 50000000,
  }),
  clearOldVrmFiles: jest.fn(),
}));