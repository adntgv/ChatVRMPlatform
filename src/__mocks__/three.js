// Mock Three.js for testing
module.exports = {
  Matrix4: jest.fn(() => ({
    identity: jest.fn(),
    multiply: jest.fn(),
    multiplyMatrices: jest.fn(),
    set: jest.fn(),
    makeRotationX: jest.fn(),
    makeRotationY: jest.fn(),
    makeRotationZ: jest.fn(),
    makeScale: jest.fn(),
    makeTranslation: jest.fn(),
    decompose: jest.fn(),
    compose: jest.fn(),
    invert: jest.fn(),
    determinant: jest.fn(),
    getInverse: jest.fn(),
    transpose: jest.fn(),
    setPosition: jest.fn(),
    scale: jest.fn(),
    getMaxScaleOnAxis: jest.fn(),
    makeOrthographic: jest.fn(),
    equals: jest.fn(),
    fromArray: jest.fn(),
    toArray: jest.fn(),
    clone: jest.fn(),
    copy: jest.fn(),
  })),
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
    position: { 
      set: jest.fn().mockReturnValue({
        normalize: jest.fn().mockReturnThis()
      })
    },
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