/**
 * Tests for WebSocket event handlers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { WebSocket } from 'ws';
import {
  handleClientEvent,
  emitToClient,
  emitAssistantStart,
  emitAssistantChunk,
  emitAssistantComplete,
  emitDialUpdated,
  emitDialSuggestion,
  emitError,
} from './events.js';
import type {
  ClientEvent,
  ServerEvent,
  DialUpdate,
  InlineWidget,
} from '@dagger-app/shared-types';

// Mock WebSocket
function createMockWebSocket(): WebSocket {
  return {
    send: vi.fn(),
    readyState: 1, // OPEN
  } as unknown as WebSocket;
}

describe('WebSocket Events', () => {
  let mockWs: WebSocket;

  beforeEach(() => {
    mockWs = createMockWebSocket();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('emitToClient', () => {
    it('should send JSON stringified event', () => {
      const event: ServerEvent = {
        type: 'connected',
        payload: { message: 'Test' },
      };
      emitToClient(mockWs, event);
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(event));
    });

    it('should not send if socket not open', () => {
      const closedWs = { ...mockWs, readyState: 3 } as WebSocket; // CLOSED
      const event: ServerEvent = {
        type: 'connected',
        payload: { message: 'Test' },
      };
      emitToClient(closedWs, event);
      expect(closedWs.send).not.toHaveBeenCalled();
    });
  });

  describe('emitAssistantStart', () => {
    it('should emit assistant start event', () => {
      emitAssistantStart(mockWs, 'msg-123');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'chat:assistant_start',
          payload: { messageId: 'msg-123' },
        })
      );
    });
  });

  describe('emitAssistantChunk', () => {
    it('should emit assistant chunk event', () => {
      emitAssistantChunk(mockWs, 'msg-123', 'Hello ');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'chat:assistant_chunk',
          payload: { messageId: 'msg-123', chunk: 'Hello ' },
        })
      );
    });
  });

  describe('emitAssistantComplete', () => {
    it('should emit assistant complete event without updates', () => {
      emitAssistantComplete(mockWs, 'msg-123');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'chat:assistant_complete',
          payload: { messageId: 'msg-123' },
        })
      );
    });

    it('should emit assistant complete event with dial updates', () => {
      const dialUpdates: DialUpdate[] = [
        { dialId: 'tone', value: 'dark', confidence: 'high' },
      ];
      emitAssistantComplete(mockWs, 'msg-123', dialUpdates);
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'chat:assistant_complete',
          payload: { messageId: 'msg-123', dialUpdates },
        })
      );
    });

    it('should emit assistant complete event with inline widgets', () => {
      const inlineWidgets: InlineWidget[] = [
        { type: 'number_stepper', dialId: 'partySize', min: 2, max: 6 },
      ];
      emitAssistantComplete(mockWs, 'msg-123', undefined, inlineWidgets);
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'chat:assistant_complete',
          payload: { messageId: 'msg-123', inlineWidgets },
        })
      );
    });
  });

  describe('emitDialUpdated', () => {
    it('should emit dial updated event from user', () => {
      emitDialUpdated(mockWs, 'partySize', 5, 'user');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'dial:updated',
          payload: { dialId: 'partySize', value: 5, source: 'user' },
        })
      );
    });

    it('should emit dial updated event from assistant', () => {
      emitDialUpdated(mockWs, 'tone', 'dark', 'assistant');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'dial:updated',
          payload: { dialId: 'tone', value: 'dark', source: 'assistant' },
        })
      );
    });
  });

  describe('emitDialSuggestion', () => {
    it('should emit dial suggestion without reason', () => {
      emitDialSuggestion(mockWs, 'tone', 'gritty', 'medium');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'dial:suggestion',
          payload: { dialId: 'tone', value: 'gritty', confidence: 'medium' },
        })
      );
    });

    it('should emit dial suggestion with reason', () => {
      emitDialSuggestion(mockWs, 'tone', 'gritty', 'high', 'User referenced Witcher');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'dial:suggestion',
          payload: {
            dialId: 'tone',
            value: 'gritty',
            confidence: 'high',
            reason: 'User referenced Witcher',
          },
        })
      );
    });
  });

  describe('emitError', () => {
    it('should emit error event', () => {
      emitError(mockWs, 'INVALID_INPUT', 'Bad dial value');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'error',
          payload: { code: 'INVALID_INPUT', message: 'Bad dial value' },
        })
      );
    });
  });

  describe('handleClientEvent', () => {
    it('should handle user message event', async () => {
      const event: ClientEvent = {
        type: 'chat:user_message',
        payload: {
          content: 'Like The Witcher',
          currentDials: {
            partySize: 4,
            partyTier: 1,
            sceneCount: 4,
            sessionLength: '3-4 hours',
            tone: null,
            combatExplorationBalance: null,
            npcDensity: null,
            lethality: null,
            emotionalRegister: null,
            themes: [],
            confirmedDials: [],
          },
        },
      };
      const handler = vi.fn();
      await handleClientEvent(mockWs, event, { onUserMessage: handler });
      expect(handler).toHaveBeenCalledWith(event.payload);
    });

    it('should handle dial update event', async () => {
      const event: ClientEvent = {
        type: 'dial:update',
        payload: {
          dialId: 'partySize',
          value: 5,
        },
      };
      const handler = vi.fn();
      await handleClientEvent(mockWs, event, { onDialUpdate: handler });
      expect(handler).toHaveBeenCalledWith(event.payload);
    });

    it('should handle dial confirm event', async () => {
      const event: ClientEvent = {
        type: 'dial:confirm',
        payload: {
          dialId: 'tone',
          accepted: true,
        },
      };
      const handler = vi.fn();
      await handleClientEvent(mockWs, event, { onDialConfirm: handler });
      expect(handler).toHaveBeenCalledWith(event.payload);
    });

    it('should emit error for unknown event type', async () => {
      const event = { type: 'unknown:event', payload: {} } as unknown as ClientEvent;
      await handleClientEvent(mockWs, event, {});
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('UNKNOWN_EVENT')
      );
    });
  });
});
