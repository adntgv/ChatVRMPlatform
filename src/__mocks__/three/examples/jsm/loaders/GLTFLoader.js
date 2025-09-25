// Mock GLTFLoader for testing
export class GLTFLoader {
  constructor() {}
  
  load(url, onLoad, onProgress, onError) {
    // Simulate successful load
    setTimeout(() => {
      onLoad({
        scene: {},
        scenes: [{}],
        animations: [],
        cameras: [],
        asset: {},
        parser: {},
        userData: {}
      });
    }, 0);
  }
  
  loadAsync(url) {
    return Promise.resolve({
      scene: {},
      scenes: [{}],
      animations: [],
      cameras: [],
      asset: {},
      parser: {},
      userData: {}
    });
  }
  
  setPath(path) {
    return this;
  }
  
  register(plugin) {
    return this;
  }
}