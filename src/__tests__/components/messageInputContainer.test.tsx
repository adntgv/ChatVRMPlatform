import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInputContainer } from '@/components/messageInputContainer';

// Mock the MessageInput component
jest.mock('@/components/messageInput', () => ({
  MessageInput: ({ 
    userMessage, 
    isChatProcessing, 
    isMicRecording, 
    onChangeUserMessage, 
    onClickMicButton, 
    onClickSendButton 
  }: any) => (
    <div data-testid="message-input">
      <input
        data-testid="text-input"
        value={userMessage}
        onChange={onChangeUserMessage}
        disabled={isChatProcessing}
      />
      <button
        data-testid="mic-button"
        onClick={onClickMicButton}
        disabled={isChatProcessing}
      >
        {isMicRecording ? 'Stop' : 'Record'}
      </button>
      <button
        data-testid="send-button"
        onClick={onClickSendButton}
        disabled={isChatProcessing || !userMessage}
      >
        Send
      </button>
    </div>
  ),
}));

// Mock SpeechRecognition
class MockSpeechRecognition {
  lang: string = '';
  interimResults: boolean = false;
  continuous: boolean = false;
  private eventListeners: { [key: string]: Function[] } = {};

  addEventListener(event: string, handler: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(handler);
  }

  removeEventListener(event: string, handler: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(h => h !== handler);
    }
  }

  start() {
    // Simulate starting recognition
  }

  abort() {
    // Simulate aborting recognition
    this.dispatchEvent('end');
  }

  dispatchEvent(eventName: string, data?: any) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach(handler => handler(data));
    }
  }
}

