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
  OutlineGenerateEvent,
  OutlineFeedbackEvent,
  OutlineConfirmEvent,
  OutlineEditSceneEvent,
  OutlineClientEvent,
  OutlineServerEvent,
  Outline,
  SceneBrief,
} from '@dagger-app/shared-types';

// Combined event types that include both dial and outline events
type AllClientEvents = ClientEvent | OutlineClientEvent;
type AllServerEvents = ServerEvent | OutlineServerEvent;

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
  // Outline events
  onOutlineGenerate?: (payload: OutlineGenerateEvent['payload']) => Promise<void> | void;
  onOutlineFeedback?: (payload: OutlineFeedbackEvent['payload']) => Promise<void> | void;
  onOutlineConfirm?: (payload: OutlineConfirmEvent['payload']) => Promise<void> | void;
  onOutlineEditScene?: (payload: OutlineEditSceneEvent['payload']) => Promise<void> | void;
}

// =============================================================================
// Core Event Emission
// =============================================================================

/**
 * Send a typed event to a WebSocket client
 */
export function emitToClient(ws: WebSocket, event: AllServerEvents): void {
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
// Outline Event Emitters
// =============================================================================

/**
 * Emit outline draft start event
 */
export function emitOutlineDraftStart(ws: WebSocket, messageId: string): void {
  emitToClient(ws, {
    type: 'outline:draft_start',
    payload: { messageId },
  });
}

/**
 * Emit outline draft streaming chunk
 */
export function emitOutlineDraftChunk(ws: WebSocket, messageId: string, chunk: string): void {
  emitToClient(ws, {
    type: 'outline:draft_chunk',
    payload: { messageId, chunk },
  });
}

/**
 * Emit outline draft complete
 */
export function emitOutlineDraftComplete(
  ws: WebSocket,
  messageId: string,
  isComplete: boolean,
  outline?: Omit<Outline, 'id' | 'isConfirmed' | 'createdAt' | 'updatedAt'>,
  followUpQuestion?: string
): void {
  const payload: {
    messageId: string;
    isComplete: boolean;
    outline?: Omit<Outline, 'id' | 'isConfirmed' | 'createdAt' | 'updatedAt'>;
    followUpQuestion?: string;
  } = { messageId, isComplete };

  if (outline) {
    payload.outline = outline;
  }
  if (followUpQuestion) {
    payload.followUpQuestion = followUpQuestion;
  }

  emitToClient(ws, {
    type: 'outline:draft_complete',
    payload,
  });
}

/**
 * Emit outline confirmed event
 */
export function emitOutlineConfirmed(ws: WebSocket, outline: Outline): void {
  emitToClient(ws, {
    type: 'outline:confirmed',
    payload: { outline },
  });
}

/**
 * Emit scene brief updated event
 */
export function emitSceneBriefUpdated(ws: WebSocket, scene: SceneBrief): void {
  emitToClient(ws, {
    type: 'outline:scene_updated',
    payload: { scene },
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
  event: AllClientEvents,
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

    // Outline events
    case 'outline:generate':
      if (handlers.onOutlineGenerate) {
        await handlers.onOutlineGenerate((event as OutlineGenerateEvent).payload);
      }
      break;

    case 'outline:feedback':
      if (handlers.onOutlineFeedback) {
        await handlers.onOutlineFeedback((event as OutlineFeedbackEvent).payload);
      }
      break;

    case 'outline:confirm':
      if (handlers.onOutlineConfirm) {
        await handlers.onOutlineConfirm((event as OutlineConfirmEvent).payload);
      }
      break;

    case 'outline:edit_scene':
      if (handlers.onOutlineEditScene) {
        await handlers.onOutlineEditScene((event as OutlineEditSceneEvent).payload);
      }
      break;

    default:
      emitError(ws, 'UNKNOWN_EVENT', `Unknown event type: ${(event as { type: string }).type}`);
  }
}

/**
 * Parse and validate incoming WebSocket message as ClientEvent
 */
export function parseClientEvent(data: Buffer | string): AllClientEvents | null {
  try {
    const parsed = JSON.parse(data.toString());

    // Basic validation
    if (!parsed || typeof parsed !== 'object' || !parsed.type || !parsed.payload) {
      return null;
    }

    // Validate known event types
    const validTypes = [
      'chat:user_message',
      'dial:update',
      'dial:confirm',
      // Outline events
      'outline:generate',
      'outline:feedback',
      'outline:confirm',
      'outline:edit_scene',
    ];
    if (!validTypes.includes(parsed.type)) {
      return null;
    }

    return parsed as AllClientEvents;
  } catch {
    return null;
  }
}
