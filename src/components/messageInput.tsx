import { IconButton } from "./iconButton";

type Props = {
  userMessage: string;
  isMicRecording: boolean;
  isChatProcessing: boolean;
  onChangeUserMessage: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onClickSendButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onClickMicButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
};
export const MessageInput = ({
  userMessage,
  isMicRecording,
  isChatProcessing,
  onChangeUserMessage,
  onClickMicButton,
  onClickSendButton,
}: Props) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 safe-bottom">
      <div className="bg-base text-black">
        <div className="mx-auto max-w-4xl px-3 py-2 sm:px-4 sm:py-3 md:px-16 md:py-4">
          <div className="grid grid-flow-col gap-2 sm:gap-[8px] grid-cols-[min-content_1fr_min-content]">
            <IconButton
              iconName="24/Microphone"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              isProcessing={isMicRecording}
              disabled={isChatProcessing}
              onClick={onClickMicButton}
            />
            <input
              type="text"
              placeholder="Enter your message here"
              onChange={onChangeUserMessage}
              disabled={isChatProcessing}
              className="bg-surface1 hover:bg-surface1-hover focus:bg-surface1 disabled:bg-surface1-disabled disabled:text-primary-disabled rounded-12 sm:rounded-16 w-full px-3 sm:px-16 text-text-primary text-sm sm:typography-16 font-bold disabled min-h-[44px] sm:min-h-0"
              value={userMessage}
            ></input>

            <IconButton
              iconName="24/Send"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              isProcessing={isChatProcessing}
              disabled={isChatProcessing || !userMessage}
              onClick={onClickSendButton}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
