/**
 * useChat Hook Tests
 *
 * TDD tests for the WebSocket connection and chat state management hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useChat } from './useChat';
import { useChatStore } from '@/stores/chatStore';
import { MockWebSocket } from '@/test/setup';

describe('useChat', () => {
  beforeEach(() => {
    // Reset WebSocket mock
    MockWebSocket.reset();

    // Reset chat store
    act(() => {
      useChatStore.getState().clearMessages();
      useChatStore.getState().setConnectionStatus('disconnected');
    });
  });

  afterEach(() => {
    // Note: Don't use vi.clearAllTimers() here as it interferes with
    // the 100ms connection delay timer in useChat when using real timers
    vi.useRealTimers();
  });

  describe('connection lifecycle', () => {
    it('connects to WebSocket on mount when autoConnect is true', async () => {
      renderHook(() => useChat({ sessionId: 'test-session' }));

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });
    });

    it('does not connect when autoConnect is false', () => {
      renderHook(() =>
        useChat({ sessionId: 'test-session', autoConnect: false })
      );

      expect(MockWebSocket.instances.length).toBe(0);
    });

    it('connects to correct WebSocket URL', async () => {
      renderHook(() => useChat({ sessionId: 'test-session' }));

      await waitFor(() => {
        const ws = MockWebSocket.getLastInstance();
        expect(ws?.url).toContain('/ws');
      });
    });

    it('sets connection status to connected on successful connection', async () => {
      renderHook(() => useChat({ sessionId: 'test-session' }));

      await waitFor(() => {
        expect(useChatStore.getState().connectionStatus).toBe('connected');
      });
    });

    it('cleans up WebSocket on unmount', async () => {
      const { unmount } = renderHook(() =>
        useChat({ sessionId: 'test-session' })
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.getLastInstance()!;
      const closeSpy = ws.close;

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('manual connection control', () => {
    it('provides connect function', async () => {
      const { result } = renderHook(() =>
        useChat({ sessionId: 'test-session', autoConnect: false })
      );

      expect(MockWebSocket.instances.length).toBe(0);

      act(() => {
        result.current.connect();
      });

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });
    });

    it('provides disconnect function', async () => {
      const { result } = renderHook(() =>
        useChat({ sessionId: 'test-session' })
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.getLastInstance()!;

      act(() => {
        result.current.disconnect();
      });

      expect(ws.close).toHaveBeenCalled();
    });
  });

  describe('sending messages', () => {
    it('adds user message to store when sending', async () => {
      const { result } = renderHook(() =>
        useChat({ sessionId: 'test-session' })
      );

      await waitFor(() => {
        expect(useChatStore.getState().connectionStatus).toBe('connected');
      });

      act(() => {
        result.current.sendMessage('Hello world');
      });

      const messages = useChatStore.getState().messages;
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe('Hello world');
      expect(messages[0].role).toBe('user');
    });

    it('sends message via WebSocket', async () => {
      const { result } = renderHook(() =>
        useChat({ sessionId: 'test-session' })
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.getLastInstance()!;

      act(() => {
        result.current.sendMessage('Hello world');
      });

      expect(ws.send).toHaveBeenCalledWith(
        expect.stringContaining('chat:user_message')
      );
      expect(ws.send).toHaveBeenCalledWith(
        expect.stringContaining('Hello world')
      );
    });

    it('includes currentDials in sent message', async () => {
      const { result } = renderHook(() =>
        useChat({ sessionId: 'my-session-123' })
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.getLastInstance()!;

      act(() => {
        result.current.sendMessage('Hello');
      });

      // Message should include currentDials in payload
      expect(ws.send).toHaveBeenCalledWith(
        expect.stringContaining('currentDials')
      );
    });

    it('does not send empty messages', async () => {
      const { result } = renderHook(() =>
        useChat({ sessionId: 'test-session' })
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.getLastInstance()!;

      act(() => {
        result.current.sendMessage('   ');
      });

      expect(ws.send).not.toHaveBeenCalled();
    });
  });

  describe('receiving messages', () => {
    it('handles chat:assistant_start message', async () => {
      renderHook(() => useChat({ sessionId: 'test-session' }));

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.getLastInstance()!;

      act(() => {
        ws.simulateMessage({ type: 'chat:assistant_start', payload: { messageId: 'msg-123' } });
      });

      expect(useChatStore.getState().isStreaming).toBe(true);
    });

    it('handles chat:assistant_chunk message', async () => {
      renderHook(() => useChat({ sessionId: 'test-session' }));

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.getLastInstance()!;

      // Start streaming first
      act(() => {
        ws.simulateMessage({ type: 'chat:assistant_start', payload: { messageId: 'msg-123' } });
      });

      // Then send chunk
      act(() => {
        ws.simulateMessage({ type: 'chat:assistant_chunk', payload: { messageId: 'msg-123', chunk: 'Hello ' } });
      });

      const messages = useChatStore.getState().messages;
      const streamingMessage = messages[messages.length - 1];
      expect(streamingMessage.content).toContain('Hello');
    });

    it('handles chat:assistant_complete message', async () => {
      renderHook(() => useChat({ sessionId: 'test-session' }));

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.getLastInstance()!;

      // Start streaming
      act(() => {
        ws.simulateMessage({ type: 'chat:assistant_start', payload: { messageId: 'msg-123' } });
      });

      // End streaming
      act(() => {
        ws.simulateMessage({ type: 'chat:assistant_complete', payload: { messageId: 'msg-123' } });
      });

      expect(useChatStore.getState().isStreaming).toBe(false);
    });

    it('handles connected message', async () => {
      renderHook(() => useChat({ sessionId: 'test-session' }));

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const ws = MockWebSocket.getLastInstance()!;

      act(() => {
        ws.simulateMessage({ type: 'connected', payload: { message: 'Welcome' } });
      });

      expect(useChatStore.getState().connectionStatus).toBe('connected');
    });
  });

  describe('initial connection delay', () => {
    it('delays initial connection when autoConnect is true to avoid race condition', async () => {
      vi.useFakeTimers();

      renderHook(() => useChat({ sessionId: 'test-session' }));

      // Immediately after mount, no WebSocket should be created
      expect(MockWebSocket.instances.length).toBe(0);

      // After 100ms delay, WebSocket should be created
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(MockWebSocket.instances.length).toBe(1);

      vi.useRealTimers();
    });

    it('does not log error on first connection attempt (before any successful connection)', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.useFakeTimers();

      renderHook(() => useChat({ sessionId: 'test-session' }));

      // Advance past the initial delay to create WebSocket
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      const ws = MockWebSocket.getLastInstance()!;

      // Simulate an error BEFORE onopen fires (hasConnectedOnce = false)
      // Don't advance timers so onopen doesn't fire
      act(() => {
        ws.simulateError();
      });

      // No error should be logged before first successful connection
      expect(consoleErrorSpy).not.toHaveBeenCalledWith('[useChat] WebSocket error');

      consoleErrorSpy.mockRestore();
      vi.useRealTimers();
    });

    it('logs error after first successful connection (hasConnectedOnce = true)', async () => {
      // This test verifies that errors ARE logged after we've successfully connected once
      // The key insight: hasConnectedOnceRef is set to true in onopen handler
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() =>
        useChat({
          sessionId: 'test-session',
          reconnectInterval: 50, // Short interval for faster test
        })
      );

      // Wait for initial connection (first WebSocket) to fully establish
      // This means onopen has fired and hasConnectedOnce is true
      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
        expect(useChatStore.getState().connectionStatus).toBe('connected');
      }, { timeout: 2000 });

      const firstWs = MockWebSocket.instances[0]!;
      expect(firstWs).toBeDefined();

      // Simulate connection close to trigger reconnection
      act(() => {
        firstWs.simulateClose(1006, 'Connection lost');
      });

      // Wait for second WebSocket to be created (reconnection)
      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(2);
      }, { timeout: 3000 });

      // Get the second WebSocket (created during reconnection)
      const secondWs = MockWebSocket.instances[1]!;
      expect(secondWs).toBeDefined();
      expect(secondWs.onerror).toBeDefined();
      expect(secondWs).not.toBe(firstWs);

      // Simulate an error on the reconnection WebSocket
      // At this point, hasConnectedOnceRef.current should be true
      act(() => {
        secondWs.simulateError();
      });

      // Error should be logged because we've successfully connected once before
      expect(consoleErrorSpy).toHaveBeenCalledWith('[useChat] WebSocket error');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('reconnection', () => {
    it('sets status to reconnecting on disconnect', async () => {
      renderHook(() => useChat({ sessionId: 'test-session' }));

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      }, { timeout: 2000 });

      const ws = MockWebSocket.getLastInstance()!;

      act(() => {
        ws.simulateClose(1006, 'Connection lost');
      });

      expect(useChatStore.getState().connectionStatus).toBe('reconnecting');
    });

    it('schedules reconnection after abnormal disconnect', async () => {
      // Test that status changes to reconnecting (which indicates reconnect is scheduled)
      renderHook(() =>
        useChat({
          sessionId: 'test-session',
          reconnectInterval: 1000,
        })
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      }, { timeout: 2000 });

      const ws = MockWebSocket.getLastInstance()!;

      act(() => {
        ws.simulateClose(1006, 'Connection lost');
      });

      // Status should be reconnecting
      expect(useChatStore.getState().connectionStatus).toBe('reconnecting');
    });

    it('does not reconnect on intentional close', async () => {
      const { result } = renderHook(() =>
        useChat({
          sessionId: 'test-session',
          reconnectInterval: 100,
        })
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      }, { timeout: 2000 });

      const instancesBeforeDisconnect = MockWebSocket.instances.length;

      // Intentionally disconnect
      act(() => {
        result.current.disconnect();
      });

      // Status should be disconnected (not reconnecting)
      expect(useChatStore.getState().connectionStatus).toBe('disconnected');

      // No new instances should be created
      expect(MockWebSocket.instances.length).toBe(instancesBeforeDisconnect);
    });

    it('does not reconnect on normal close code 1000', async () => {
      renderHook(() =>
        useChat({
          sessionId: 'test-session',
          reconnectInterval: 100,
        })
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      }, { timeout: 2000 });

      const ws = MockWebSocket.getLastInstance()!;

      act(() => {
        ws.simulateClose(1000, 'Normal closure');
      });

      // Status should be disconnected (not reconnecting)
      expect(useChatStore.getState().connectionStatus).toBe('disconnected');
    });
  });

  describe('state exposure', () => {
    it('exposes messages from store', async () => {
      // Add a message to store first
      act(() => {
        useChatStore.getState().addMessage({
          role: 'user',
          content: 'Existing message',
        });
      });

      const { result } = renderHook(() =>
        useChat({ sessionId: 'test-session' })
      );

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].content).toBe('Existing message');
    });

    it('exposes isStreaming from store', async () => {
      const { result } = renderHook(() =>
        useChat({ sessionId: 'test-session' })
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      }, { timeout: 2000 });

      expect(result.current.isStreaming).toBe(false);

      const ws = MockWebSocket.getLastInstance()!;

      act(() => {
        ws.simulateMessage({ type: 'chat:assistant_start', payload: { messageId: 'msg-123' } });
      });

      expect(result.current.isStreaming).toBe(true);
    });

    it('exposes connectionStatus from store', async () => {
      const { result } = renderHook(() =>
        useChat({ sessionId: 'test-session' })
      );

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      }, { timeout: 2000 });
    });
  });
});
