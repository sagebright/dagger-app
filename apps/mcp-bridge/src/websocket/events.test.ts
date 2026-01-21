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
  emitOutlineDraftStart,
  emitOutlineDraftChunk,
  emitOutlineDraftComplete,
  emitOutlineConfirmed,
  emitSceneBriefUpdated,
  parseClientEvent,
} from './events.js';
import type {
  ClientEvent,
  OutlineClientEvent,
  ServerEvent,
  DialUpdate,
  InlineWidget,
} from '@dagger-app/shared-types';

// Combined type for tests
type AllClientEvents = ClientEvent | OutlineClientEvent;

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
            pillarBalance: null,
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

    it('should handle outline generate event', async () => {
      const event = {
        type: 'outline:generate' as const,
        payload: {
          frame: {
            id: 'f1',
            name: 'Test',
            description: 'Test frame',
            themes: [],
            typical_adversaries: [],
            lore: null,
            embedding: null,
            source_book: null,
            created_at: null,
          },
          dialsSummary: {
            partySize: 4,
            partyTier: 2 as const,
            sceneCount: 4,
            sessionLength: 'standard',
            tone: null,
            themes: [],
            pillarBalance: null,
            lethality: null,
          },
        },
      };
      const handler = vi.fn();
      await handleClientEvent(mockWs, event, { onOutlineGenerate: handler });
      expect(handler).toHaveBeenCalledWith(event.payload);
    });

    it('should handle outline feedback event', async () => {
      const event = {
        type: 'outline:feedback',
        payload: {
          feedback: 'More combat',
          currentOutline: { id: 'o1', title: 'Test', summary: '', scenes: [], isConfirmed: false, createdAt: '', updatedAt: '' },
        },
      } as AllClientEvents;
      const handler = vi.fn();
      await handleClientEvent(mockWs, event, { onOutlineFeedback: handler });
      expect(handler).toHaveBeenCalledWith(event.payload);
    });

    it('should handle outline confirm event', async () => {
      const event = {
        type: 'outline:confirm',
        payload: {
          outline: { id: 'o1', title: 'Test', summary: '', scenes: [], isConfirmed: true, createdAt: '', updatedAt: '' },
        },
      } as AllClientEvents;
      const handler = vi.fn();
      await handleClientEvent(mockWs, event, { onOutlineConfirm: handler });
      expect(handler).toHaveBeenCalledWith(event.payload);
    });

    it('should handle outline edit scene event', async () => {
      const event = {
        type: 'outline:edit_scene',
        payload: {
          sceneId: 's1',
          updates: { title: 'New Title' },
        },
      } as AllClientEvents;
      const handler = vi.fn();
      await handleClientEvent(mockWs, event, { onOutlineEditScene: handler });
      expect(handler).toHaveBeenCalledWith(event.payload);
    });
  });

  describe('Outline Event Emitters', () => {
    it('should emit outline draft start', () => {
      emitOutlineDraftStart(mockWs, 'msg-456');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'outline:draft_start',
          payload: { messageId: 'msg-456' },
        })
      );
    });

    it('should emit outline draft chunk', () => {
      emitOutlineDraftChunk(mockWs, 'msg-456', 'Scene 1...');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'outline:draft_chunk',
          payload: { messageId: 'msg-456', chunk: 'Scene 1...' },
        })
      );
    });

    it('should emit outline draft complete without outline', () => {
      emitOutlineDraftComplete(mockWs, 'msg-456', false, undefined, 'Need more detail');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'outline:draft_complete',
          payload: { messageId: 'msg-456', isComplete: false, followUpQuestion: 'Need more detail' },
        })
      );
    });

    it('should emit outline draft complete with outline', () => {
      const outline = {
        title: 'Test Adventure',
        summary: 'A test',
        scenes: [{ id: 's1', sceneNumber: 1, title: 'Scene 1', description: 'Test', keyElements: [] }],
      };
      emitOutlineDraftComplete(mockWs, 'msg-456', true, outline);
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'outline:draft_complete',
          payload: { messageId: 'msg-456', isComplete: true, outline },
        })
      );
    });

    it('should emit outline confirmed', () => {
      const outline = {
        id: 'o1',
        title: 'Test',
        summary: 'Test summary',
        scenes: [],
        isConfirmed: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      emitOutlineConfirmed(mockWs, outline);
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'outline:confirmed',
          payload: { outline },
        })
      );
    });

    it('should emit scene brief updated', () => {
      const scene = {
        id: 's1',
        sceneNumber: 1,
        title: 'Updated Scene',
        description: 'Test',
        keyElements: ['test'],
        sceneType: 'combat' as const,
      };
      emitSceneBriefUpdated(mockWs, scene);
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'outline:scene_updated',
          payload: { scene },
        })
      );
    });
  });

  describe('parseClientEvent', () => {
    it('should parse valid chat event', () => {
      const data = JSON.stringify({
        type: 'chat:user_message',
        payload: { content: 'test' },
      });
      const result = parseClientEvent(data);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('chat:user_message');
    });

    it('should parse valid outline event', () => {
      const data = JSON.stringify({
        type: 'outline:generate',
        payload: { frame: {}, dialsSummary: {} },
      });
      const result = parseClientEvent(data);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('outline:generate');
    });

    it('should return null for invalid JSON', () => {
      const result = parseClientEvent('not json');
      expect(result).toBeNull();
    });

    it('should return null for missing type', () => {
      const data = JSON.stringify({ payload: {} });
      const result = parseClientEvent(data);
      expect(result).toBeNull();
    });

    it('should return null for unknown event type', () => {
      const data = JSON.stringify({ type: 'unknown:event', payload: {} });
      const result = parseClientEvent(data);
      expect(result).toBeNull();
    });
  });
});
