/**
 * useSageStream — Frontend hook for SSE chat streaming
 *
 * POSTs to /api/chat with the user message and session ID,
 * then parses the SSE event stream and dispatches typed callbacks
 * for each SageEvent type.
 *
 * Features:
 * - Automatic SSE reconnection on dropped connections
 * - Classified error handling (rate limit, timeout, network)
 * - User-friendly error messages with retry support
 * - Configurable timeout for long-running generation requests
 *
 * Usage:
 *   const { sendMessage, isStreaming, error, abort, retry } = useSageStream({
 *     sessionId: 'abc-123',
 *     accessToken: session.access_token,
 *     onChatStart: (data) => { ... },
 *     onChatDelta: (data) => { ... },
 *     onChatEnd: (data) => { ... },
 *     onError: (data) => { ... },
 *   });
 */

import { useCallback, useRef, useState } from 'react';
import type {
  ChatStartEvent,
  ChatDeltaEvent,
  ChatEndEvent,
  ToolStartEvent,
  ToolEndEvent,
  PanelSparkEvent,
  PanelComponentEvent,
  PanelFramesEvent,
  PanelSceneArcsEvent,
  PanelSceneArcEvent,
  PanelNameEvent,
  PanelSectionsEvent,
  PanelSectionEvent,
  PanelWave3InvalidatedEvent,
  PanelBalanceWarningEvent,
  PanelSceneConfirmedEvent,
  PanelEntityNPCsEvent,
  PanelEntityAdversariesEvent,
  PanelEntityItemsEvent,
  PanelEntityPortentsEvent,
  UIReadyEvent,
  SageErrorEvent,
} from '@dagger-app/shared-types';
import {
  classifyError,
  delay,
  calculateReconnectDelay,
  MAX_RECONNECT_ATTEMPTS,
  DEFAULT_REQUEST_TIMEOUT_MS,
} from './stream-error-classifier';
import { parseSSEBuffer, dispatchEvent } from './sse-event-dispatcher';
import type { StreamError } from './stream-error-classifier';

// Re-export types and constants for consumers
export type { StreamErrorCode, StreamError } from './stream-error-classifier';
export {
  MAX_RECONNECT_ATTEMPTS,
  DEFAULT_REQUEST_TIMEOUT_MS,
  EXTENDED_REQUEST_TIMEOUT_MS,
  classifyError,
  isNetworkError,
} from './stream-error-classifier';

// =============================================================================
// Types
// =============================================================================

export interface SageStreamCallbacks {
  onChatStart?: (data: ChatStartEvent['data']) => void;
  onChatDelta?: (data: ChatDeltaEvent['data']) => void;
  onChatEnd?: (data: ChatEndEvent['data']) => void;
  onToolStart?: (data: ToolStartEvent['data']) => void;
  onToolEnd?: (data: ToolEndEvent['data']) => void;
  onPanelSpark?: (data: PanelSparkEvent['data']) => void;
  onPanelComponent?: (data: PanelComponentEvent['data']) => void;
  onPanelFrames?: (data: PanelFramesEvent['data']) => void;
  onPanelSceneArcs?: (data: PanelSceneArcsEvent['data']) => void;
  onPanelSceneArc?: (data: PanelSceneArcEvent['data']) => void;
  onPanelName?: (data: PanelNameEvent['data']) => void;
  onPanelSections?: (data: PanelSectionsEvent['data']) => void;
  onPanelSection?: (data: PanelSectionEvent['data']) => void;
  onPanelWave3Invalidated?: (data: PanelWave3InvalidatedEvent['data']) => void;
  onPanelBalanceWarning?: (data: PanelBalanceWarningEvent['data']) => void;
  onPanelSceneConfirmed?: (data: PanelSceneConfirmedEvent['data']) => void;
  onPanelEntityNPCs?: (data: PanelEntityNPCsEvent['data']) => void;
  onPanelEntityAdversaries?: (data: PanelEntityAdversariesEvent['data']) => void;
  onPanelEntityItems?: (data: PanelEntityItemsEvent['data']) => void;
  onPanelEntityPortents?: (data: PanelEntityPortentsEvent['data']) => void;
  onUIReady?: (data: UIReadyEvent['data']) => void;
  onError?: (data: SageErrorEvent['data']) => void;
}

export interface UseSageStreamOptions extends SageStreamCallbacks {
  sessionId: string;
  accessToken: string;
  /** Request timeout in milliseconds (default: 30000) */
  requestTimeoutMs?: number;
}

