import { create } from 'zustand';
import { Message, textsToScreenplay } from '@/features/messages/messages';
import { getChatResponseStream } from '@/features/chat/openAiChat';
import { ChatStore } from '@/types/store';

export const useChatStore = create<ChatStore>((set, get) => ({
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
  handleSendChat: async (text: string, openAiKey: string, systemPrompt: string) => {
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
          console.error(e);
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

            // Update assistant message with current progress
            const currentAssistantMessage = sentences.join(" ");
            setAssistantMessage(currentAssistantMessage);
          }
        }
      } catch (e) {
        setChatProcessing(false);
        console.error(e);
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
    } catch (error) {
      console.error('Error in handleSendChat:', error);
      setChatProcessing(false);
      setAssistantMessage('Error processing chat request');
    }
  }
}));