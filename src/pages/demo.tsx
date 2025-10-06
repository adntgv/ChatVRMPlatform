import { useState, useCallback, useContext, useEffect } from "react";
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
import { Meta } from "@/components/meta";
import { AssistantText } from "@/components/assistantText";
import { INSTANCE_TEMPLATES } from "@/features/instances/instanceService";
import { useRateLimit } from "@/lib/rateLimit";
import { analytics, usePageView } from "@/lib/analytics";

// Get first 3 outcome-focused templates
const DEMO_TEMPLATES = INSTANCE_TEMPLATES.slice(0, 3);

export default function DemoPage() {
  const router = useRouter();
  const { viewer } = useContext(ViewerContext);
  const rateLimit = useRateLimit('demo');

  // Track page view
  usePageView('demo');

  const [selectedTemplate, setSelectedTemplate] = useState(DEMO_TEMPLATES[0]);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);

  // Use demo API keys (you'll need to set these in env)
  const DEMO_OPENAI_KEY = process.env.NEXT_PUBLIC_DEMO_OPENAI_KEY || '';
  const DEMO_KOEIROMAP_KEY = process.env.NEXT_PUBLIC_DEMO_KOEIROMAP_KEY || '';

  const handleTemplateSelect = (templateId: string) => {
    const template = DEMO_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setChatLog([]);
      setAssistantMessage("");
      analytics.track('demo_cta_click', { templateId });
    }
  };

  const handleSpeakAi = useCallback(
    async (
      screenplay: Screenplay,
      onStart?: () => void,
      onEnd?: () => void
    ) => {
      if (!DEMO_KOEIROMAP_KEY) {
        console.warn("Demo Koeiromap API key not configured");
        return;
      }
      speakCharacter(screenplay, viewer, DEMO_KOEIROMAP_KEY, onStart, onEnd);
    },
    [viewer]
  );

  const handleSendChat = useCallback(
    async (text: string) => {
      // Check rate limit
      if (!rateLimit.allowed) {
        setAssistantMessage(
          `Demo limit reached (${rateLimit.total} messages). Create your own assistant to continue! Time until reset: ${rateLimit.timeUntilReset}`
        );
        analytics.track('demo_session_end', {
          reason: 'rate_limit',
          messagesSent: chatLog.length
        });
        return;
      }

      if (!DEMO_OPENAI_KEY) {
        setAssistantMessage("Demo API key not configured. Please contact support.");
        return;
      }

      // Track first interaction
      if (!hasInteracted) {
        setHasInteracted(true);
        analytics.track('demo_interaction_start', {
          templateId: selectedTemplate.id
        });
      }

      // Record usage
      rateLimit.recordUsage();
      analytics.track('demo_message_sent', {
        templateId: selectedTemplate.id,
        messageCount: chatLog.length + 1
      });

      const newMessage = text;
      if (newMessage == null) return;

      setChatProcessing(true);

      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: newMessage },
      ];
      setChatLog(messageLog);

      const messages: Message[] = [
        {
          role: "system",
          content: selectedTemplate.config.personality!.systemPrompt,
        },
        ...messageLog,
      ];

      const stream = await getChatResponseStream(messages, DEMO_OPENAI_KEY).catch(
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

          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);
          }

          const sentenceMatch = receivedMessage.match(
            /^(.+[。．！？\n]|.{10,}[、,])/
          );
          if (sentenceMatch && sentenceMatch[0]) {
            const sentence = sentenceMatch[0];
            sentences.push(sentence);
            receivedMessage = receivedMessage
              .slice(sentence.length)
              .trimStart();

            if (
              !sentence.replace(
                /^[\s\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]]+$/g,
                ""
              )
            ) {
              continue;
            }

            const aiText = `${tag} ${sentence}`;
            const voiceParams = selectedTemplate.config.voice!;
            const aiTalks = textsToScreenplay([aiText], voiceParams);
            aiTextLog += aiText;

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

      const messageLogAssistant: Message[] = [
        ...messageLog,
        { role: "assistant", content: aiTextLog },
      ];

      setChatLog(messageLogAssistant);
      setChatProcessing(false);
    },
    [chatLog, selectedTemplate, handleSpeakAi, rateLimit, hasInteracted]
  );

  const handleBuildOwn = () => {
    analytics.track('wizard_start', { source: 'demo' });
    router.push('/create');
  };

  const handleGetStarted = () => {
    analytics.track('demo_cta_click', { source: 'demo_page' });
    router.push('/reserve');
  };

  return (
    <div className="font-M_PLUS_2 h-screen flex flex-col">
      <Meta />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 text-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Try Live Demo</h1>
            <p className="text-sm opacity-90">No signup required • {rateLimit.remaining}/{rateLimit.total} messages left</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleBuildOwn}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-colors"
            >
              Build My Own
            </button>
          </div>
        </div>
      </div>

      {/* Template Selector */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="container mx-auto">
          <p className="text-sm text-gray-600 mb-3">Choose a use case to try:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DEMO_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedTemplate.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{template.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Demo Area */}
      <div className="flex-1 relative">
        {/* VRM Viewer */}
        <VrmViewer
          vrmUrl={selectedTemplate.config.vrmModel?.url}
          vrmFile={undefined}
          dataUrl={undefined}
        />

        {/* Message Input */}
        <MessageInputContainer />

        {/* Assistant Message Display */}
        {assistantMessage && (
          <div className="absolute bottom-20 left-0 right-0 z-10">
            <AssistantText message={assistantMessage} />
          </div>
        )}

        {/* Usage Warning */}
        {rateLimit.percentage > 70 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg">
              <p className="font-bold">
                {rateLimit.remaining} messages remaining in demo
              </p>
              <button
                onClick={handleBuildOwn}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Create your own assistant to continue →
              </button>
            </div>
          </div>
        )}

        {/* CTA Banner after 3+ messages */}
        {chatLog.length >= 3 && (
          <div className="absolute top-4 right-4 z-20 max-w-sm">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-lg shadow-xl">
              <h3 className="font-bold mb-2">Like what you see?</h3>
              <p className="text-sm mb-3">Create unlimited assistants with your own API keys</p>
              <div className="flex gap-2">
                <button
                  onClick={handleBuildOwn}
                  className="flex-1 px-3 py-2 bg-white text-green-600 rounded font-bold hover:bg-gray-100 transition-colors"
                >
                  Build My Own
                </button>
                <button
                  onClick={handleGetStarted}
                  className="flex-1 px-3 py-2 bg-yellow-400 text-gray-900 rounded font-bold hover:bg-yellow-300 transition-colors"
                >
                  We&apos;ll Build It
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
