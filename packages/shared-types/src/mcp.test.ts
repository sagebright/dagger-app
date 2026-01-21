/**
 * Tests for MCP type definitions
 */

import { describe, it, expect } from 'vitest';
import type {
  ChatMessage,
  DialUpdate,
  ProcessDialInput,
  ProcessDialOutput,
  ClientEvent,
  ServerEvent,
  ConversationContext,
  ChatRequest,
  ChatResponse,
  InlineWidget,
} from './mcp.js';

describe('MCP Types', () => {
  describe('ChatMessage', () => {
    it('should accept valid user message', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'I want the tone to be like The Witcher',
        timestamp: new Date().toISOString(),
      };
      expect(message.role).toBe('user');
      expect(message.content).toBeTruthy();
    });

    it('should accept assistant message with dial updates', () => {
      const message: ChatMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Setting a gritty, morally gray tone.',
        timestamp: new Date().toISOString(),
        dialUpdates: [
          {
            dialId: 'tone',
            value: 'gritty, morally gray (like The Witcher)',
            confidence: 'high',
            reason: 'User explicitly referenced The Witcher',
          },
        ],
      };
      expect(message.dialUpdates).toHaveLength(1);
      expect(message.dialUpdates![0].confidence).toBe('high');
    });

    it('should accept message with inline widgets', () => {
      const message: ChatMessage = {
        id: 'msg-3',
        role: 'assistant',
        content: 'What tone resonates with you?',
        timestamp: new Date().toISOString(),
        inlineWidgets: [
          {
            type: 'reference_cards',
            dialId: 'tone',
            references: [
              { name: 'The Witcher', description: 'Gritty, morally gray' },
              { name: 'Princess Bride', description: 'Lighthearted with heart' },
            ],
          },
        ],
      };
      expect(message.inlineWidgets).toHaveLength(1);
      expect(message.inlineWidgets![0].type).toBe('reference_cards');
    });
  });

  describe('DialUpdate', () => {
    it('should represent concrete dial update', () => {
      const update: DialUpdate = {
        dialId: 'partySize',
        value: 5,
        confidence: 'high',
        reason: 'User said "5 players"',
      };
      expect(update.dialId).toBe('partySize');
      expect(update.value).toBe(5);
    });

    it('should represent conceptual dial update', () => {
      const update: DialUpdate = {
        dialId: 'tone',
        value: 'mysterious and haunting',
        confidence: 'medium',
      };
      expect(update.confidence).toBe('medium');
    });

    it('should represent low confidence suggestion', () => {
      const update: DialUpdate = {
        dialId: 'lethality',
        value: 'moderate danger',
        confidence: 'low',
        reason: 'Inferred from genre preference',
      };
      expect(update.confidence).toBe('low');
    });
  });

  describe('ProcessDialInput', () => {
    it('should accept valid input', () => {
      const input: ProcessDialInput = {
        userMessage: 'I want it to feel like Hollow Knight',
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
          confirmedDials: ['partySize'],
        },
        conversationHistory: [],
        currentDialFocus: 'tone',
      };
      expect(input.userMessage).toBeTruthy();
      expect(input.currentDials.partySize).toBe(4);
    });
  });

  describe('ProcessDialOutput', () => {
    it('should accept output with dial updates', () => {
      const output: ProcessDialOutput = {
        assistantMessage: 'Setting a mysterious, haunting atmosphere.',
        dialUpdates: [
          {
            dialId: 'tone',
            value: 'mysterious and haunting',
            confidence: 'high',
          },
        ],
        nextDialFocus: 'pillarBalance',
      };
      expect(output.dialUpdates).toHaveLength(1);
      expect(output.nextDialFocus).toBe('pillarBalance');
    });

    it('should accept output with inline widgets', () => {
      const output: ProcessDialOutput = {
        assistantMessage: 'How many players will be at the table?',
        inlineWidgets: [
          {
            type: 'number_stepper',
            dialId: 'partySize',
            min: 2,
            max: 6,
            currentValue: 4,
          },
        ],
      };
      expect(output.inlineWidgets).toHaveLength(1);
    });
  });

  describe('InlineWidget', () => {
    it('should create reference cards widget', () => {
      const widget: InlineWidget = {
        type: 'reference_cards',
        dialId: 'tone',
        references: [
          { name: 'The Witcher', description: 'Gritty' },
        ],
      };
      expect(widget.type).toBe('reference_cards');
    });

    it('should create number stepper widget', () => {
      const widget: InlineWidget = {
        type: 'number_stepper',
        dialId: 'partySize',
        min: 2,
        max: 6,
      };
      expect(widget.min).toBe(2);
      expect(widget.max).toBe(6);
    });

    it('should create tier select widget', () => {
      const widget: InlineWidget = {
        type: 'tier_select',
        dialId: 'partyTier',
        currentValue: 2,
      };
      expect(widget.currentValue).toBe(2);
    });

    it('should create spectrum slider widget', () => {
      const widget: InlineWidget = {
        type: 'spectrum_slider',
        dialId: 'tone',
        leftLabel: 'Grim',
        rightLabel: 'Whimsical',
      };
      expect(widget.leftLabel).toBe('Grim');
    });

    it('should create theme chips widget', () => {
      const widget: InlineWidget = {
        type: 'theme_chips',
        dialId: 'themes',
        selectedThemes: ['redemption', 'sacrifice'],
      };
      expect(widget.selectedThemes).toHaveLength(2);
    });
  });

  describe('ClientEvent', () => {
    it('should create user message event', () => {
      const event: ClientEvent = {
        type: 'chat:user_message',
        payload: {
          content: 'Like Dark Souls',
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
      expect(event.type).toBe('chat:user_message');
    });

    it('should create dial update event', () => {
      const event: ClientEvent = {
        type: 'dial:update',
        payload: {
          dialId: 'partySize',
          value: 5,
        },
      };
      expect(event.type).toBe('dial:update');
    });

    it('should create dial confirm event', () => {
      const event: ClientEvent = {
        type: 'dial:confirm',
        payload: {
          dialId: 'tone',
          accepted: true,
        },
      };
      expect(event.payload.accepted).toBe(true);
    });
  });

  describe('ServerEvent', () => {
    it('should create connected event', () => {
      const event: ServerEvent = {
        type: 'connected',
        payload: {
          message: 'MCP Bridge connected',
        },
      };
      expect(event.type).toBe('connected');
    });

    it('should create assistant start event', () => {
      const event: ServerEvent = {
        type: 'chat:assistant_start',
        payload: {
          messageId: 'msg-123',
        },
      };
      expect(event.payload.messageId).toBe('msg-123');
    });

    it('should create assistant chunk event', () => {
      const event: ServerEvent = {
        type: 'chat:assistant_chunk',
        payload: {
          messageId: 'msg-123',
          chunk: 'Setting a ',
        },
      };
      expect(event.payload.chunk).toBe('Setting a ');
    });

    it('should create assistant complete event', () => {
      const event: ServerEvent = {
        type: 'chat:assistant_complete',
        payload: {
          messageId: 'msg-123',
          dialUpdates: [
            { dialId: 'tone', value: 'dark', confidence: 'high' },
          ],
        },
      };
      expect(event.payload.dialUpdates).toHaveLength(1);
    });

    it('should create dial updated event', () => {
      const event: ServerEvent = {
        type: 'dial:updated',
        payload: {
          dialId: 'partySize',
          value: 5,
          source: 'user',
        },
      };
      expect(event.payload.source).toBe('user');
    });

    it('should create dial suggestion event', () => {
      const event: ServerEvent = {
        type: 'dial:suggestion',
        payload: {
          dialId: 'tone',
          value: 'gritty',
          confidence: 'medium',
          reason: 'Based on genre',
        },
      };
      expect(event.payload.confidence).toBe('medium');
    });

    it('should create error event', () => {
      const event: ServerEvent = {
        type: 'error',
        payload: {
          code: 'INVALID_INPUT',
          message: 'Invalid dial value',
        },
      };
      expect(event.payload.code).toBe('INVALID_INPUT');
    });
  });

  describe('ConversationContext', () => {
    it('should track conversation state', () => {
      const context: ConversationContext = {
        sessionId: 'session-123',
        currentPhase: 'dial-tuning',
        messages: [],
        currentDialFocus: 'partySize',
        dialDiscussionOrder: ['partySize'],
        remainingDials: ['partyTier', 'tone', 'themes'],
      };
      expect(context.currentPhase).toBe('dial-tuning');
      expect(context.remainingDials).toHaveLength(3);
    });
  });

  describe('ChatRequest', () => {
    it('should accept valid chat request', () => {
      const request: ChatRequest = {
        message: 'Set party size to 5',
        sessionId: 'session-123',
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
      };
      expect(request.message).toBeTruthy();
    });
  });

  describe('ChatResponse', () => {
    it('should accept valid chat response', () => {
      const response: ChatResponse = {
        messageId: 'msg-456',
        content: 'Party size set to 5 players.',
        dialUpdates: [
          { dialId: 'partySize', value: 5, confidence: 'high' },
        ],
        nextDialFocus: 'partyTier',
      };
      expect(response.content).toBeTruthy();
      expect(response.dialUpdates).toHaveLength(1);
    });
  });
});
