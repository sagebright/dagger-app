/**
 * useChat Hook
 *
 * Manages WebSocket connection and chat state for real-time messaging.
 * Integrates with chatStore for message state and streaming.
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  useChatStore,
  type ChatMessage,
  type ConnectionStatus,
} from '@/stores/chatStore';
import { useDialsStore, type DialsState } from '@/stores/dialsStore';
import type { DialId, DialUpdate, InlineWidget } from '@dagger-app/shared-types';

export interface UseChatOptions {
  /** Session ID for this chat session */
  sessionId: string;
  /** Whether to automatically connect on mount (default: true) */
  autoConnect?: boolean;
  /** Maximum reconnection attempts (default: 5) */
  reconnectAttempts?: number;
  /** Base interval between reconnection attempts in ms (default: 3000) */
  reconnectInterval?: number;
}

export interface UseChatReturn {
  /** Current messages from chat store */
  messages: ChatMessage[];
  /** Whether assistant is currently streaming a response */
  isStreaming: boolean;
  /** Current WebSocket connection status */
  connectionStatus: ConnectionStatus;
  /** Send a message to the assistant */
  sendMessage: (content: string) => void;
  /** Manually connect to WebSocket */
  connect: () => void;
  /** Manually disconnect from WebSocket */
  disconnect: () => void;
}

/** Server -> Client message types (matching backend events.ts) */
type ServerMessage =
  | { type: 'connected'; payload: { message: string } }
  | { type: 'chat:assistant_start'; payload: { messageId: string } }
  | { type: 'chat:assistant_chunk'; payload: { messageId: string; chunk: string } }
  | { type: 'chat:assistant_complete'; payload: { messageId: string; dialUpdates?: DialUpdate[]; inlineWidgets?: InlineWidget[] } }
  | { type: 'error'; payload: { code: string; message: string } }
  | { type: 'dial:updated'; payload: { dialId: DialId; value: unknown; source: string } };

/** Dials payload format for WebSocket messages */
type DialsPayload = Omit<DialsState, 'confirmedDials' | 'setDial' | 'confirmDial' | 'unconfirmDial' | 'resetDials' | 'resetDial' | 'addTheme' | 'removeTheme'> & {
  confirmedDials: DialId[];
};

/** Client -> Server message types (matching backend events.ts) */
type ClientMessage =
  | { type: 'chat:user_message'; payload: { content: string; currentDials: DialsPayload } }
  | { type: 'chat:cancel'; payload: Record<string, never> };

/** Get WebSocket URL based on environment */
function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
}

export function useChat({
  sessionId: _sessionId, // Currently unused - dials state provides session context
  autoConnect = true,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
}: UseChatOptions): UseChatReturn {
  void _sessionId; // Suppress unused warning - kept for API compatibility
  // Store state
  const messages = useChatStore((state) => state.messages);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const connectionStatus = useChatStore((state) => state.connectionStatus);
  const addMessage = useChatStore((state) => state.addMessage);
  const startStreaming = useChatStore((state) => state.startStreaming);
  const appendToStreaming = useChatStore((state) => state.appendToStreaming);
  const finalizeStreaming = useChatStore((state) => state.finalizeStreaming);
  const setConnectionStatus = useChatStore((state) => state.setConnectionStatus);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const intentionalCloseRef = useRef(false);
  const connectRef = useRef<() => void>(() => {});

  /** Handle incoming WebSocket message */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            setConnectionStatus('connected');
            break;

          case 'chat:assistant_start':
            startStreaming();
            break;

          case 'chat:assistant_chunk':
            appendToStreaming(data.payload.chunk);
            break;

          case 'chat:assistant_complete':
            finalizeStreaming();
            // TODO: Handle dialUpdates and inlineWidgets if needed
            if (data.payload.dialUpdates) {
              console.log('[useChat] Dial updates:', data.payload.dialUpdates);
            }
            break;

          case 'error':
            console.error('[useChat] Server error:', data.payload.message);
            break;

          case 'dial:updated':
            console.log('[useChat] Dial updated:', data.payload.dialId, data.payload.value);
            break;

          default:
            console.warn('[useChat] Unknown message type:', data);
        }
      } catch (error) {
        console.error('[useChat] Failed to parse message:', error);
      }
    },
    [setConnectionStatus, startStreaming, appendToStreaming, finalizeStreaming]
  );

  /** Calculate reconnect delay with exponential backoff */
  const getReconnectDelay = useCallback(
    (attempt: number) => {
      const exponential = Math.min(
        reconnectInterval * Math.pow(2, attempt),
        30000
      );
      const jitter = Math.random() * 1000;
      return exponential + jitter;
    },
    [reconnectInterval]
  );

  /** Schedule a reconnection attempt */
  const scheduleReconnect = useCallback(() => {
    if (intentionalCloseRef.current) return;
    if (reconnectCountRef.current >= reconnectAttempts) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('reconnecting');
    const delay = getReconnectDelay(reconnectCountRef.current);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectCountRef.current += 1;
      connectRef.current();
    }, delay);
  }, [reconnectAttempts, getReconnectDelay, setConnectionStatus]);

  /** Connect to WebSocket */
  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    intentionalCloseRef.current = false;

    const ws = new WebSocket(getWebSocketUrl());

    ws.onopen = () => {
      setConnectionStatus('connected');
      reconnectCountRef.current = 0;
    };

    ws.onmessage = handleMessage;

    ws.onclose = (event) => {
      if (!intentionalCloseRef.current && event.code !== 1000) {
        scheduleReconnect();
      } else {
        setConnectionStatus('disconnected');
      }
    };

    ws.onerror = () => {
      // Error handling - onclose will be called after this
      console.error('[useChat] WebSocket error');
    };

    wsRef.current = ws;
  }, [handleMessage, scheduleReconnect, setConnectionStatus]);

  // Keep connectRef in sync with connect
  connectRef.current = connect;

  /** Disconnect from WebSocket */
  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, [setConnectionStatus]);

  /** Send a message */
  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      // Add user message to store
      addMessage({ role: 'user', content: trimmed });

      // Get current dials state for the message payload
      const dialsState = useDialsStore.getState();
      const currentDials: DialsPayload = {
        partySize: dialsState.partySize,
        partyTier: dialsState.partyTier,
        sceneCount: dialsState.sceneCount,
        sessionLength: dialsState.sessionLength,
        tone: dialsState.tone,
        pillarBalance: dialsState.pillarBalance,
        npcDensity: dialsState.npcDensity,
        lethality: dialsState.lethality,
        emotionalRegister: dialsState.emotionalRegister,
        themes: dialsState.themes,
        confirmedDials: Array.from(dialsState.confirmedDials),
      };

      // Send via WebSocket with correct event format
      const message: ClientMessage = {
        type: 'chat:user_message',
        payload: {
          content: trimmed,
          currentDials,
        },
      };

      wsRef.current.send(JSON.stringify(message));
    },
    [addMessage]
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      intentionalCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [autoConnect, connect]);

  return {
    messages,
    isStreaming,
    connectionStatus,
    sendMessage,
    connect,
    disconnect,
  };
}
