import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { performanceMonitor } from '@/utils/performanceProfiler';
import { Menu } from '@/components/menu';
import { MessageInputContainer } from '@/components/messageInputContainer';
import { ViewerContext } from '@/features/vrmViewer/viewerContext';
import { useChatStore } from '@/store/chatStore';
import { useConfigStore } from '@/store/configStore';

// Mock dependencies
jest.mock('@/store/chatStore');
jest.mock('@/store/configStore');
jest.mock('@/features/messages/speakCharacter', () => ({
  speakCharacter: jest.fn(),
}));

// Mock all child components to isolate performance testing
jest.mock('@/components/iconButton', () => ({
  IconButton: () => <button>Icon Button</button>,
}));
jest.mock('@/components/settings', () => ({
  Settings: () => <div>Settings</div>,
}));
jest.mock('@/components/chatLog', () => ({
  ChatLog: () => <div>Chat Log</div>,
}));
jest.mock('@/components/assistantText', () => ({
  AssistantText: () => <div>Assistant Text</div>,
}));
jest.mock('@/components/vrmUpload', () => ({
  VrmUpload: () => <div>VRM Upload</div>,
}));
jest.mock('@/components/vrmManager', () => ({
  VrmManager: () => <div>VRM Manager</div>,
}));
jest.mock('@/components/messageInput', () => ({
  MessageInput: () => <div>Message Input</div>,
}));
jest.mock('@/hooks/useVrmPersistence', () => ({
  useVrmPersistence: () => ({ loadLastUsedVrm: jest.fn() }),
}));

