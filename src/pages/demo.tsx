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
  const DEMO_ELEVENLABS_KEY = process.env.NEXT_PUBLIC_DEMO_ELEVENLABS_KEY || 'sk_3d546d3031ae7e09245ada2ca396f0f418d6cfb101772c21';
  const DEMO_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice

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
      if (!DEMO_ELEVENLABS_KEY) {
        console.warn("Demo ElevenLabs API key not configured");
        return;
      }
      // Use ElevenLabs for demo
      speakCharacter(screenplay, viewer, DEMO_ELEVENLABS_KEY, onStart, onEnd, {
        ttsProvider: 'elevenlabs',
        voice: { voiceId: DEMO_VOICE_ID }
      });
    },
    [viewer, DEMO_ELEVENLABS_KEY, DEMO_VOICE_ID]
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
    <div className="font-M_PLUS_2 h-screen grid grid-rows-[auto_auto_1fr] overflow-hidden">
      <Meta />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 text-white px-3 py-2 shadow-lg">
        <div className="container mx-auto flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold">Try Live Demo</h1>
            <p className="text-xs opacity-90 hidden sm:block">{rateLimit.remaining}/{rateLimit.total} messages left</p>
          </div>
          <div className="flex gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => router.push('/')}
              className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-white/20 hover:bg-white/30 rounded transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleBuildOwn}
              className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-green-600 hover:bg-green-700 rounded font-bold transition-colors"
            >
              Build Own
            </button>
          </div>
        </div>
      </div>

      {/* Template Selector */}
      <div className="bg-white border-b shadow-sm px-3 py-2">
        <div className="container mx-auto flex items-center gap-2">
          <label htmlFor="template-select" className="text-xs text-gray-600 shrink-0">
            Use case:
          </label>
          <select
            id="template-select"
            value={selectedTemplate.id}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="flex-1 px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            {DEMO_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.icon} {template.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Demo Area - Grid row with 1fr takes all remaining space */}
      <div className="relative overflow-hidden h-full w-full">
        {/* VRM Viewer - Fills the parent container */}
        <VrmViewer
          vrmUrl={selectedTemplate.config.vrmModel?.url}
          vrmFile={undefined}
          dataUrl={undefined}
        />

        {/* Message Input - Positioned at bottom of this container */}
        <MessageInputContainer />

        {/* Assistant Message Display */}
        {assistantMessage && (
          <div className="absolute bottom-20 left-0 right-0 z-10">
            <AssistantText message={assistantMessage} />
          </div>
        )}

        {/* Usage Warning */}
        {rateLimit.percentage > 70 && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 max-w-[90%] sm:max-w-none">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded shadow-lg">
              <p className="font-bold text-xs sm:text-sm">
                {rateLimit.remaining} messages left
              </p>
              <button
                onClick={handleBuildOwn}
                className="text-xs underline hover:no-underline"
              >
                Create own assistant →
              </button>
            </div>
          </div>
        )}

        {/* CTA Banner after 3+ messages */}
        {chatLog.length >= 3 && (
          <div className="absolute top-2 right-2 z-20 max-w-[90%] sm:max-w-xs">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-2 sm:p-3 rounded shadow-xl">
              <h3 className="font-bold text-xs sm:text-sm mb-1">Like what you see?</h3>
              <p className="text-xs mb-2 hidden sm:block">Create unlimited assistants</p>
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={handleBuildOwn}
                  className="flex-1 px-2 py-1 text-xs bg-white text-green-600 rounded font-bold hover:bg-gray-100 transition-colors"
                >
                  Build Own
                </button>
                <button
                  onClick={handleGetStarted}
                  className="flex-1 px-2 py-1 text-xs bg-yellow-400 text-gray-900 rounded font-bold hover:bg-yellow-300 transition-colors"
                >
                  Build For Me
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
