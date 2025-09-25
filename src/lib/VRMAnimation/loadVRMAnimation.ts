import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMAnimation } from './VRMAnimation';
import { VRMAnimationLoaderPlugin } from './VRMAnimationLoaderPlugin';
import { AppError, ErrorType, ErrorSeverity } from '@/lib/errorHandler';

const loader = new GLTFLoader();
loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

export async function loadVRMAnimation(url: string): Promise<VRMAnimation | null> {
  try {
    const gltf = await loader.loadAsync(url);

    if (!gltf.userData.vrmAnimations || !Array.isArray(gltf.userData.vrmAnimations)) {
      throw new AppError(
        'Invalid VRMA file: No animation data found',
        ErrorType.VRM_LOADING,
        ErrorSeverity.MEDIUM,
        {
          context: {
            component: 'loadVRMAnimation',
            action: 'loadAsync',
            metadata: { url, hasUserData: !!gltf.userData }
          },
          userMessage: 'アニメーションファイルの形式が正しくありません。'
        }
      );
    }

    const vrmAnimations: VRMAnimation[] = gltf.userData.vrmAnimations;
    const vrmAnimation: VRMAnimation | undefined = vrmAnimations[0];

    return vrmAnimation ?? null;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      `Failed to load VRM animation: ${error.message}`,
      ErrorType.VRM_LOADING,
      ErrorSeverity.MEDIUM,
      {
        originalError: error,
        context: {
          component: 'loadVRMAnimation',
          action: 'loadAsync',
          metadata: { url }
        },
        userMessage: 'アニメーションファイルの読み込みに失敗しました。'
      }
    );
  }
}
