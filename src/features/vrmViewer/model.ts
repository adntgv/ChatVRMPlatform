import * as THREE from "three";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRMAnimation } from "../../lib/VRMAnimation/VRMAnimation";
import { VRMLookAtSmootherLoaderPlugin } from "@/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmootherLoaderPlugin";
import { LipSync } from "../lipSync/lipSync";
import { EmoteController } from "../emoteController/emoteController";
import { Screenplay } from "../messages/messages";
import { AppError, ErrorType, ErrorSeverity, errorHandler } from "@/lib/errorHandler";

/**
 * 3Dキャラクターを管理するクラス
 */
export class Model {
  public vrm?: VRM | null;
  public mixer?: THREE.AnimationMixer;
  public emoteController?: EmoteController;

  private _lookAtTargetParent: THREE.Object3D;
  private _lipSync?: LipSync;

  constructor(lookAtTargetParent: THREE.Object3D) {
    this._lookAtTargetParent = lookAtTargetParent;
    this._lipSync = new LipSync(new AudioContext());
  }

  public async loadVRM(url: string): Promise<void> {
    try {
      const loader = new GLTFLoader();
      loader.register(
        (parser) =>
          new VRMLoaderPlugin(parser, {
            lookAtPlugin: new VRMLookAtSmootherLoaderPlugin(parser),
          })
      );

      const gltf = await loader.loadAsync(url);

      if (!gltf.userData.vrm) {
        throw new AppError(
          'Invalid VRM file: No VRM data found',
          ErrorType.VRM_LOADING,
          ErrorSeverity.HIGH,
          {
            context: {
              component: 'model',
              action: 'loadVRM',
              metadata: { url, hasUserData: !!gltf.userData }
            },
            userMessage: 'ファイルはVRM形式ではありません。正しいVRMファイルを選択してください。'
          }
        );
      }

      const vrm = (this.vrm = gltf.userData.vrm);
      vrm.scene.name = "VRMRoot";

      VRMUtils.rotateVRM0(vrm);
      this.mixer = new THREE.AnimationMixer(vrm.scene);

      this.emoteController = new EmoteController(vrm, this._lookAtTargetParent);
    } catch (error: any) {
      // Clean up any partial loading
      this.unLoadVrm();
      
      const appError = error instanceof AppError ? error : new AppError(
        `Failed to load VRM model: ${error.message}`,
        ErrorType.VRM_LOADING,
        ErrorSeverity.HIGH,
        {
          originalError: error,
          context: {
            component: 'model',
            action: 'loadVRM',
            metadata: { url }
          },
          userMessage: 'VRMモデルの読み込み中にエラーが発生しました。'
        }
      );
      errorHandler.handle(appError);
      throw appError;  // Re-throw for caller
    }
  }

  public unLoadVrm() {
    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
      this.vrm = null;
    }
  }

  /**
   * VRMアニメーションを読み込む
   *
   * https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm_animation-1.0/README.ja.md
   */
  public async loadAnimation(vrmAnimation: VRMAnimation): Promise<void> {
    const { vrm, mixer } = this;
    if (vrm == null || mixer == null) {
      throw new Error("You have to load VRM first");
    }

    const clip = vrmAnimation.createAnimationClip(vrm);
    const action = mixer.clipAction(clip);
    action.play();
  }

  /**
   * 音声を再生し、リップシンクを行う
   */
  public async speak(buffer: ArrayBuffer, screenplay: Screenplay) {
    this.emoteController?.playEmotion(screenplay.expression);
    await new Promise((resolve) => {
      this._lipSync?.playFromArrayBuffer(buffer, () => {
        resolve(true);
      });
    });
  }

  public update(delta: number): void {
    if (this._lipSync) {
      const { volume } = this._lipSync.update();
      this.emoteController?.lipSync("aa", volume);
    }

    this.emoteController?.update(delta);
    this.mixer?.update(delta);
    this.vrm?.update(delta);
  }
}
