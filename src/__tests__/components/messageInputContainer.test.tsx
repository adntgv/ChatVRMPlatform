import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInputContainer } from '@/components/messageInputContainer';
import { useChatStore } from '@/store/chatStore';
import { useConfigStore } from '@/store/configStore';

// Mock the stores
jest.mock('@/store/chatStore');
jest.mock('@/store/configStore');

// Mock MessageInput component
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
        {isMicRecording ? 'Recording...' : 'Start Recording'}
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
const mockSpeechRecognition = {
  start: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  lang: '',
  interimResults: false,
  continuous: false,
};

// Add SpeechRecognition to window
(global as any).SpeechRecognition = jest.fn(() => mockSpeechRecognition);
(global as any).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);

describe('MessageInputContainer with Zustand', () => {
  const mockChatStore = {
    chatProcessing: false,
    handleSendChat: jest.fn(),
  };

  const mockConfigStore = {
    openAiKey: 'test-api-key',
    systemPrompt: 'test system prompt',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useChatStore as unknown as jest.Mock).mockReturnValue(mockChatStore);
    (useConfigStore as unknown as jest.Mock).mockReturnValue(mockConfigStore);
  });

  test('renders message input components', () => {
    render(<MessageInputContainer />);
    
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
    expect(screen.getByTestId('text-input')).toBeInTheDocument();
    expect(screen.getByTestId('mic-button')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  test('handles text input and send', async () => {
    const user = userEvent.setup();
    render(<MessageInputContainer />);
    
    const textInput = screen.getByTestId('text-input');
    const sendButton = screen.getByTestId('send-button');
    
    // Type a message
    await user.type(textInput, 'Hello, AI!');
    expect(textInput).toHaveValue('Hello, AI!');
    
    // Click send
    await user.click(sendButton);
    
    // Verify handleSendChat was called
    expect(mockChatStore.handleSendChat).toHaveBeenCalledWith(
      'Hello, AI!',
      'test-api-key',
      'test system prompt'
    );
  });

  test('disables input during chat processing', () => {
    const processingStore = {
      ...mockChatStore,
      chatProcessing: true,
    };
    (useChatStore as unknown as jest.Mock).mockReturnValue(processingStore);
    
    render(<MessageInputContainer />);
    
    expect(screen.getByTestId('text-input')).toBeDisabled();
    expect(screen.getByTestId('mic-button')).toBeDisabled();
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  test('clears message when chat processing completes', async () => {
    const user = userEvent.setup();
    
    const { rerender } = render(<MessageInputContainer />);
    
    // Type a message
    const textInput = screen.getByTestId('text-input');
    await user.type(textInput, 'Test message');
    expect(textInput).toHaveValue('Test message');
    
    // Simulate chat processing starting
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      ...mockChatStore,
      chatProcessing: true,
    });
    
    rerender(<MessageInputContainer />);
    
    // Simulate processing complete
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      ...mockChatStore,
      chatProcessing: false,
    });
    
    rerender(<MessageInputContainer />);
    
    // Message should be cleared when processing completes
    await waitFor(() => {
      expect(textInput).toHaveValue('');
    });
  });

  test('handles speech recognition', async () => {
    render(<MessageInputContainer />);
    
    const micButton = screen.getByTestId('mic-button');
    
    // Start recording
    fireEvent.click(micButton);
    expect(mockSpeechRecognition.start).toHaveBeenCalled();
    expect(screen.getByText('Recording...')).toBeInTheDocument();
    
    // Simulate speech recognition result
    const resultEvent = new Event('result') as any;
    resultEvent.results = [
      [{
        transcript: 'Hello from voice',
        confidence: 0.9
      }],
    ];
    resultEvent.results[0].isFinal = true;
    
    const resultHandler = mockSpeechRecognition.addEventListener.mock.calls.find(
      call => call[0] === 'result'
    )?.[1];
    
    act(() => {
      resultHandler?.(resultEvent);
    });
    
    // Verify the text was set and sent
    await waitFor(() => {
      expect(mockChatStore.handleSendChat).toHaveBeenCalledWith(
        'Hello from voice',
        'test-api-key',
        'test system prompt'
      );
    });
  });

  test('handles speech recognition end', () => {
    render(<MessageInputContainer />);
    
    // Start recording
    fireEvent.click(screen.getByTestId('mic-button'));
    expect(screen.getByText('Recording...')).toBeInTheDocument();
    
    // Simulate recognition end
    const endHandler = mockSpeechRecognition.addEventListener.mock.calls.find(
      call => call[0] === 'end'
    )?.[1];
    
    act(() => {
      endHandler?.();
    });
    
    // Should stop recording
    expect(screen.getByText('Start Recording')).toBeInTheDocument();
  });

  test('aborts recording when clicked while recording', () => {
    render(<MessageInputContainer />);
    
    const micButton = screen.getByTestId('mic-button');
    
    // Start recording
    fireEvent.click(micButton);
    expect(mockSpeechRecognition.start).toHaveBeenCalled();
    
    // Click again to stop
    fireEvent.click(micButton);
    expect(mockSpeechRecognition.abort).toHaveBeenCalled();
    expect(screen.getByText('Start Recording')).toBeInTheDocument();
  });

  test('handles environment without speech recognition', () => {
    // Remove speech recognition
    const originalSpeechRecognition = (global as any).SpeechRecognition;
    const originalWebkitSpeechRecognition = (global as any).webkitSpeechRecognition;
    
    delete (global as any).SpeechRecognition;
    delete (global as any).webkitSpeechRecognition;
    
    render(<MessageInputContainer />);
    
    // Should still render without errors
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
    
    // Restore
    (global as any).SpeechRecognition = originalSpeechRecognition;
    (global as any).webkitSpeechRecognition = originalWebkitSpeechRecognition;
  });

  test('send button is disabled when message is empty', () => {
    render(<MessageInputContainer />);
    
    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDisabled();
  });

  test('send button is enabled when message has content', async () => {
    const user = userEvent.setup();
    render(<MessageInputContainer />);
    
    const textInput = screen.getByTestId('text-input');
    const sendButton = screen.getByTestId('send-button');
    
    await user.type(textInput, 'Test');
    expect(sendButton).not.toBeDisabled();
  });
});