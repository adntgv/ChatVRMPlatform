import React, { memo, useCallback, useMemo, useRef, useEffect } from "react";
import { config } from "@/config";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";
import {
  KoeiroParam,
  PRESET_A,
  PRESET_B,
  PRESET_C,
  PRESET_D,
} from "@/features/constants/koeiroParam";
import { Link } from "./link";
import { EmotionControl, Emotion } from "./emotionControl";
import { AnimationControl, Animation } from "./animationControl";

type Props = {
  openAiKey: string;
  systemPrompt: string;
  chatLog: Message[];
  koeiroParam: KoeiroParam;
  koeiromapKey: string;
  onClickClose: () => void;
  onChangeAiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeKoeiroParam: (x: number, y: number) => void;
  onClickOpenVrmFile: () => void;
  onClickResetChatLog: () => void;
  onClickResetSystemPrompt: () => void;
  onChangeKoeiromapKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // Emotion controls
  currentEmotion: Emotion;
  onEmotionChange: (emotion: Emotion) => void;
  // Animation controls
  animations: Animation[];
  currentAnimation: Animation | null;
  isPlaying: boolean;
  animationSpeed: number;
  loop: boolean;
  onAnimationUpload: (file: File) => void;
  onAnimationSelect: (animation: Animation) => void;
  onAnimationPlay: () => void;
  onAnimationStop: () => void;
  onSpeedChange: (speed: number) => void;
  onLoopToggle: (loop: boolean) => void;
};
export const Settings = memo(({
  openAiKey,
  chatLog,
  systemPrompt,
  koeiroParam,
  koeiromapKey,
  onClickClose,
  onChangeSystemPrompt,
  onChangeAiKey,
  onChangeChatLog,
  onChangeKoeiroParam,
  onClickOpenVrmFile,
  onClickResetChatLog,
  onClickResetSystemPrompt,
  onChangeKoeiromapKey,
  // Emotion controls
  currentEmotion,
  onEmotionChange,
  // Animation controls
  animations,
  currentAnimation,
  isPlaying,
  animationSpeed,
  loop,
  onAnimationUpload,
  onAnimationSelect,
  onAnimationPlay,
  onAnimationStop,
  onSpeedChange,
  onLoopToggle,
}: Props) => {
  // Memoize preset click handlers to prevent recreation
  const handlePresetA = useCallback(() => {
    onChangeKoeiroParam(PRESET_A.speakerX, PRESET_A.speakerY);
  }, [onChangeKoeiroParam]);
  
  const handlePresetB = useCallback(() => {
    onChangeKoeiroParam(PRESET_B.speakerX, PRESET_B.speakerY);
  }, [onChangeKoeiroParam]);
  
  const handlePresetC = useCallback(() => {
    onChangeKoeiroParam(PRESET_C.speakerX, PRESET_C.speakerY);
  }, [onChangeKoeiroParam]);
  
  const handlePresetD = useCallback(() => {
    onChangeKoeiroParam(PRESET_D.speakerX, PRESET_D.speakerY);
  }, [onChangeKoeiroParam]);

  // Use ref to track current koeiroParam values without causing re-renders
  const koeiroParamRef = useRef(koeiroParam);
  useEffect(() => {
    koeiroParamRef.current = koeiroParam;
  }, [koeiroParam]);

  // Memoize range change handlers using ref to avoid stale closures
  const handleSpeakerXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeKoeiroParam(Number(e.target.value), koeiroParamRef.current.speakerY);
  }, [onChangeKoeiroParam]);
  
  const handleSpeakerYChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeKoeiroParam(koeiroParamRef.current.speakerX, Number(e.target.value));
  }, [onChangeKoeiroParam]);

  // Memoize chat log items to prevent recreation
  const chatLogItems = useMemo(() => {
    return chatLog.map((value, index) => {
      const handleChatLogChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChangeChatLog(index, event.target.value);
      };

      return (
        <div
          key={index}
          className="my-8 grid grid-flow-col  grid-cols-[min-content_1fr] gap-x-fixed"
        >
          <div className="w-[64px] py-8">
            {value.role === "assistant" ? "Character" : "You"}
          </div>
          <input
            key={index}
            className="bg-surface1 hover:bg-surface1-hover rounded-8 w-full px-16 py-8"
            type="text"
            value={value.content}
            onChange={handleChatLogChange}
          />
        </div>
      );
    });
  }, [chatLog, onChangeChatLog]);
  return (
    <div className="absolute z-40 w-full h-full bg-white/80 backdrop-blur ">
      <div className="absolute m-24">
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={onClickClose}
        ></IconButton>
      </div>
      <div className="max-h-full overflow-auto">
        <div className="text-text1 max-w-3xl mx-auto px-24 py-64 ">
          <div className="my-24 typography-32 font-bold">Settings</div>
          <div className="my-24">
            <div className="my-16 typography-20 font-bold">OpenAI API Key</div>
            <input
              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
              type="text"
              placeholder="sk-..."
              value={openAiKey}
              onChange={onChangeAiKey}
            />
            <div>
              You can get an API key from the
              <Link
                url="https://platform.openai.com/account/api-keys"
                label="OpenAI website"
              />
              . Please enter your API key in the form.
            </div>
            <div className="my-16">
              ChatGPT
              The API is accessed directly from the browser. API keys and conversation content are not stored on Pixiv servers.
              <br />
              *Using ChatGPT API (GPT-3.5) model.
            </div>
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              Character Model
            </div>
            <div className="my-8">
              <TextButton onClick={onClickOpenVrmFile}>Open VRM</TextButton>
            </div>
          </div>
          
          <EmotionControl
            currentEmotion={currentEmotion}
            onEmotionChange={onEmotionChange}
          />
          
          <AnimationControl
            animations={animations}
            currentAnimation={currentAnimation}
            isPlaying={isPlaying}
            speed={animationSpeed}
            loop={loop}
            onAnimationUpload={onAnimationUpload}
            onAnimationSelect={onAnimationSelect}
            onAnimationPlay={onAnimationPlay}
            onAnimationStop={onAnimationStop}
            onSpeedChange={onSpeedChange}
            onLoopToggle={onLoopToggle}
          />
          <div className="my-40">
            <div className="my-8">
              <div className="my-16 typography-20 font-bold">
                Character Settings (System Prompt)
              </div>
              <TextButton onClick={onClickResetSystemPrompt}>
                Reset Character Settings
              </TextButton>
            </div>

            <textarea
              value={systemPrompt}
              onChange={onChangeSystemPrompt}
              className="px-16 py-8  bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full"
            ></textarea>
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">Voice Adjustment</div>
            <div>
              Using Koemotion&apos;s Koeiromap API. For more details, please see
              <Link
                url="https://koemotion.rinna.co.jp"
                label="https://koemotion.rinna.co.jp"
              />
              .
            </div>
            <div className="mt-16 font-bold">API Key</div>
            <div className="mt-8">
              <input
                className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                type="text"
                placeholder="..."
                value={koeiromapKey}
                onChange={onChangeKoeiromapKey}
              />
            </div>

            <div className="mt-16 font-bold">Presets</div>
            <div className="my-8 grid grid-cols-2 gap-[8px]">
              <TextButton onClick={handlePresetA}>
                Cute
              </TextButton>
              <TextButton onClick={handlePresetB}>
                Energetic
              </TextButton>
              <TextButton onClick={handlePresetC}>
                Cool
              </TextButton>
              <TextButton onClick={handlePresetD}>
                Deep
              </TextButton>
            </div>
            <div className="my-24">
              <div className="select-none">x : {koeiroParam.speakerX}</div>
              <input
                type="range"
                min={-10}
                max={config.ui.settingsSliderMax}
                step={0.001}
                value={koeiroParam.speakerX}
                className="mt-8 mb-16 input-range"
                onChange={handleSpeakerXChange}
              />
              <div className="select-none">y : {koeiroParam.speakerY}</div>
              <input
                type="range"
                min={-10}
                max={config.ui.settingsSliderMax}
                step={0.001}
                value={koeiroParam.speakerY}
                className="mt-8 mb-16 input-range"
                onChange={handleSpeakerYChange}
              />
            </div>
          </div>
          {chatLog.length > 0 && (
            <div className="my-40">
              <div className="my-8 grid-cols-2">
                <div className="my-16 typography-20 font-bold">Chat History</div>
                <TextButton onClick={onClickResetChatLog}>
                  Reset Chat History
                </TextButton>
              </div>
              <div className="my-8">
                {chatLogItems}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Settings.displayName = 'Settings';
