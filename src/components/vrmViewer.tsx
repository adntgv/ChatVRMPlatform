import { useContext, useCallback } from "react";
import { ViewerContext } from "../features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";
import { errorHandler } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";

export default function VrmViewer() {
  const { viewer } = useContext(ViewerContext);

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        viewer.setup(canvas);
        
        // Load default VRM with error handling
        const defaultVrmUrl = buildUrl("/AvatarSample_B.vrm");
        logger.logVrmLoading("AvatarSample_B.vrm", { component: 'VrmViewer', action: 'loadDefault' });
        viewer.loadVrm(defaultVrmUrl).catch((error) => {
          // Error is already handled by errorHandler in loadVrm
          logger.logVrmError("AvatarSample_B.vrm", error, { component: 'VrmViewer', action: 'loadDefault' });
        });

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
    [viewer]
  );

  return (
    <div className={"absolute top-0 left-0 w-screen h-[100svh] -z-10"}>
      <canvas ref={canvasRef} className={"h-full w-full"}></canvas>
    </div>
  );
}
