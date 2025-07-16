import { MessageInput } from "@/components/messageInput";
import { useState, useEffect, useCallback, useContext, Profiler, useMemo, memo } from "react";
import { useChatStore } from "@/store/chatStore";
import { useConfigStore } from "@/store/configStore";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { Screenplay } from "@/features/messages/messages";
import { performanceMonitor } from "@/utils/performanceProfiler";

/**
 * Provides text and voice input
 *
 * Automatically sends when voice recognition is complete, disables input during response generation
 *
 */
const MessageInputContainerComponent = memo(() => {
  // Get state and actions from stores with selective subscriptions
  const chatProcessing = useChatStore(state => state.chatProcessing);
  const handleSendChat = useChatStore(state => state.handleSendChat);
  
  // Use individual selectors to avoid object creation in selector
  const openAiKey = useConfigStore(state => state.openAiKey);
  const systemPrompt = useConfigStore(state => state.systemPrompt);
  const koeiroParam = useConfigStore(state => state.koeiroParam);
  const koeiromapKey = useConfigStore(state => state.koeiromapKey);
  
  const { viewer } = useContext(ViewerContext);
  const [userMessage, setUserMessage] = useState("");
  const [speechRecognition, setSpeechRecognition] =
    useState<SpeechRecognition>();
  const [isMicRecording, setIsMicRecording] = useState(false);

  // Memoize the speech handler to prevent recreation on every render
  const onSpeakAi = useCallback(
    (screenplay: Screenplay) => {
      speakCharacter(screenplay, viewer, koeiromapKey);
    },
    [viewer, koeiromapKey]
  );

  // Process voice recognition results
  const handleRecognitionResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setUserMessage(text);

      // When speech ends
      if (event.results[0].isFinal) {
        setUserMessage(text);
        // Start response generation
        handleSendChat(
          text, 
          openAiKey, 
          systemPrompt, 
          koeiroParam, 
          koeiromapKey,
          onSpeakAi
        );
      }
    },
    [handleSendChat, openAiKey, systemPrompt, koeiroParam, koeiromapKey, onSpeakAi]
  );

  // End recognition if silence continues
  const handleRecognitionEnd = useCallback(() => {
    setIsMicRecording(false);
  }, []);

  const handleClickMicButton = useCallback(() => {
    if (isMicRecording) {
      speechRecognition?.abort();
      setIsMicRecording(false);

      return;
    }

    speechRecognition?.start();
    setIsMicRecording(true);
  }, [isMicRecording, speechRecognition]);

  const handleClickSendButton = useCallback(() => {
    handleSendChat(
      userMessage, 
      openAiKey, 
      systemPrompt, 
      koeiroParam, 
      koeiromapKey,
      onSpeakAi
    );
  }, [handleSendChat, userMessage, openAiKey, systemPrompt, koeiroParam, koeiromapKey, onSpeakAi]);

  useEffect(() => {
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;

    // Handle environments that don't support SpeechRecognition like Firefox
    if (!SpeechRecognition) {
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true; // Return interim recognition results
    recognition.continuous = false; // End recognition when speech ends

    recognition.addEventListener("result", handleRecognitionResult);
    recognition.addEventListener("end", handleRecognitionEnd);

    setSpeechRecognition(recognition);
  }, [handleRecognitionResult, handleRecognitionEnd]);

  useEffect(() => {
    if (!chatProcessing) {
      setUserMessage("");
    }
  }, [chatProcessing]);

  // Memoize the change handler to prevent recreation
  const handleChangeUserMessage = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUserMessage(e.target.value);
  }, []);

  return (
    <MessageInput
      userMessage={userMessage}
      isChatProcessing={chatProcessing}
      isMicRecording={isMicRecording}
      onChangeUserMessage={handleChangeUserMessage}
      onClickMicButton={handleClickMicButton}
      onClickSendButton={handleClickSendButton}
    />
  );
});

MessageInputContainerComponent.displayName = 'MessageInputContainerComponent';

export const MessageInputContainer = () => (
  <Profiler id="MessageInputContainer" onRender={performanceMonitor.recordRender}>
    <MessageInputContainerComponent />
  </Profiler>
);
