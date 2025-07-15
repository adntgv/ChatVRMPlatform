import { useContext, useCallback } from "react";
import { ViewerContext } from "../features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";
import { errorHandler } from "@/lib/errorHandler";

export default function VrmViewer() {
  const { viewer } = useContext(ViewerContext);

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        viewer.setup(canvas);
        
        // Load default VRM with error handling
        viewer.loadVrm(buildUrl("/AvatarSample_B.vrm")).catch((error) => {
          // Error is already handled by errorHandler in loadVrm
          console.error("Failed to load default VRM:", error);
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
            
            try {
              await viewer.loadVrm(url);
            } catch (error) {
              // Error is already handled by errorHandler in loadVrm
              console.error("Failed to load dropped VRM:", error);
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
