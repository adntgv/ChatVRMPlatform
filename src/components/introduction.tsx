import { useState, useCallback } from "react";
import { Link } from "./link";

type Props = {
  openAiKey: string;
  koeiroMapKey: string;
  onChangeAiKey: (openAiKey: string) => void;
  onChangeKoeiromapKey: (koeiromapKey: string) => void;
};
export const Introduction = ({
  openAiKey,
  koeiroMapKey,
  onChangeAiKey,
  onChangeKoeiromapKey,
}: Props) => {
  const [opened, setOpened] = useState(true);

  const handleAiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeAiKey(event.target.value);
    },
    [onChangeAiKey]
  );

  const handleKoeiromapKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeKoeiromapKey(event.target.value);
    },
    [onChangeKoeiromapKey]
  );

  return opened ? (
    <div className="absolute z-40 w-full h-full px-24 py-40  bg-black/30 font-M_PLUS_2">
      <div className="mx-auto my-auto max-w-3xl max-h-full p-24 overflow-auto bg-white rounded-16">
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary ">
            About This Application
          </div>
          <div>
            You can enjoy conversations with 3D characters using only a web browser, with microphone input, text input, and speech synthesis. You can also change characters (VRM), personality settings, and voice adjustments.
          </div>
        </div>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            Technical Introduction
          </div>
          <div>
            For 3D model display and manipulation, we use
            <Link
              url={"https://github.com/pixiv/three-vrm"}
              label={"@pixiv/three-vrm"}
            />
            , for conversation generation we use
            <Link
              url={
                "https://openai.com/blog/introducing-chatgpt-and-whisper-apis"
              }
              label={"ChatGPT API"}
            />
            , and for speech synthesis we use
            <Link url={"https://koemotion.rinna.co.jp/"} label={"Koemotion"} />
            &apos;s
            <Link
              url={
                "https://developers.rinna.co.jp/product/#product=koeiromap-free"
              }
              label={"Koeiromap API"}
            />
            . For more details, please see this
            <Link
              url={"https://inside.pixiv.blog/2023/04/28/160000"}
              label={"technical article"}
            />
            .
          </div>
          <div className="my-16">
            This demo&apos;s source code is available on GitHub. Feel free to try modifications and changes!
            <br />
            Repository:
            <Link
              url={"https://github.com/pixiv/ChatVRM"}
              label={"https://github.com/pixiv/ChatVRM"}
            />
          </div>
        </div>

        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            Usage Notes
          </div>
          <div>
            Please do not intentionally prompt discriminatory or violent statements, or statements that demean specific individuals. When replacing characters using VRM models, please follow the model&apos;s terms of use.
          </div>
        </div>

        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            Koeiromap API Key
          </div>
          <input
            type="text"
            placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            value={koeiroMapKey}
            onChange={handleKoeiromapKeyChange}
            className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
          ></input>
          <div>
            Please obtain an API key from rinna Developers.
            <Link
              url="https://developers.rinna.co.jp/product/#product=koeiromap-free"
              label="Details here"
            />
          </div>
        </div>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            OpenAI API Key
          </div>
          <input
            type="text"
            placeholder="sk-..."
            value={openAiKey}
            onChange={handleAiKeyChange}
            className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
          ></input>
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
        <div className="my-24">
          <button
            onClick={() => {
              setOpened(false);
            }}
            className="font-bold bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled text-white px-24 py-8 rounded-oval"
          >
            Enter API Key to Start
          </button>
        </div>
      </div>
    </div>
  ) : null;
};
