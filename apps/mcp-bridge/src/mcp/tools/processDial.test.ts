/**
 * Tests for process_dial_input MCP tool
 */

import { describe, it, expect } from 'vitest';
import {
  processDialInputHandler,
  PROCESS_DIAL_INPUT_SCHEMA,
  determineNextDialFocus,
  interpretDialValue,
  generateDialResponse,
} from './processDial.js';
import type { ProcessDialInput, PartyTier, ThemeOption, DialId } from '@dagger-app/shared-types';

// Default dial state for testing
const createDefaultDials = (): ProcessDialInput['currentDials'] => ({
  partySize: 4,
  partyTier: 1 as PartyTier,
  sceneCount: 4,
  sessionLength: '3-4 hours' as const,
  tone: null,
  pillarBalance: null,
  npcDensity: null,
  lethality: null,
  emotionalRegister: null,
  themes: [] as ThemeOption[],
  confirmedDials: [] as DialId[],
});

describe('processDial Tool', () => {
  describe('PROCESS_DIAL_INPUT_SCHEMA', () => {
    it('should have correct schema structure', () => {
      expect(PROCESS_DIAL_INPUT_SCHEMA.description).toBeTruthy();
      expect(PROCESS_DIAL_INPUT_SCHEMA.inputSchema).toBeDefined();
      expect(PROCESS_DIAL_INPUT_SCHEMA.inputSchema?.properties).toHaveProperty('userMessage');
      expect(PROCESS_DIAL_INPUT_SCHEMA.inputSchema?.properties).toHaveProperty('currentDials');
      expect(PROCESS_DIAL_INPUT_SCHEMA.inputSchema?.properties).toHaveProperty('conversationHistory');
    });
  });

  describe('determineNextDialFocus', () => {
    it('should return first unconfirmed dial', () => {
      const dials = createDefaultDials();
      const next = determineNextDialFocus(dials);
      expect(next).toBe('partySize');
    });

    it('should skip confirmed dials', () => {
      const dials = createDefaultDials();
      dials.confirmedDials = ['partySize', 'partyTier'];
      const next = determineNextDialFocus(dials);
      expect(next).toBe('sceneCount');
    });

    it('should return undefined when all dials confirmed', () => {
      const dials = createDefaultDials();
      dials.confirmedDials = [
        'partySize',
        'partyTier',
        'sceneCount',
        'sessionLength',
        'tone',
        'pillarBalance',
        'npcDensity',
        'lethality',
        'emotionalRegister',
        'themes',
      ];
      const next = determineNextDialFocus(dials);
      expect(next).toBeUndefined();
    });

    it('should respect suggested focus if unconfirmed', () => {
      const dials = createDefaultDials();
      const next = determineNextDialFocus(dials, 'tone');
      expect(next).toBe('tone');
    });
  });

  describe('interpretDialValue', () => {
    describe('partySize', () => {
      it('should extract party size from message', () => {
        const result = interpretDialValue('partySize', 'We have 5 players at the table');
        expect(result).toBe(5);
      });

      it('should extract party size from direct number', () => {
        expect(interpretDialValue('partySize', '5')).toBe(5);
        expect(interpretDialValue('partySize', '5 players')).toBe(5);
      });

      it('should extract party size from word numbers', () => {
        expect(interpretDialValue('partySize', 'three players')).toBe(3);
        expect(interpretDialValue('partySize', 'four')).toBe(4);
      });

      it('should return null for invalid party size', () => {
        expect(interpretDialValue('partySize', 'hello')).toBeNull();
        expect(interpretDialValue('partySize', '10 players')).toBeNull();
      });
    });

    describe('partyTier', () => {
      it('should extract tier from message', () => {
        expect(interpretDialValue('partyTier', 'tier 2')).toBe(2);
        expect(interpretDialValue('partyTier', 'level 3')).toBe(3);
      });

      it('should return null for invalid tier', () => {
        expect(interpretDialValue('partyTier', 'tier 5')).toBeNull();
        expect(interpretDialValue('partyTier', 'what tier should we use')).toBeNull();
      });
    });

    describe('sceneCount', () => {
      it('should extract scene count from message', () => {
        expect(interpretDialValue('sceneCount', '5 scenes please')).toBe(5);
        expect(interpretDialValue('sceneCount', 'four scenes')).toBe(4);
      });

      it('should return null for out of range', () => {
        expect(interpretDialValue('sceneCount', '2 scenes')).toBeNull();
        expect(interpretDialValue('sceneCount', '10 scenes')).toBeNull();
      });
    });

    describe('sessionLength', () => {
      it('should extract session length from message', () => {
        expect(interpretDialValue('sessionLength', 'about 3-4 hours')).toBe('3-4 hours');
        expect(interpretDialValue('sessionLength', '2-3 hours session')).toBe('2-3 hours');
        expect(interpretDialValue('sessionLength', 'longer session, 4-5 hours')).toBe('4-5 hours');
      });

      it('should return null for invalid session length', () => {
        expect(interpretDialValue('sessionLength', '1 hour')).toBeNull();
      });
    });

    describe('tone', () => {
      it('should detect reference point names', () => {
        const result = interpretDialValue('tone', 'like The Witcher');
        expect(result).toContain('Witcher');
      });

      it('should preserve user description', () => {
        const result = interpretDialValue('tone', 'mysterious and haunting');
        expect(result).toBe('mysterious and haunting');
      });
    });

    describe('themes', () => {
      it('should extract matching themes', () => {
        const result = interpretDialValue('themes', 'redemption and sacrifice');
        expect(result).toEqual(['redemption', 'sacrifice']);
      });

      it('should extract found family theme', () => {
        const result = interpretDialValue('themes', 'found family is important');
        expect(result).toEqual(['found-family']);
      });

      it('should limit to 3 themes', () => {
        const result = interpretDialValue(
          'themes',
          'redemption, sacrifice, identity, and legacy'
        );
        expect(result).toHaveLength(3);
      });
    });
  });

  describe('generateDialResponse', () => {
    it('should generate response for partySize dial', () => {
      const response = generateDialResponse('partySize', createDefaultDials());
      expect(response).toContain('player');
    });

    it('should generate response for tone dial', () => {
      const response = generateDialResponse('tone', createDefaultDials());
      expect(response).toContain('tone');
    });

    it('should generate completion message when no dial specified', () => {
      const response = generateDialResponse(undefined, createDefaultDials());
      expect(response).toContain('configured');
    });
  });

  describe('processDialInputHandler', () => {
    it('should process user message and return structured output', async () => {
      const input: ProcessDialInput = {
        userMessage: 'We have 5 players',
        currentDials: createDefaultDials(),
        conversationHistory: [],
        currentDialFocus: 'partySize',
      };

      const result = await processDialInputHandler(input);

      expect(result).toHaveProperty('assistantMessage');
      expect(result.dialUpdates).toBeDefined();
      expect(result.dialUpdates).toHaveLength(1);
      expect(result.dialUpdates![0].dialId).toBe('partySize');
      expect(result.dialUpdates![0].value).toBe(5);
      expect(result.dialUpdates![0].confidence).toBe('high');
    });

    it('should handle tone reference', async () => {
      const input: ProcessDialInput = {
        userMessage: 'I want it to feel like The Witcher',
        currentDials: createDefaultDials(),
        conversationHistory: [],
        currentDialFocus: 'tone',
      };

      const result = await processDialInputHandler(input);

      expect(result.dialUpdates).toBeDefined();
      expect(result.dialUpdates![0].dialId).toBe('tone');
      expect(result.dialUpdates![0].value).toContain('Witcher');
    });

    it('should suggest next dial focus', async () => {
      const input: ProcessDialInput = {
        userMessage: '4 players',
        currentDials: createDefaultDials(),
        conversationHistory: [],
        currentDialFocus: 'partySize',
      };

      const result = await processDialInputHandler(input);

      expect(result.nextDialFocus).toBeDefined();
      expect(result.nextDialFocus).not.toBe('partySize');
    });

    it('should include inline widgets for number dials', async () => {
      const dials = createDefaultDials();
      dials.confirmedDials = ['partySize'];

      const input: ProcessDialInput = {
        userMessage: 'tier 2 characters',
        currentDials: dials,
        conversationHistory: [],
        currentDialFocus: 'partyTier',
      };

      const result = await processDialInputHandler(input);

      // Next focus should include relevant widget
      if (result.nextDialFocus === 'sceneCount') {
        expect(result.inlineWidgets).toBeDefined();
        expect(result.inlineWidgets![0].type).toBe('number_stepper');
      }
    });

    it('should handle theme selection', async () => {
      const input: ProcessDialInput = {
        userMessage: 'themes of redemption and sacrifice',
        currentDials: createDefaultDials(),
        conversationHistory: [],
        currentDialFocus: 'themes',
      };

      const result = await processDialInputHandler(input);

      expect(result.dialUpdates).toBeDefined();
      expect(result.dialUpdates![0].dialId).toBe('themes');
      expect(result.dialUpdates![0].value).toEqual(['redemption', 'sacrifice']);
    });

    it('should handle no recognizable input gracefully', async () => {
      const input: ProcessDialInput = {
        userMessage: 'hello',
        currentDials: createDefaultDials(),
        conversationHistory: [],
        currentDialFocus: 'partySize',
      };

      const result = await processDialInputHandler(input);

      expect(result.assistantMessage).toBeTruthy();
      // Should still suggest what to do next
      expect(result.nextDialFocus).toBeDefined();
    });
  });
});