export interface UseSageStreamReturn {
  sendMessage: (message: string) => Promise<void>;
  isStreaming: boolean;
  error: StreamError | null;
  abort: () => void;
  retry: () => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

export function useSageStream(
  options: UseSageStreamOptions
): UseSageStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<StreamError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastMessageRef = useRef<string | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  /**
   * Execute a chat request with timeout and error classification.
   */
  const executeRequest = useCallback(
    async (message: string): Promise<void> => {
      const timeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Set up request timeout
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${options.accessToken}`,
          },
          body: JSON.stringify({
            message,
            sessionId: options.sessionId,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          const serverMessage = (body as { error?: string }).error;
          const classified = classifyError(
            new Error(serverMessage ?? `HTTP ${response.status}`),
            response.status
          );
          throw Object.assign(new Error(classified.message), {
            streamError: classified,
          });
        }

        if (!response.body) {
          throw new Error('Response body is null — streaming not supported');
        }

        // Reset reconnect counter on successful connection
        reconnectAttemptsRef.current = 0;

        await readSSEStream(response.body, options, controller.signal);
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [options]
  );

  /**
   * Attempt to reconnect after a stream disconnection.
   *
   * Uses exponential backoff up to MAX_RECONNECT_ATTEMPTS.
   * If all attempts fail, surfaces the error to the user.
   */
  const attemptReconnect = useCallback(
    async (message: string): Promise<boolean> => {
      while (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const attempt = reconnectAttemptsRef.current;
        reconnectAttemptsRef.current += 1;

        const waitMs = calculateReconnectDelay(attempt);
        await delay(waitMs);

        try {
          await executeRequest(message);
          return true;
        } catch {
          // Continue to next attempt
        }
      }

      return false;
    },
    [executeRequest]
  );

  const sendMessage = useCallback(
    async (message: string): Promise<void> => {
      if (isStreaming) return;

      setIsStreaming(true);
      setError(null);
      lastMessageRef.current = message;
      reconnectAttemptsRef.current = 0;

      try {
        await executeRequest(message);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // Check if this was a timeout (AbortError from our timeout)
          const timeoutError = classifyError(err);
          if (timeoutError.code === 'TIMEOUT') {
            setError(timeoutError);
            options.onError?.({
              code: timeoutError.code,
              message: timeoutError.message,
            });
          }
          // Otherwise it was a manual abort — no error to show
          return;
        }

        // Check for stream error metadata attached by executeRequest
        const streamErr = (err as { streamError?: StreamError }).streamError;
        if (streamErr) {
          setError(streamErr);
          options.onError?.({ code: streamErr.code, message: streamErr.message });
          return;
        }

        // Classify the error and decide whether to reconnect
        const classified = classifyError(err);

        if (classified.code === 'NETWORK_ERROR' || classified.code === 'STREAM_DISCONNECTED') {
          const reconnected = await attemptReconnect(message);
          if (reconnected) return;
        }

        setError(classified);
        options.onError?.({ code: classified.code, message: classified.message });
      } finally {
        abortControllerRef.current = null;
        setIsStreaming(false);
      }
    },
    [isStreaming, options, executeRequest, attemptReconnect]
  );

  /**
   * Retry the last failed message.
   *
   * Allows the user to manually retry after a retryable error
   * without re-typing their message.
   */
  const retry = useCallback(async (): Promise<void> => {
    const lastMessage = lastMessageRef.current;
    if (!lastMessage) return;

    reconnectAttemptsRef.current = 0;
    await sendMessage(lastMessage);
  }, [sendMessage]);

  return { sendMessage, isStreaming, error, abort, retry };
}

// =============================================================================
// SSE Stream Reader
// =============================================================================

/**
 * Read an SSE stream from a ReadableStream, parsing events and
 * dispatching callbacks as they arrive.
 */
async function readSSEStream(
  body: ReadableStream<Uint8Array>,
  callbacks: SageStreamCallbacks,
  signal: AbortSignal
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { events, remaining } = parseSSEBuffer(buffer);
      buffer = remaining;

      for (const event of events) {
        dispatchEvent(event.eventType, event.data, callbacks);
      }
    }

    // Parse any remaining buffer
    if (buffer.trim()) {
      const { events } = parseSSEBuffer(buffer + '\n\n');
      for (const event of events) {
        dispatchEvent(event.eventType, event.data, callbacks);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
