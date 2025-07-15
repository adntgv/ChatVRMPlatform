import { useCallback, useContext, useEffect } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  textsToScreenplay,
  Screenplay,
} from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import { useChatStore } from "@/store/chatStore";
import { useConfigStore } from "@/store/configStore";

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  // Chat store
  const { 
    chatProcessing, 
    chatLog, 
    assistantMessage, 
    setChatLog,
    handleSendChat 
  } = useChatStore();

  // Config store
  const { 
    systemPrompt, 
    openAiKey, 
    koeiromapKey, 
    koeiroParam,
    setSystemPrompt,
    setOpenAiKey,
    setKoeiromapKey,
    setKoeiroParam,
    loadFromStorage,
    saveToStorage
  } = useConfigStore();

  // Load from localStorage on mount
  useEffect(() => {
    loadFromStorage();
    if (window.localStorage.getItem("chatVRMParams")) {
      const params = JSON.parse(
        window.localStorage.getItem("chatVRMParams") as string
      );
      if (params.chatLog) {
        setChatLog(params.chatLog);
      }
    }
  }, [loadFromStorage, setChatLog]);

  // Save to localStorage when relevant state changes
  useEffect(() => {
    process.nextTick(() => {
      saveToStorage(chatLog);
    });
  }, [systemPrompt, koeiroParam, chatLog, saveToStorage]);

  const { updateMessage, clearChat } = useChatStore();
  const { resetToDefaults } = useConfigStore();

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      updateMessage(targetIndex, text);
    },
    [updateMessage]
  );

  const handleResetChatLog = useCallback(() => {
    clearChat();
  }, [clearChat]);

  const handleResetSystemPrompt = useCallback(() => {
    resetToDefaults();
  }, [resetToDefaults]);

  /**
   * Play audio by requesting each sentence in series
   */
  const handleSpeakAi = useCallback(
    async (
      screenplay: Screenplay,
      onStart?: () => void,
      onEnd?: () => void
    ) => {
      speakCharacter(screenplay, viewer, koeiromapKey, onStart, onEnd);
    },
    [viewer, koeiromapKey]
  );

  /**
   * Wrapper for store's handleSendChat with audio integration
   */
  const handleSendChatWithAudio = useCallback(
    async (text: string) => {
      // Use the store's handleSendChat method
      await handleSendChat(text, openAiKey, systemPrompt);
    },
    [handleSendChat, openAiKey, systemPrompt]
  );

  return (
    <div className={"font-M_PLUS_2"}>
      <Meta />
      <Introduction
        openAiKey={openAiKey}
        koeiroMapKey={koeiromapKey}
        onChangeAiKey={setOpenAiKey}
        onChangeKoeiromapKey={setKoeiromapKey}
      />
      <VrmViewer />
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChatWithAudio}
      />
      <Menu
        openAiKey={openAiKey}
        systemPrompt={systemPrompt}
        chatLog={chatLog}
        koeiroParam={koeiroParam}
        assistantMessage={assistantMessage}
        koeiromapKey={koeiromapKey}
        onChangeAiKey={setOpenAiKey}
        onChangeSystemPrompt={setSystemPrompt}
        onChangeChatLog={handleChangeChatLog}
        onChangeKoeiromapParam={setKoeiroParam}
        handleClickResetChatLog={handleResetChatLog}
        handleClickResetSystemPrompt={handleResetSystemPrompt}
        onChangeKoeiromapKey={setKoeiromapKey}
      />
      <GitHubLink />
    </div>
  );
}