describe('MessageInputContainer', () => {
  let mockOnChatProcessStart: jest.Mock;
  let mockSpeechRecognition: MockSpeechRecognition;

  beforeEach(() => {
    mockOnChatProcessStart = jest.fn();
    mockSpeechRecognition = new MockSpeechRecognition();
    
    // Mock global SpeechRecognition
    (global as any).SpeechRecognition = jest.fn(() => mockSpeechRecognition);
    (global as any).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render with initial state', () => {
    render(
      <MessageInputContainer
        isChatProcessing={false}
        onChatProcessStart={mockOnChatProcessStart}
      />
    );

    expect(screen.getByTestId('text-input')).toHaveValue('');
    expect(screen.getByTestId('mic-button')).toHaveTextContent('Record');
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('should update text input when user types', async () => {
    const user = userEvent.setup();
    render(
      <MessageInputContainer
        isChatProcessing={false}
        onChatProcessStart={mockOnChatProcessStart}
      />
    );

    const input = screen.getByTestId('text-input');
    await user.type(input, 'Hello world');

    expect(input).toHaveValue('Hello world');
    expect(screen.getByTestId('send-button')).not.toBeDisabled();
  });

  it('should call onChatProcessStart when send button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MessageInputContainer
        isChatProcessing={false}
        onChatProcessStart={mockOnChatProcessStart}
      />
    );

    const input = screen.getByTestId('text-input');
    await user.type(input, 'Test message');
    
    const sendButton = screen.getByTestId('send-button');
    await user.click(sendButton);

    expect(mockOnChatProcessStart).toHaveBeenCalledWith('Test message');
  });

  it('should disable inputs when chat is processing', () => {
    render(
      <MessageInputContainer
        isChatProcessing={true}
        onChatProcessStart={mockOnChatProcessStart}
      />
    );

    expect(screen.getByTestId('text-input')).toBeDisabled();
    expect(screen.getByTestId('mic-button')).toBeDisabled();
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('should clear input when chat processing completes', () => {
    const { rerender } = render(
      <MessageInputContainer
        isChatProcessing={true}
        onChatProcessStart={mockOnChatProcessStart}
      />
    );

    // Set some text while processing
    const input = screen.getByTestId('text-input');
    fireEvent.change(input, { target: { value: 'Some text' } });

    // Complete processing
    rerender(
      <MessageInputContainer
        isChatProcessing={false}
        onChatProcessStart={mockOnChatProcessStart}
      />
    );

    expect(input).toHaveValue('');
  });

  describe('Speech Recognition', () => {
    it('should start recording when mic button is clicked', async () => {
      const user = userEvent.setup();
      const startSpy = jest.spyOn(mockSpeechRecognition, 'start');
      
      render(
        <MessageInputContainer
          isChatProcessing={false}
          onChatProcessStart={mockOnChatProcessStart}
        />
      );

      const micButton = screen.getByTestId('mic-button');
      await user.click(micButton);

      expect(startSpy).toHaveBeenCalled();
      expect(micButton).toHaveTextContent('Stop');
    });

    it('should abort recording when mic button is clicked while recording', async () => {
      const user = userEvent.setup();
      const abortSpy = jest.spyOn(mockSpeechRecognition, 'abort');
      
      render(
        <MessageInputContainer
          isChatProcessing={false}
          onChatProcessStart={mockOnChatProcessStart}
        />
      );

      const micButton = screen.getByTestId('mic-button');
      
      // Start recording
      await user.click(micButton);
      expect(micButton).toHaveTextContent('Stop');
      
      // Stop recording
      await user.click(micButton);
      expect(abortSpy).toHaveBeenCalled();
    });

    it('should update text and auto-submit on final recognition result', async () => {
      render(
        <MessageInputContainer
          isChatProcessing={false}
          onChatProcessStart={mockOnChatProcessStart}
        />
      );

      // Wait for speech recognition to be set up
      await waitFor(() => {
        expect(mockSpeechRecognition.lang).toBe('ja-JP');
      });

      // Simulate final recognition result
      const mockEvent = {
        results: [
          [{
            transcript: 'こんにちは',
          }],
        ],
      };
      mockEvent.results[0].isFinal = true;

      await act(async () => {
        mockSpeechRecognition.dispatchEvent('result', mockEvent);
      });

      expect(screen.getByTestId('text-input')).toHaveValue('こんにちは');
      expect(mockOnChatProcessStart).toHaveBeenCalledWith('こんにちは');
    });

    it('should update text on interim recognition result', async () => {
      render(
        <MessageInputContainer
          isChatProcessing={false}
          onChatProcessStart={mockOnChatProcessStart}
        />
      );

      // Wait for speech recognition to be set up
      await waitFor(() => {
        expect(mockSpeechRecognition.lang).toBe('ja-JP');
      });

      // Simulate interim recognition result
      const mockEvent = {
        results: [
          [{
            transcript: 'こんに',
          }],
        ],
      };
      mockEvent.results[0].isFinal = false;

      await act(async () => {
        mockSpeechRecognition.dispatchEvent('result', mockEvent);
      });

      expect(screen.getByTestId('text-input')).toHaveValue('こんに');
      expect(mockOnChatProcessStart).not.toHaveBeenCalled();
    });

    it('should stop recording on recognition end', async () => {
      const user = userEvent.setup();
      
      render(
        <MessageInputContainer
          isChatProcessing={false}
          onChatProcessStart={mockOnChatProcessStart}
        />
      );

      const micButton = screen.getByTestId('mic-button');
      
      // Start recording
      await user.click(micButton);
      expect(micButton).toHaveTextContent('Stop');

      // Simulate recognition end
      await act(async () => {
        mockSpeechRecognition.dispatchEvent('end');
      });

      await waitFor(() => {
        expect(micButton).toHaveTextContent('Record');
      });
    });

    it('should handle browsers without SpeechRecognition support', () => {
      // Remove SpeechRecognition from window
      delete (global as any).SpeechRecognition;
      delete (global as any).webkitSpeechRecognition;

      render(
        <MessageInputContainer
          isChatProcessing={false}
          onChatProcessStart={mockOnChatProcessStart}
        />
      );

      // Component should still render without errors
      expect(screen.getByTestId('text-input')).toBeInTheDocument();
    });
  });
});