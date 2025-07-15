// Mock viewer for testing
export class Viewer {
  constructor() {}
  
  async loadVrm(url: string) {
    // Simulate successful VRM load
    return Promise.resolve();
  }
  
  unloadVrm() {}
  
  isReady() {
    return true;
  }
  
  model() {
    return {
      vrm: {},
      update: jest.fn(),
    };
  }
  
  update() {}
  
  resetCamera() {}
  
  setup() {}
}