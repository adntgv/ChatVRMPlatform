// Mock Three.js for testing
module.exports = {
  Scene: jest.fn(),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    setPixelRatio: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    domElement: document.createElement('canvas'),
  })),
  PerspectiveCamera: jest.fn(() => ({
    position: { set: jest.fn() },
    lookAt: jest.fn(),
  })),
  DirectionalLight: jest.fn(() => ({
    position: { set: jest.fn() },
  })),
  AmbientLight: jest.fn(),
  Vector3: jest.fn(),
  Clock: jest.fn(() => ({
    getDelta: jest.fn(() => 0.016),
    getElapsedTime: jest.fn(() => 1),
  })),
  AnimationMixer: jest.fn(() => ({
    update: jest.fn(),
    clipAction: jest.fn(() => ({
      play: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
      setLoop: jest.fn(),
      setEffectiveWeight: jest.fn(),
    })),
  })),
  Object3D: jest.fn(),
  Mesh: jest.fn(),
  Group: jest.fn(),
  Quaternion: jest.fn(),
  Euler: jest.fn(),
  MathUtils: {
    DEG2RAD: Math.PI / 180,
  },
};