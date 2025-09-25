import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Message, textsToScreenplay, Screenplay } from '@/features/messages/messages';
import { getChatResponseStream } from '@/features/chat/openAiChat';
import { ChatStore } from '@/types/store';
import { KoeiroParam } from '@/features/constants/koeiroParam';
import { AppError, ErrorType, ErrorSeverity, errorHandler, handleApiError } from '@/lib/errorHandler';

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
  // Initial state
  chatProcessing: false,
  chatLog: [],
  assistantMessage: '',

  // Basic setters
  setChatProcessing: (processing: boolean) => 
    set({ chatProcessing: processing }),

  setChatLog: (log: Message[]) => 
    set({ chatLog: log }),

  setAssistantMessage: (message: string) => 
    set({ assistantMessage: message }),

  // Chat actions
  addMessage: (message: Message) =>
    set((state) => ({ 
      chatLog: [...state.chatLog, message] 
    })),

  updateMessage: (index: number, content: string) =>
    set((state) => ({
      chatLog: state.chatLog.map((message, i) => 
        i === index 
          ? { ...message, content } 
          : message
      )
    })),

  clearChat: () => 
    set({ 
      chatLog: [], 
      assistantMessage: '',
      chatProcessing: false 
    }),

  getChatLog: () => get().chatLog,

  // Complex chat handling logic moved from index.tsx
  handleSendChat: async (
    text: string, 
    openAiKey: string, 
    systemPrompt: string,
    koeiroParam: KoeiroParam,
    koeiromapKey: string,
    onSpeakAi: (screenplay: Screenplay) => void
  ) => {
    const { setChatProcessing, setChatLog, setAssistantMessage, chatLog } = get();

    if (!openAiKey) {
      setAssistantMessage("API key not entered");
      return;
    }

    const newMessage = text;

    if (newMessage == null || newMessage.trim() === '') return;

    setChatProcessing(true);
    
    // Add and display user's message
    const messageLog: Message[] = [
      ...chatLog,
      { role: "user", content: newMessage },
    ];
    setChatLog(messageLog);

    // Prepare messages for ChatGPT
    const messages: Message[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messageLog,
    ];

    try {
      const stream = await getChatResponseStream(messages, openAiKey).catch(
        (e) => {
          handleApiError(e, 'ChatGPT', {
            component: 'chatStore',
            action: 'getChatResponseStream'
          });
          return null;
        }
      );

      if (stream == null) {
        setChatProcessing(false);
        return;
      }

      const reader = stream.getReader();
      let receivedMessage = "";
      let aiTextLog = "";
      let tag = "";
      const sentences = new Array<string>();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          receivedMessage += value;

          // Detect tag portion of response content
          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);
          }

          // Process response by extracting sentences one by one
          const sentenceMatch = receivedMessage.match(
            /^(.+[。．！？\n]|.{10,}[、,])/
          );
          if (sentenceMatch && sentenceMatch[0]) {
            const sentence = sentenceMatch[0];
            sentences.push(sentence);
            receivedMessage = receivedMessage
              .slice(sentence.length)
              .trimStart();

            // Skip if string doesn't need or can't be spoken
            if (
              !sentence.replace(
                /^[\s\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]]+$/g,
                ""
              )
            ) {
              continue;
            }

            const aiText = `${tag} ${sentence}`;
            aiTextLog += aiText;

            // Convert to screenplay and trigger audio synthesis
            const aiTalks = textsToScreenplay([aiText], koeiroParam);
            
            // Update assistant message with current progress
            const currentAssistantMessage = sentences.join(" ");
            
            // Generate & play audio for each sentence
            onSpeakAi(aiTalks[0]);
            setAssistantMessage(currentAssistantMessage);
          }
        }
      } catch (e: any) {
        const error = new AppError(
          `Stream processing error: ${e.message}`,
          ErrorType.API,
          ErrorSeverity.MEDIUM,
          {
            originalError: e,
            context: {
              component: 'chatStore',
              action: 'processStream',
              metadata: {
                receivedMessage: receivedMessage.substring(0, 100),
                sentencesProcessed: sentences.length
              }
            },
            userMessage: '応答の処理中にエラーが発生しました。'
          }
        );
        errorHandler.handle(error);
        setChatProcessing(false);
        setAssistantMessage('申し訳ございません。応答の処理中にエラーが発生しました。');
      } finally {
        reader.releaseLock();
      }

      // Add assistant's response to log
      const messageLogAssistant: Message[] = [
        ...messageLog,
        { role: "assistant", content: aiTextLog },
      ];

      setChatLog(messageLogAssistant);
      setChatProcessing(false);
    } catch (error: any) {
      const appError = error instanceof AppError ? error : new AppError(
        `Chat request failed: ${error.message}`,
        ErrorType.API,
        ErrorSeverity.HIGH,
        {
          originalError: error,
          context: {
            component: 'chatStore',
            action: 'handleSendChat',
            metadata: {
              messageCount: messageLog.length,
              hasApiKey: !!openAiKey
            }
          },
          userMessage: 'チャットの処理中にエラーが発生しました。もう一度お試しください。'
        }
      );
      errorHandler.handle(appError);
      setChatProcessing(false);
      setAssistantMessage('申し訳ございません。チャットの処理中にエラーが発生しました。');
    }
  }
})));