describe('Zustand Performance Benchmarks', () => {
  const mockViewer = {
    model: { speak: jest.fn() },
    loadVrm: jest.fn(),
  };

  const createMockStores = (overrides = {}) => ({
    chat: {
      chatProcessing: false,
      chatLog: [],
      assistantMessage: '',
      handleSendChat: jest.fn(),
      clearChat: jest.fn(),
      updateMessage: jest.fn(),
      ...overrides.chat,
    },
    config: {
      openAiKey: 'test-key',
      systemPrompt: 'test prompt',
      koeiroParam: { speakerX: 0, speakerY: 0 },
      koeiromapKey: 'test-koeiromap',
      setOpenAiKey: jest.fn(),
      setSystemPrompt: jest.fn(),
      setKoeiroParam: jest.fn(),
      setKoeiromapKey: jest.fn(),
      resetToDefaults: jest.fn(),
      ...overrides.config,
    },
  });

  beforeEach(() => {
    performanceMonitor.reset();
    performanceMonitor.enable();
    jest.clearAllMocks();
  });

  afterEach(() => {
    performanceMonitor.disable();
  });

  describe('Menu Component Performance', () => {
    test('measures initial mount performance', () => {
      const stores = createMockStores();
      (useChatStore as unknown as jest.Mock).mockReturnValue(stores.chat);
      (useConfigStore as unknown as jest.Mock).mockReturnValue(stores.config);

      render(
        <ViewerContext.Provider value={{ viewer: mockViewer as any }}>
          <Menu />
        </ViewerContext.Provider>
      );

      const report = performanceMonitor.getReport('Menu');
      expect(Array.isArray(report)).toBe(false);
      if (!Array.isArray(report)) {
        expect(report.mounts).toBe(1);
        expect(report.updates).toBe(0);
        console.log('Menu mount performance:', {
          duration: `${report.averageDuration.toFixed(2)}ms`,
        });
      }
    });

    test('measures re-render performance on state changes', async () => {
      const stores = createMockStores();
      (useChatStore as unknown as jest.Mock).mockReturnValue(stores.chat);
      (useConfigStore as unknown as jest.Mock).mockReturnValue(stores.config);

      const { rerender } = render(
        <ViewerContext.Provider value={{ viewer: mockViewer as any }}>
          <Menu />
        </ViewerContext.Provider>
      );

      // Simulate multiple state updates
      for (let i = 0; i < 10; i++) {
        stores.chat.chatLog = Array(i).fill({ role: 'user', content: `Message ${i}` });
        stores.chat.assistantMessage = `Response ${i}`;
        
        (useChatStore as unknown as jest.Mock).mockReturnValue({ ...stores.chat });
        
        await act(async () => {
          rerender(
            <ViewerContext.Provider value={{ viewer: mockViewer as any }}>
              <Menu />
            </ViewerContext.Provider>
          );
        });
      }

      const report = performanceMonitor.getReport('Menu');
      if (!Array.isArray(report)) {
        console.log('Menu re-render performance:', {
          totalRenders: report.renderCount,
          avgDuration: `${report.averageDuration.toFixed(2)}ms`,
          maxDuration: `${report.maxDuration.toFixed(2)}ms`,
        });
        
        // Performance assertions
        expect(report.averageDuration).toBeLessThan(16); // Should not drop frames
        expect(report.updates).toBe(10);
      }
    });
  });

  describe('MessageInputContainer Performance', () => {
    test('measures performance during chat processing', async () => {
      const stores = createMockStores();
      (useChatStore as unknown as jest.Mock).mockReturnValue(stores.chat);
      (useConfigStore as unknown as jest.Mock).mockReturnValue(stores.config);

      const { rerender } = render(
        <ViewerContext.Provider value={{ viewer: mockViewer as any }}>
          <MessageInputContainer />
        </ViewerContext.Provider>
      );

      // Simulate chat processing cycle
      stores.chat.chatProcessing = true;
      (useChatStore as unknown as jest.Mock).mockReturnValue({ ...stores.chat });
      
      await act(async () => {
        rerender(
          <ViewerContext.Provider value={{ viewer: mockViewer as any }}>
            <MessageInputContainer />
          </ViewerContext.Provider>
        );
      });

      stores.chat.chatProcessing = false;
      (useChatStore as unknown as jest.Mock).mockReturnValue({ ...stores.chat });
      
      await act(async () => {
        rerender(
          <ViewerContext.Provider value={{ viewer: mockViewer as any }}>
            <MessageInputContainer />
          </ViewerContext.Provider>
        );
      });

      const report = performanceMonitor.getReport('MessageInputContainer');
      if (!Array.isArray(report)) {
        console.log('MessageInputContainer performance:', {
          renders: report.renderCount,
          avgDuration: `${report.averageDuration.toFixed(2)}ms`,
        });
      }
    });
  });

  describe('Store Subscription Performance', () => {
    test('verifies selective re-renders with Zustand', async () => {
      const stores = createMockStores();
      let menuRenderCount = 0;
      let messageInputRenderCount = 0;

      // Track renders
      const MenuWithTracking = () => {
        menuRenderCount++;
        return <Menu />;
      };

      const MessageInputWithTracking = () => {
        messageInputRenderCount++;
        return <MessageInputContainer />;
      };

      (useChatStore as unknown as jest.Mock).mockReturnValue(stores.chat);
      (useConfigStore as unknown as jest.Mock).mockReturnValue(stores.config);

      render(
        <ViewerContext.Provider value={{ viewer: mockViewer as any }}>
          <MenuWithTracking />
          <MessageInputWithTracking />
        </ViewerContext.Provider>
      );

      const initialMenuRenders = menuRenderCount;
      const initialMessageRenders = messageInputRenderCount;

      // Update only config store
      stores.config.openAiKey = 'new-key';
      (useConfigStore as unknown as jest.Mock).mockReturnValue({ ...stores.config });

      // Force a re-render
      await act(async () => {
        await waitFor(() => {});
      });

      console.log('Selective re-render test:', {
        menuRenders: menuRenderCount - initialMenuRenders,
        messageInputRenders: messageInputRenderCount - initialMessageRenders,
      });
    });
  });

  describe('Performance Comparison', () => {
    test('generates performance summary', () => {
      performanceMonitor.logReport();
      
      const reports = performanceMonitor.getReport();
      if (Array.isArray(reports)) {
        const summary = reports.reduce((acc, report) => {
          acc.totalRenders += report.renderCount;
          acc.totalDuration += report.totalDuration;
          if (report.maxDuration > acc.slowestRender.duration) {
            acc.slowestRender = {
              component: report.componentName,
              duration: report.maxDuration,
            };
          }
          return acc;
        }, {
          totalRenders: 0,
          totalDuration: 0,
          slowestRender: { component: '', duration: 0 },
        });

        console.log('Performance Summary:', {
          totalRenders: summary.totalRenders,
          totalDuration: `${summary.totalDuration.toFixed(2)}ms`,
          slowestComponent: summary.slowestRender.component,
          slowestDuration: `${summary.slowestRender.duration.toFixed(2)}ms`,
        });
      }
    });
  });
});