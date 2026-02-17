/**
 * useSageStream — Frontend hook for SSE chat streaming
 *
 * POSTs to /api/chat with the user message and session ID,
 * then parses the SSE event stream and dispatches typed callbacks
 * for each SageEvent type.
 *
 * Usage:
 *   const { sendMessage, isStreaming, error } = useSageStream({
 *     sessionId: 'abc-123',
 *     accessToken: session.access_token,
 *     onChatStart: (data) => { ... },
 *     onChatDelta: (data) => { ... },
 *     onChatEnd: (data) => { ... },
 *     onToolStart: (data) => { ... },
 *     onToolEnd: (data) => { ... },
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
  SageErrorEvent,
} from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface SageStreamCallbacks {
  onChatStart?: (data: ChatStartEvent['data']) => void;
  onChatDelta?: (data: ChatDeltaEvent['data']) => void;
  onChatEnd?: (data: ChatEndEvent['data']) => void;
  onToolStart?: (data: ToolStartEvent['data']) => void;
  onToolEnd?: (data: ToolEndEvent['data']) => void;
  onError?: (data: SageErrorEvent['data']) => void;
}

export interface UseSageStreamOptions extends SageStreamCallbacks {
  sessionId: string;
  accessToken: string;
}

export interface UseSageStreamReturn {
  sendMessage: (message: string) => Promise<void>;
  isStreaming: boolean;
  error: string | null;
  abort: () => void;
}

// =============================================================================
// SSE Line Parser
// =============================================================================

interface ParsedSSELine {
  eventType: string;
  data: unknown;
}

/**
 * Parse buffered SSE text into individual events.
 *
 * Each event is separated by a double newline. Within each event:
 * - "event: <type>" sets the event type
 * - "data: <json>" sets the data payload
 */
function parseSSEBuffer(buffer: string): {
  events: ParsedSSELine[];
  remaining: string;
} {
  const events: ParsedSSELine[] = [];
  const blocks = buffer.split('\n\n');

  // Last element may be incomplete; keep it as remaining
  const remaining = blocks.pop() ?? '';

  for (const block of blocks) {
    if (!block.trim()) continue;

    let eventType = 'message';
    let dataStr = '';

    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        eventType = line.slice('event:'.length).trim();
      } else if (line.startsWith('data:')) {
        dataStr = line.slice('data:'.length).trim();
      }
    }

    if (!dataStr) continue;

    try {
      events.push({ eventType, data: JSON.parse(dataStr) });
    } catch {
      events.push({ eventType, data: dataStr });
    }
  }

  return { events, remaining };
}

// =============================================================================
// Event Dispatcher
// =============================================================================

function dispatchEvent(
  eventType: string,
  data: unknown,
  callbacks: SageStreamCallbacks
): void {
  switch (eventType) {
    case 'chat:start':
      callbacks.onChatStart?.(data as ChatStartEvent['data']);
      break;
    case 'chat:delta':
      callbacks.onChatDelta?.(data as ChatDeltaEvent['data']);
      break;
    case 'chat:end':
      callbacks.onChatEnd?.(data as ChatEndEvent['data']);
      break;
    case 'tool:start':
      callbacks.onToolStart?.(data as ToolStartEvent['data']);
      break;
    case 'tool:end':
      callbacks.onToolEnd?.(data as ToolEndEvent['data']);
      break;
    case 'error':
      callbacks.onError?.(data as SageErrorEvent['data']);
      break;
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useSageStream(
  options: UseSageStreamOptions
): UseSageStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (message: string): Promise<void> => {
      if (isStreaming) return;

      setIsStreaming(true);
      setError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

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

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ??
              `Chat request failed: ${response.status}`
          );
        }

        if (!response.body) {
          throw new Error('Response body is null — streaming not supported');
        }

        await readSSEStream(response.body, options, controller.signal);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const errorMessage =
            err instanceof Error ? err.message : 'Stream failed';
          setError(errorMessage);
          options.onError?.({ code: 'FETCH_ERROR', message: errorMessage });
        }
      } finally {
        abortControllerRef.current = null;
        setIsStreaming(false);
      }
    },
    [isStreaming, options]
  );

  return { sendMessage, isStreaming, error, abort };
}

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
