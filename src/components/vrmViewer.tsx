import { useContext, useCallback, useEffect } from "react";
import { ViewerContext } from "../features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";
import { errorHandler } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";

interface VrmViewerProps {
  vrmUrl?: string;
  vrmFile?: File;
  dataUrl?: string;
}

export default function VrmViewer({ vrmUrl, vrmFile, dataUrl }: VrmViewerProps) {
  const { viewer } = useContext(ViewerContext);

  // Load VRM file when it changes
  useEffect(() => {
    if (vrmFile) {
      const blob = new Blob([vrmFile], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);

      logger.logVrmLoading(vrmFile.name, { component: 'VrmViewer', action: 'loadFile' });

      viewer.loadVrm(url).then(() => {
        logger.logVrmLoaded(vrmFile.name, 0, { component: 'VrmViewer', action: 'loadFile' });
      }).catch((error) => {
        logger.logVrmError(vrmFile.name, error as Error, { component: 'VrmViewer', action: 'loadFile' });
      }).finally(() => {
        window.URL.revokeObjectURL(url);
      });
    }
  }, [vrmFile, viewer]);

  // Load VRM data URL when it changes (for uploaded files)
  useEffect(() => {
    if (dataUrl && !vrmFile) {
      logger.logVrmLoading('uploaded-model', { component: 'VrmViewer', action: 'loadDataUrl' });
      viewer.loadVrm(dataUrl).catch((error) => {
        logger.logVrmError('uploaded-model', error, { component: 'VrmViewer', action: 'loadDataUrl' });
      });
    }
  }, [dataUrl, vrmFile, viewer]);

  // Load VRM URL when it changes
  useEffect(() => {
    if (vrmUrl && !dataUrl && !vrmFile) {
      const modelUrl = buildUrl(vrmUrl);
      const modelName = vrmUrl.split('/').pop() || vrmUrl;

      logger.logVrmLoading(modelName, { component: 'VrmViewer', action: 'loadUrl' });
      viewer.loadVrm(modelUrl).catch((error) => {
        logger.logVrmError(modelName, error, { component: 'VrmViewer', action: 'loadUrl' });
      });
    }
  }, [vrmUrl, dataUrl, vrmFile, viewer]);

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        viewer.setup(canvas);

        // Load initial VRM based on props or default
        if (dataUrl) {
          logger.logVrmLoading('uploaded-model', { component: 'VrmViewer', action: 'loadInitial' });
          viewer.loadVrm(dataUrl).catch((error) => {
            logger.logVrmError('uploaded-model', error, { component: 'VrmViewer', action: 'loadInitial' });
          });
        } else if (vrmUrl) {
          const modelUrl = buildUrl(vrmUrl);
          const modelName = vrmUrl.split('/').pop() || vrmUrl;
          logger.logVrmLoading(modelName, { component: 'VrmViewer', action: 'loadInitial' });
          viewer.loadVrm(modelUrl).catch((error) => {
            logger.logVrmError(modelName, error, { component: 'VrmViewer', action: 'loadInitial' });
          });
        } else if (!vrmFile) {
          const defaultVrmUrl = buildUrl("/AvatarSample_B.vrm");
          logger.logVrmLoading("AvatarSample_B.vrm", { component: 'VrmViewer', action: 'loadDefault' });
          viewer.loadVrm(defaultVrmUrl).catch((error) => {
            logger.logVrmError("AvatarSample_B.vrm", error, { component: 'VrmViewer', action: 'loadDefault' });
          });
        }

        // Drag and DropでVRMを差し替え
        canvas.addEventListener("dragover", function (event) {
          event.preventDefault();
        });

        canvas.addEventListener("drop", async function (event) {
          event.preventDefault();

          const files = event.dataTransfer?.files;
          if (!files) {
            return;
          }

          const file = files[0];
          if (!file) {
            return;
          }

          const file_type = file.name.split(".").pop();
          if (file_type === "vrm") {
            const blob = new Blob([file], { type: "application/octet-stream" });
            const url = window.URL.createObjectURL(blob);
            
            logger.logVrmLoading(file.name, { component: 'VrmViewer', action: 'dropLoad' });
            
            try {
              await viewer.loadVrm(url);
              logger.logVrmLoaded(file.name, 0, { component: 'VrmViewer', action: 'dropLoad' });
            } catch (error) {
              // Error is already handled by errorHandler in loadVrm
              logger.logVrmError(file.name, error as Error, { component: 'VrmViewer', action: 'dropLoad' });
              // Clean up the blob URL
              window.URL.revokeObjectURL(url);
            }
          }
        });
      }
    },
    [viewer, vrmUrl, vrmFile, dataUrl]
  );

  return (
    <div className={"absolute top-0 left-0 w-screen h-[100svh] -z-10"}>
      <canvas ref={canvasRef} className={"h-full w-full"}></canvas>
    </div>
  );
}
