// Mock @pixiv/three-vrm for testing

export class VRMLookAt {
  constructor() {
    this.target = null;
    this.autoUpdate = true;
  }
  
  update(delta) {}
  getLookAtWorldDirection(target) {
    return target;
  }
  getLookAtWorldQuaternion(target) {
    return target;
  }
  applier = {
    applyYawPitch: jest.fn(),
  };
}

export class VRM {
  constructor() {
    this.scene = {};
    this.humanoid = {
      getBoneNode: jest.fn(),
      getNormalizedBoneNode: jest.fn(),
    };
    this.expressionManager = {
      setValue: jest.fn(),
      update: jest.fn(),
      getExpression: jest.fn(),
      getExpressionTrackName: jest.fn(),
    };
    this.lookAt = {
      target: null,
      autoUpdate: true,
    };
  }
  
  update(delta) {}
  dispose() {}
}

export class VRMUtils {
  static deepDispose(object) {}
  static removeUnnecessaryVertices(object) {}
  static removeUnnecessaryJoints(object) {}
}

export class VRMLoaderPlugin {
  constructor(parser) {}
  afterRoot(gltf) {}
}

export class VRMLookAtLoaderPlugin {
  constructor(parser) {}
}