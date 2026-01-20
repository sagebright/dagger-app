/**
 * WebSocket Event Handlers
 *
 * Provides typed event emission and handling for WebSocket communication
 * between the frontend and MCP Bridge.
 */

import type { WebSocket } from 'ws';
import type {
  ServerEvent,
  ClientEvent,
  DialUpdate,
  InlineWidget,
  DialId,
  DialConfidence,
  UserMessageEvent,
  DialUpdateEvent,
  DialConfirmEvent,
} from '@dagger-app/shared-types';

// =============================================================================
// Event Handlers Configuration
// =============================================================================

/**
 * Handlers for client events
 */
export interface ClientEventHandlers {
  onUserMessage?: (payload: UserMessageEvent['payload']) => Promise<void> | void;
  onDialUpdate?: (payload: DialUpdateEvent['payload']) => Promise<void> | void;
  onDialConfirm?: (payload: DialConfirmEvent['payload']) => Promise<void> | void;
}

// =============================================================================
// Core Event Emission
// =============================================================================

/**
 * Send a typed event to a WebSocket client
 */
export function emitToClient(ws: WebSocket, event: ServerEvent): void {
  if (ws.readyState === 1) {
    // 1 = OPEN
    ws.send(JSON.stringify(event));
  }
}

// =============================================================================
// Server Event Emitters
// =============================================================================

/**
 * Emit connected event
 */
export function emitConnected(ws: WebSocket, message: string): void {
  emitToClient(ws, {
    type: 'connected',
    payload: { message },
  });
}

/**
 * Emit assistant response start (for streaming)
 */
export function emitAssistantStart(ws: WebSocket, messageId: string): void {
  emitToClient(ws, {
    type: 'chat:assistant_start',
    payload: { messageId },
  });
}

/**
 * Emit streaming chunk of assistant response
 */
export function emitAssistantChunk(ws: WebSocket, messageId: string, chunk: string): void {
  emitToClient(ws, {
    type: 'chat:assistant_chunk',
    payload: { messageId, chunk },
  });
}

/**
 * Emit assistant response complete
 */
export function emitAssistantComplete(
  ws: WebSocket,
  messageId: string,
  dialUpdates?: DialUpdate[],
  inlineWidgets?: InlineWidget[]
): void {
  const payload: { messageId: string; dialUpdates?: DialUpdate[]; inlineWidgets?: InlineWidget[] } =
    { messageId };

  if (dialUpdates) {
    payload.dialUpdates = dialUpdates;
  }
  if (inlineWidgets) {
    payload.inlineWidgets = inlineWidgets;
  }

  emitToClient(ws, {
    type: 'chat:assistant_complete',
    payload,
  });
}

/**
 * Emit dial value updated (confirmed change)
 */
export function emitDialUpdated(
  ws: WebSocket,
  dialId: DialId,
  value: unknown,
  source: 'user' | 'assistant'
): void {
  emitToClient(ws, {
    type: 'dial:updated',
    payload: { dialId, value, source },
  });
}

/**
 * Emit dial suggestion from assistant
 */
export function emitDialSuggestion(
  ws: WebSocket,
  dialId: DialId,
  value: unknown,
  confidence: DialConfidence,
  reason?: string
): void {
  const payload: { dialId: DialId; value: unknown; confidence: DialConfidence; reason?: string } = {
    dialId,
    value,
    confidence,
  };

  if (reason) {
    payload.reason = reason;
  }

  emitToClient(ws, {
    type: 'dial:suggestion',
    payload,
  });
}

/**
 * Emit error event
 */
export function emitError(ws: WebSocket, code: string, message: string): void {
  emitToClient(ws, {
    type: 'error',
    payload: { code, message },
  });
}

// =============================================================================
// Client Event Handler
// =============================================================================

/**
 * Handle incoming client events with typed handlers
 */
export async function handleClientEvent(
  ws: WebSocket,
  event: ClientEvent,
  handlers: ClientEventHandlers
): Promise<void> {
  switch (event.type) {
    case 'chat:user_message':
      if (handlers.onUserMessage) {
        await handlers.onUserMessage(event.payload);
      }
      break;

    case 'dial:update':
      if (handlers.onDialUpdate) {
        await handlers.onDialUpdate(event.payload);
      }
      break;

    case 'dial:confirm':
      if (handlers.onDialConfirm) {
        await handlers.onDialConfirm(event.payload);
      }
      break;

    default:
      emitError(ws, 'UNKNOWN_EVENT', `Unknown event type: ${(event as { type: string }).type}`);
  }
}

/**
 * Parse and validate incoming WebSocket message as ClientEvent
 */
export function parseClientEvent(data: Buffer | string): ClientEvent | null {
  try {
    const parsed = JSON.parse(data.toString());

    // Basic validation
    if (!parsed || typeof parsed !== 'object' || !parsed.type || !parsed.payload) {
      return null;
    }

    // Validate known event types
    const validTypes = ['chat:user_message', 'dial:update', 'dial:confirm'];
    if (!validTypes.includes(parsed.type)) {
      return null;
    }

    return parsed as ClientEvent;
  } catch {
    return null;
  }
}
