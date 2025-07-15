import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Menu } from '@/components/menu';
import { useChatStore } from '@/store/chatStore';
import { useConfigStore } from '@/store/configStore';
import { ViewerContext } from '@/features/vrmViewer/viewerContext';

// Mock the stores
jest.mock('@/store/chatStore');
jest.mock('@/store/configStore');

// Mock the viewer context to avoid Three.js issues
jest.mock('@/features/vrmViewer/viewerContext', () => ({
  ViewerContext: React.createContext({
    viewer: {
      loadVrm: jest.fn(),
    }
  })
}));

// Mock VrmUpload and VrmManager components
jest.mock('@/components/vrmUpload', () => ({
  VrmUpload: ({ onVrmLoad, isLoading, disabled }: any) => (
    <div data-testid="vrm-upload">
      VRM Upload Component
      <button onClick={() => onVrmLoad('test-url')}>Load VRM</button>
    </div>
  ),
}));

jest.mock('@/components/vrmManager', () => ({
  VrmManager: ({ onVrmSelect, onClose }: any) => (
    <div data-testid="vrm-manager">
      VRM Manager Component
      <button onClick={() => onVrmSelect('test-vrm-url')}>Select VRM</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock hooks
jest.mock('@/hooks/useVrmPersistence', () => ({
  useVrmPersistence: () => ({
    loadLastUsedVrm: jest.fn(),
  }),
}));

// Mock ChatLog component
jest.mock('@/components/chatLog', () => ({
  ChatLog: ({ messages }: any) => (
    <div data-testid="chat-log">
      {messages.map((msg: any, i: number) => (
        <div key={i}>{msg.content}</div>
      ))}
    </div>
  ),
}));

// Mock Settings component
jest.mock('@/components/settings', () => ({
  Settings: ({ onClickClose }: any) => (
    <div data-testid="settings">
      Settings Component
      <button onClick={onClickClose}>Close Settings</button>
    </div>
  ),
}));

// Mock AssistantText component
jest.mock('@/components/assistantText', () => ({
  AssistantText: ({ message }: any) => (
    <div data-testid="assistant-text">{message}</div>
  ),
}));

describe('Menu Component with Zustand', () => {
  const mockViewer = {
    loadVrm: jest.fn(),
  };

  const mockChatStore = {
    chatLog: [],
    assistantMessage: '',
    clearChat: jest.fn(),
    updateMessage: jest.fn(),
  };

  const mockConfigStore = {
    openAiKey: 'test-openai-key',
    systemPrompt: 'test system prompt',
    koeiroParam: { speakerX: 0, speakerY: 0 },
    koeiromapKey: 'test-koeiromap-key',
    setOpenAiKey: jest.fn(),
    setSystemPrompt: jest.fn(),
    setKoeiroParam: jest.fn(),
    setKoeiromapKey: jest.fn(),
    resetToDefaults: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useChatStore as unknown as jest.Mock).mockReturnValue(mockChatStore);
    (useConfigStore as unknown as jest.Mock).mockReturnValue(mockConfigStore);
  });

  const renderMenu = () => {
    return render(
      <ViewerContext.Provider value={{ viewer: mockViewer as any }}>
        <Menu />
      </ViewerContext.Provider>
    );
  };

  test('renders menu buttons correctly', () => {
    renderMenu();
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('VRM Upload')).toBeInTheDocument();
    expect(screen.getByText('VRM Manager')).toBeInTheDocument();
    expect(screen.getByText('Last VRM')).toBeInTheDocument();
    expect(screen.getByText('Chat Log')).toBeInTheDocument();
  });

  test('opens and closes settings modal', () => {
    renderMenu();
    
    // Settings should not be visible initially
    expect(screen.queryByTestId('settings')).not.toBeInTheDocument();
    
    // Click settings button
    fireEvent.click(screen.getByText('Settings'));
    
    // Settings should now be visible
    expect(screen.getByTestId('settings')).toBeInTheDocument();
    
    // Click close button
    fireEvent.click(screen.getByText('Close Settings'));
    
    // Settings should be hidden again
    expect(screen.queryByTestId('settings')).not.toBeInTheDocument();
  });

  test('opens and closes VRM upload modal', () => {
    renderMenu();
    
    // VRM Upload should not be visible initially
    expect(screen.queryByTestId('vrm-upload')).not.toBeInTheDocument();
    
    // Click VRM Upload button
    fireEvent.click(screen.getByText('VRM Upload'));
    
    // VRM Upload should now be visible
    expect(screen.getByTestId('vrm-upload')).toBeInTheDocument();
    
    // Click close button
    fireEvent.click(screen.getByText('✕'));
    
    // VRM Upload should be hidden again
    expect(screen.queryByTestId('vrm-upload')).not.toBeInTheDocument();
  });

  test('handles VRM loading', async () => {
    renderMenu();
    
    // Open VRM Upload
    fireEvent.click(screen.getByText('VRM Upload'));
    
    // Click load VRM button
    fireEvent.click(screen.getByText('Load VRM'));
    
    // Viewer should have been called
    await waitFor(() => {
      expect(mockViewer.loadVrm).toHaveBeenCalledWith('test-url');
    });
  });

  test('shows chat log when messages exist', () => {
    const messagesStore = {
      ...mockChatStore,
      chatLog: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ],
    };
    (useChatStore as unknown as jest.Mock).mockReturnValue(messagesStore);
    
    renderMenu();
    
    // Chat log button should be enabled
    const chatLogButton = screen.getByText('Chat Log');
    expect(chatLogButton).not.toBeDisabled();
    
    // Click to show chat log
    fireEvent.click(chatLogButton);
    
    // Chat log should be visible
    expect(screen.getByTestId('chat-log')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  test('shows assistant message when not showing chat log', () => {
    const messageStore = {
      ...mockChatStore,
      assistantMessage: 'I am thinking...',
    };
    (useChatStore as unknown as jest.Mock).mockReturnValue(messageStore);
    
    renderMenu();
    
    // Assistant message should be visible
    expect(screen.getByTestId('assistant-text')).toBeInTheDocument();
    expect(screen.getByText('I am thinking...')).toBeInTheDocument();
  });

  test('chat log button is disabled when no messages', () => {
    renderMenu();
    
    const chatLogButton = screen.getByText('Chat Log').closest('button');
    expect(chatLogButton).toBeDisabled();
  });

  test('opens VRM manager and handles selection', async () => {
    renderMenu();
    
    // Click VRM Manager button
    fireEvent.click(screen.getByText('VRM Manager'));
    
    // VRM Manager should be visible
    expect(screen.getByTestId('vrm-manager')).toBeInTheDocument();
    
    // Select a VRM
    fireEvent.click(screen.getByText('Select VRM'));
    
    // Viewer should have been called
    await waitFor(() => {
      expect(mockViewer.loadVrm).toHaveBeenCalledWith('test-vrm-url');
    });
  });
});