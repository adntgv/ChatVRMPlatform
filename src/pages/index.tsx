import { useCallback, useContext, useEffect } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import { useChatStore } from "@/store/chatStore";
import { useConfigStore } from "@/store/configStore";

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  // Chat store with selective subscriptions
  const chatProcessing = useChatStore(state => state.chatProcessing);
  const chatLog = useChatStore(state => state.chatLog);
  const assistantMessage = useChatStore(state => state.assistantMessage);
  const setChatLog = useChatStore(state => state.setChatLog);
  const handleSendChat = useChatStore(state => state.handleSendChat);

  // Config store with selective subscriptions
  const systemPrompt = useConfigStore(state => state.systemPrompt);
  const openAiKey = useConfigStore(state => state.openAiKey);
  const koeiromapKey = useConfigStore(state => state.koeiromapKey);
  const koeiroParam = useConfigStore(state => state.koeiroParam);
  const setSystemPrompt = useConfigStore(state => state.setSystemPrompt);
  const setOpenAiKey = useConfigStore(state => state.setOpenAiKey);
  const setKoeiromapKey = useConfigStore(state => state.setKoeiromapKey);
  const setKoeiroParam = useConfigStore(state => state.setKoeiroParam);
  const loadFromStorage = useConfigStore(state => state.loadFromStorage);
  const saveToStorage = useConfigStore(state => state.saveToStorage);

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
