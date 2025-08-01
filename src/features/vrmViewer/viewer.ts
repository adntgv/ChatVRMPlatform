import * as THREE from "three";
import { config } from "@/config";
import { Model } from "./model";
import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";
import { buildUrl } from "@/utils/buildUrl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { AppError, ErrorType, ErrorSeverity, errorHandler } from "@/lib/errorHandler";

/**
 * three.jsを使った3Dビューワー
 *
 * setup()でcanvasを渡してから使う
 */
export class Viewer {
  public isReady: boolean;
  public model?: Model;

  private _renderer?: THREE.WebGLRenderer;
  private _clock: THREE.Clock;
  private _scene: THREE.Scene;
  private _camera?: THREE.PerspectiveCamera;
  private _cameraControls?: OrbitControls;

  constructor() {
    this.isReady = false;

    // scene
    const scene = new THREE.Scene();
    this._scene = scene;

    // light
    const directionalLight = new THREE.DirectionalLight(0xffffff, config.lighting.directionalLightIntensity);
    directionalLight.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, config.lighting.ambientLightIntensity);
    scene.add(ambientLight);

    // animate
    this._clock = new THREE.Clock();
    this._clock.start();
  }

  public async loadVrm(url: string): Promise<void> {
    try {
      if (this.model?.vrm) {
        this.unloadVRM();
      }

      // gltf and vrm
      this.model = new Model(this._camera || new THREE.Object3D());
      
      await this.model.loadVRM(url);
      
      if (!this.model?.vrm) {
        throw new AppError(
          'VRM model not properly loaded',
          ErrorType.VRM_LOADING,
          ErrorSeverity.HIGH,
          {
            context: {
              component: 'viewer',
              action: 'loadVrm',
              metadata: { url }
            },
            userMessage: 'VRMモデルの読み込みに失敗しました。'
          }
        );
      }

      // Disable frustum culling
      this.model.vrm.scene.traverse((obj) => {
        obj.frustumCulled = false;
      });

      this._scene.add(this.model.vrm.scene);

      try {
        const vrma = await loadVRMAnimation(buildUrl("/idle_loop.vrma"));
        if (vrma) {
          this.model.loadAnimation(vrma);
        }
      } catch (animError: any) {
        // Animation loading is non-critical, log but continue
        const error = new AppError(
          `Failed to load idle animation: ${animError.message}`,
          ErrorType.VRM_LOADING,
          ErrorSeverity.LOW,
          {
            originalError: animError,
            context: {
              component: 'viewer',
              action: 'loadIdleAnimation'
            },
            isUserFacing: false  // Don't interrupt user
          }
        );
        errorHandler.handle(error);
      }

      // HACK: アニメーションの原点がずれているので再生後にカメラ位置を調整する
      requestAnimationFrame(() => {
        this.resetCamera();
      });
    } catch (error: any) {
      const appError = error instanceof AppError ? error : new AppError(
        `Failed to load VRM: ${error.message}`,
        ErrorType.VRM_LOADING,
        ErrorSeverity.HIGH,
        {
          originalError: error,
          context: {
            component: 'viewer',
            action: 'loadVrm',
            metadata: { url }
          },
          userMessage: 'VRMファイルの読み込みに失敗しました。ファイルが正しいVRM形式であることを確認してください。'
        }
      );
      errorHandler.handle(appError);
      throw appError;  // Re-throw so caller can handle
    }
  }

  public unloadVRM(): void {
    if (this.model?.vrm) {
      this._scene.remove(this.model.vrm.scene);
      this.model?.unLoadVrm();
    }
  }

  /**
   * Reactで管理しているCanvasを後から設定する
   */
  public setup(canvas: HTMLCanvasElement) {
    const parentElement = canvas.parentElement;
    const width = parentElement?.clientWidth || canvas.width;
    const height = parentElement?.clientHeight || canvas.height;
    // renderer
    this._renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
    });
    this._renderer.outputEncoding = THREE.sRGBEncoding;
    this._renderer.setSize(width, height);
    this._renderer.setPixelRatio(window.devicePixelRatio);

    // camera
    this._camera = new THREE.PerspectiveCamera(20.0, width / height, 0.1, 20.0);
    this._camera.position.set(0, 1.3, 1.5);
    this._cameraControls?.target.set(0, 1.3, 0);
    this._cameraControls?.update();
    // camera controls
    this._cameraControls = new OrbitControls(
      this._camera,
      this._renderer.domElement
    );
    this._cameraControls.screenSpacePanning = true;
    this._cameraControls.update();

    window.addEventListener("resize", () => {
      this.resize();
    });
    this.isReady = true;
    this.update();
  }

  /**
   * canvasの親要素を参照してサイズを変更する
   */
  public resize() {
    if (!this._renderer) return;

    const parentElement = this._renderer.domElement.parentElement;
    if (!parentElement) return;

    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(
      parentElement.clientWidth,
      parentElement.clientHeight
    );

    if (!this._camera) return;
    this._camera.aspect =
      parentElement.clientWidth / parentElement.clientHeight;
    this._camera.updateProjectionMatrix();
  }

  /**
   * VRMのheadノードを参照してカメラ位置を調整する
   */
  public resetCamera() {
    const headNode = this.model?.vrm?.humanoid.getNormalizedBoneNode("head");

    if (headNode) {
      const headWPos = headNode.getWorldPosition(new THREE.Vector3());
      this._camera?.position.set(
        this._camera.position.x,
        headWPos.y,
        this._camera.position.z
      );
      this._cameraControls?.target.set(headWPos.x, headWPos.y, headWPos.z);
      this._cameraControls?.update();
    }
  }

  public update = () => {
    requestAnimationFrame(this.update);
    const delta = this._clock.getDelta();
    // update vrm components
    if (this.model) {
      this.model.update(delta);
    }

    if (this._renderer && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  };
}
