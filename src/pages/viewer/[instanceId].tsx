import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  Message,
  textsToScreenplay,
  Screenplay,
} from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { getChatResponseStream } from "@/features/chat/openAiChat";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import { useInstance, useInstances } from "@/features/instances/instanceContext";
import { AssistantText } from "@/components/assistantText";
import { MobileMenu, MobileMenuButton } from "@/components/MobileMenu";

export default function ViewerPage() {
  const router = useRouter();
  const { instanceId } = router.query;
  const { viewer } = useContext(ViewerContext);
  const { updateInstance, instances } = useInstances();

  // Get the current instance
  const instance = instanceId ? instances[instanceId as string] : null;

  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Load instance data
  useEffect(() => {
    if (instance) {
      setChatLog(instance.chatHistory || []);
    }
  }, [instance]);

  // Save chat log back to instance
  useEffect(() => {
    if (instance && instanceId) {
      updateInstance(instanceId as string, { chatHistory: chatLog });
    }
  }, [chatLog, instance, instanceId, updateInstance]);

  // Handle voice synthesis
  const handleSpeakAi = useCallback(
    async (
      screenplay: Screenplay,
      onStart?: () => void,
      onEnd?: () => void
    ) => {
      if (!instance?.apiKeys?.koeiromap) {
        console.warn("Koeiromap API key not configured");
        return;
      }
      speakCharacter(screenplay, viewer, instance.apiKeys.koeiromap, onStart, onEnd);
    },
    [viewer, instance]
  );

  // Handle sending chat messages
  const handleSendChat = useCallback(
    async (text: string) => {
      if (!instance) {
        setAssistantMessage("No instance loaded");
        return;
      }

      if (!instance.apiKeys?.openAI) {
        setAssistantMessage("OpenAI API key not configured for this instance");
        return;
      }

      const newMessage = text;
      if (newMessage == null) return;

      setChatProcessing(true);

      // Add user message to chat log
      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: newMessage },
      ];
      setChatLog(messageLog);

      // Prepare messages for ChatGPT
      const messages: Message[] = [
        {
          role: "system",
          content: instance.personality.systemPrompt,
        },
        ...messageLog,
      ];

      const stream = await getChatResponseStream(messages, instance.apiKeys.openAI).catch(
        (e) => {
          console.error(e);
          setAssistantMessage("Error: " + e.message);
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

          // Detect emotion tags
          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);
          }

          // Process sentences
          const sentenceMatch = receivedMessage.match(
            /^(.+[。．！？\n]|.{10,}[、,])/
          );
          if (sentenceMatch && sentenceMatch[0]) {
            const sentence = sentenceMatch[0];
            sentences.push(sentence);
            receivedMessage = receivedMessage
              .slice(sentence.length)
              .trimStart();

            // Skip empty sentences
            if (
              !sentence.replace(
                /^[\s\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]]+$/g,
                ""
              )
            ) {
              continue;
            }

            const aiText = `${tag} ${sentence}`;
            const aiTalks = textsToScreenplay([aiText], instance.voice);
            aiTextLog += aiText;

            // Generate and play voice
            const currentAssistantMessage = sentences.join(" ");
            handleSpeakAi(aiTalks[0], () => {
              setAssistantMessage(currentAssistantMessage);
            });
          }
        }
      } catch (e) {
        setChatProcessing(false);
        console.error(e);
      } finally {
        reader.releaseLock();
      }

      // Add assistant response to log
      const messageLogAssistant: Message[] = [
        ...messageLog,
        { role: "assistant", content: aiTextLog },
      ];

      setChatLog(messageLogAssistant);
      setChatProcessing(false);
    },
    [instance, chatLog, handleSpeakAi]
  );

  if (!instance) {
    return (
      <div className="font-M_PLUS_2 h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Instance Not Found</h2>
          <p className="text-gray-600 mb-6">
            The requested instance does not exist or could not be loaded.
          </p>
          <button
            onClick={() => router.push('/instances')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Go to Instance Manager
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-M_PLUS_2">
      <Meta />

      {/* Add padding to account for fixed header */}
      <div className="pt-20"></div>

      {/* Responsive Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 shadow-2xl border-b-2 border-gray-700 safe-top">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/instances')}
            className="touch-target flex items-center justify-center text-white font-bold"
          >
            <span className="text-2xl">←</span>
          </button>
          <div className="flex-1 mx-3 text-center">
            <h1 className="text-base font-bold text-white truncate">{instance.name}</h1>
          </div>
          <MobileMenuButton
            onClick={() => setShowMobileMenu(true)}
            className="text-white"
          />
        </div>

        {/* Desktop Header (unchanged) */}
        <div className="hidden md:flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/instances')}
              className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <span className="text-lg">←</span>
              <span>Back</span>
            </button>
            <div className="text-white">
              <h1 className="text-xl font-bold">{instance.name}</h1>
              {instance.description && (
                <p className="text-sm text-gray-300">{instance.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`px-5 py-2.5 ${
                showSettings
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-gray-900'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } text-sm font-bold rounded-lg shadow-lg transition-all transform hover:scale-105`}
            >
              {showSettings ? 'Hide Info' : 'Show Info'}
            </button>
            <button
              onClick={() => router.push(`/edit/${instanceId}`)}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>

      {/* VRM Viewer */}
      <VrmViewer
        vrmUrl={instance.vrmModel.url}
        vrmFile={instance.vrmModel.file}
        dataUrl={instance.vrmModel.dataUrl}
      />

      {/* Message Input */}
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChat}
      />

      {/* Assistant Message Display */}
      {assistantMessage && (
        <div className="absolute bottom-20 left-0 right-0 z-10">
          <AssistantText message={assistantMessage} />
        </div>
      )}

      {/* Mobile Menu for Actions */}
      <MobileMenu
        show={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        title="Actions"
      >
        <div className="space-y-3">
          <button
            onClick={() => {
              setShowMobileMenu(false);
              setShowSettings(!showSettings);
            }}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {showSettings ? 'Hide Info' : 'Show Instance Info'}
          </button>
          <button
            onClick={() => {
              setShowMobileMenu(false);
              router.push(`/edit/${instanceId}`);
            }}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            ✏️ Edit Instance
          </button>
          {instance.description && (
            <div className="px-4 py-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">{instance.description}</p>
            </div>
          )}
        </div>
      </MobileMenu>

      {/* Instance Settings - Mobile Bottom Sheet / Desktop Sidebar */}
      {showSettings && (
        <>
          {/* Mobile Bottom Sheet */}
          <MobileMenu
            show={showSettings}
            onClose={() => setShowSettings(false)}
            title="Instance Configuration"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold text-gray-700">Language:</span>
                <span className="capitalize text-gray-900 bg-gray-100 px-3 py-1 rounded">{instance.personality.language}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold text-gray-700">Voice Preset:</span>
                <span className="text-gray-900 bg-gray-100 px-3 py-1 rounded">{instance.voice.preset || 'Custom'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold text-gray-700">Messages:</span>
                <span className="text-gray-900 bg-gray-100 px-3 py-1 rounded">{chatLog.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold text-gray-700">OpenAI API:</span>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  instance.apiKeys?.openAI
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {instance.apiKeys?.openAI ? '✓ Configured' : '✗ Not set'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold text-gray-700">Koeiromap API:</span>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  instance.apiKeys?.koeiromap
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {instance.apiKeys?.koeiromap ? '✓ Configured' : '✗ Not set'}
                </span>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => {
                    if (confirm('Clear all chat history for this instance?')) {
                      setChatLog([]);
                      setAssistantMessage('');
                    }
                  }}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Clear Chat History
                </button>
              </div>
            </div>
          </MobileMenu>

          {/* Desktop Sidebar (unchanged) */}
          <div className="hidden md:block fixed top-24 right-6 z-40 bg-white rounded-xl shadow-2xl border-2 border-gray-300 p-6 w-80">
          <h3 className="font-bold text-lg mb-4 text-gray-900">Instance Configuration</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-gray-700">Language:</span>
              <span className="capitalize text-gray-900 bg-gray-100 px-2 py-1 rounded">{instance.personality.language}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-gray-700">Voice Preset:</span>
              <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded">{instance.voice.preset || 'Custom'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-gray-700">Messages:</span>
              <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded">{chatLog.length}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-gray-700">OpenAI API:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                instance.apiKeys?.openAI
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {instance.apiKeys?.openAI ? '✓ Configured' : '✗ Not set'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-gray-700">Koeiromap API:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                instance.apiKeys?.koeiromap
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {instance.apiKeys?.koeiromap ? '✓ Configured' : '✗ Not set'}
              </span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                if (confirm('Clear all chat history for this instance?')) {
                  setChatLog([]);
                  setAssistantMessage('');
                }
              }}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors"
            >
              Clear Chat History
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}