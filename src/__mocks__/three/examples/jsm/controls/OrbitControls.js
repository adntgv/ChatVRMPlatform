// Mock OrbitControls for testing
export class OrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.enabled = true;
    this.enableDamping = false;
    this.dampingFactor = 0.05;
    this.enableZoom = true;
    this.enableRotate = true;
    this.enablePan = true;
    this.target = { x: 0, y: 0, z: 0 };
  }
  
  update() {}
  dispose() {}
  addEventListener() {}
  removeEventListener() {}
  getDistance() { return 1; }
  saveState() {}
  reset() {}
}