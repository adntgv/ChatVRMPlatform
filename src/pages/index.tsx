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
      <MessageInputContainer />
      <Menu />
      <GitHubLink />
    </div>
  );
}
