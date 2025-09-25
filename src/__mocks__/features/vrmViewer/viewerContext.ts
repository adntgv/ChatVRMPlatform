import { createContext } from 'react';

export const ViewerContext = createContext({
  viewer: {
    isReady: true,
    model: null,
    loadVrm: jest.fn(),
    unloadVRM: jest.fn(),
    setup: jest.fn(),
  },
});