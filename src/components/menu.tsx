import { IconButton } from "./iconButton";
import { ChatLog } from "./chatLog";
import React, { useCallback, useContext, useRef, useState, Profiler } from "react";
import { Settings } from "./settings";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { AssistantText } from "./assistantText";
import { VrmUpload } from "./vrmUpload";
import { VrmManager } from "./vrmManager";
import { useVrmPersistence } from "@/hooks/useVrmPersistence";
import { useChatStore } from "@/store/chatStore";
import { useConfigStore } from "@/store/configStore";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { performanceMonitor } from "@/utils/performanceProfiler";

const MenuComponent = () => {
  // Get state and actions from stores
  const { chatLog, assistantMessage, clearChat, updateMessage } = useChatStore();
  const { 
    openAiKey, 
    systemPrompt, 
    koeiroParam, 
    koeiromapKey,
    setOpenAiKey,
    setSystemPrompt,
    setKoeiroParam,
    setKoeiromapKey,
    resetToDefaults
  } = useConfigStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const [showVrmUpload, setShowVrmUpload] = useState(false);
  const [showVrmManager, setShowVrmManager] = useState(false);
  const [isVrmLoading, setIsVrmLoading] = useState(false);
  const { viewer } = useContext(ViewerContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // VRM persistence hook
  const { loadLastUsedVrm } = useVrmPersistence({
    onVrmLoad: async (url: string) => {
      setIsVrmLoading(true);
      try {
        await viewer.loadVrm(url);
      } catch (error) {
        console.error('Failed to load VRM:', error);
      } finally {
        setIsVrmLoading(false);
      }
    },
    autoLoadLastUsed: false, // We'll manually trigger this
  });

  const handleChangeSystemPrompt = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSystemPrompt(event.target.value);
    },
    [setSystemPrompt]
  );

  const handleAiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setOpenAiKey(event.target.value);
    },
    [setOpenAiKey]
  );

  const handleChangeKoeiromapKey = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setKoeiromapKey(event.target.value);
    },
    [setKoeiromapKey]
  );

  const handleChangeKoeiroParam = useCallback(
    (x: number, y: number) => {
      setKoeiroParam({
        speakerX: x,
        speakerY: y,
      });
    },
    [setKoeiroParam]
  );

  const handleClickOpenVrmFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleChangeVrmFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const file = files[0];
      if (!file) return;

      const file_type = file.name.split(".").pop();

      if (file_type === "vrm") {
        const blob = new Blob([file], { type: "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);
        viewer.loadVrm(url);
      }

      event.target.value = "";
    },
    [viewer]
  );

  const handleVrmLoad = useCallback(async (url: string) => {
    setIsVrmLoading(true);
    try {
      await viewer.loadVrm(url);
      setShowVrmUpload(false);
    } catch (error) {
      console.error('Failed to load VRM:', error);
    } finally {
      setIsVrmLoading(false);
    }
  }, [viewer]);

  return (
    <>
      <div className="absolute z-10 m-24">
        <div className="grid grid-flow-col gap-[8px]">
          <IconButton
            iconName="24/Menu"
            label="Settings"
            isProcessing={false}
            onClick={() => setShowSettings(true)}
          ></IconButton>
          <IconButton
            iconName="24/Add"
            label="VRM Upload"
            isProcessing={isVrmLoading}
            onClick={() => setShowVrmUpload(true)}
          />
          <IconButton
            iconName="24/Menu"
            label="VRM Manager"
            isProcessing={false}
            onClick={() => setShowVrmManager(true)}
          />
          <IconButton
            iconName="24/CommentFill"
            label="Last VRM"
            isProcessing={isVrmLoading}
            onClick={loadLastUsedVrm}
          />
          {showChatLog ? (
            <IconButton
              iconName="24/CommentOutline"
              label="Chat Log"
              isProcessing={false}
              onClick={() => setShowChatLog(false)}
            />
          ) : (
            <IconButton
              iconName="24/CommentFill"
              label="Chat Log"
              isProcessing={false}
              disabled={chatLog.length <= 0}
              onClick={() => setShowChatLog(true)}
            />
          )}
        </div>
      </div>
      {showChatLog && <ChatLog messages={chatLog} />}
      {showVrmUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">VRM File Upload</h2>
              <button
                onClick={() => setShowVrmUpload(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isVrmLoading}
              >
                ✕
              </button>
            </div>
            <VrmUpload
              onVrmLoad={handleVrmLoad}
              isLoading={isVrmLoading}
              disabled={isVrmLoading}
              saveToStorage={true}
            />
          </div>
        </div>
      )}
      {showVrmManager && (
        <VrmManager
          onVrmSelect={handleVrmLoad}
          onClose={() => setShowVrmManager(false)}
        />
      )}
      {showSettings && (
        <Settings
          openAiKey={openAiKey}
          chatLog={chatLog}
          systemPrompt={systemPrompt}
          koeiroParam={koeiroParam}
          koeiromapKey={koeiromapKey}
          onClickClose={() => setShowSettings(false)}
          onChangeAiKey={handleAiKeyChange}
          onChangeSystemPrompt={handleChangeSystemPrompt}
          onChangeChatLog={(index: number, text: string) => updateMessage(index, text)}
          onChangeKoeiroParam={handleChangeKoeiroParam}
          onClickOpenVrmFile={handleClickOpenVrmFile}
          onClickResetChatLog={clearChat}
          onClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
          onChangeKoeiromapKey={handleChangeKoeiromapKey}
        />
      )}
      {!showChatLog && assistantMessage && (
        <AssistantText message={assistantMessage} />
      )}
      <input
        type="file"
        className="hidden"
        accept=".vrm"
        ref={fileInputRef}
        onChange={handleChangeVrmFile}
      />
    </>
  );
};

export const Menu = () => (
  <Profiler id="Menu" onRender={performanceMonitor.recordRender}>
    <MenuComponent />
  </Profiler>
);
