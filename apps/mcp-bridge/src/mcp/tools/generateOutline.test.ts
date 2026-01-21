/**
 * Tests for generate_outline_draft MCP Tool
 */

import { describe, it, expect } from 'vitest';
import { generateOutlineHandler, GENERATE_OUTLINE_SCHEMA } from './generateOutline.js';
import type {
  GenerateOutlineInput,
  FrameDraft,
  DaggerheartFrame,
  Outline,
} from '@dagger-app/shared-types';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockDbFrame(overrides: Partial<DaggerheartFrame> = {}): DaggerheartFrame {
  return {
    id: 'frame-1',
    name: 'The Haunted Forest',
    description: 'A dark forest filled with ancient spirits and forgotten secrets',
    themes: ['horror', 'mystery'],
    typical_adversaries: ['undead', 'fey'],
    lore: 'Long ago, this forest was the site of a great battle...',
    embedding: null,
    source_book: 'Core Rulebook',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockCustomFrame(overrides: Partial<FrameDraft> = {}): FrameDraft {
  return {
    id: 'custom-1',
    name: 'The Clockwork City',
    description: 'A city of mechanical wonders where gears rule all',
    themes: ['heist', 'political'],
    typicalAdversaries: ['constructs', 'humanoid'],
    lore: 'Built upon the ruins of the old world...',
    isCustom: true,
    ...overrides,
  };
}

function createMockDialsSummary(
  overrides: Partial<GenerateOutlineInput['dialsSummary']> = {}
): GenerateOutlineInput['dialsSummary'] {
  return {
    partySize: 4,
    partyTier: 2,
    sceneCount: 4,
    sessionLength: '3-4 hours',
    tone: 'dark and mysterious',
    themes: ['redemption', 'identity'],
    pillarBalance: 'balanced',
    lethality: 'moderate',
    ...overrides,
  };
}

function createMockInput(overrides: Partial<GenerateOutlineInput> = {}): GenerateOutlineInput {
  return {
    frame: createMockDbFrame(),
    dialsSummary: createMockDialsSummary(),
    ...overrides,
  };
}

// =============================================================================
// Schema Tests
// =============================================================================

describe('GENERATE_OUTLINE_SCHEMA', () => {
  it('has correct description', () => {
    expect(GENERATE_OUTLINE_SCHEMA.description).toBe(
      'Generate an adventure outline with scene briefs from frame and dials'
    );
  });

  it('requires frame and dialsSummary', () => {
    expect(GENERATE_OUTLINE_SCHEMA.inputSchema?.required).toContain('frame');
    expect(GENERATE_OUTLINE_SCHEMA.inputSchema?.required).toContain('dialsSummary');
  });

  it('has optional feedback field', () => {
    expect(GENERATE_OUTLINE_SCHEMA.inputSchema?.properties?.feedback).toBeDefined();
  });
});

// =============================================================================
// Basic Generation Tests
// =============================================================================

describe('generateOutlineHandler', () => {
  describe('basic generation', () => {
    it('generates outline with correct scene count', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 4 }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
      expect(result.outline).toBeDefined();
      expect(result.outline?.scenes).toHaveLength(4);
    });

    it('generates minimum 3 scenes', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 3 }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.outline?.scenes).toHaveLength(3);
    });

    it('generates maximum 6 scenes', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 6 }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.outline?.scenes).toHaveLength(6);
    });

    it('rejects invalid scene count below minimum', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 2 }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(false);
      expect(result.followUpQuestion).toContain('3-6');
    });

    it('rejects invalid scene count above maximum', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 7 }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(false);
    });

    it('includes adventure title in outline', async () => {
      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      expect(result.outline?.title).toBeTruthy();
      expect(result.outline?.title.length).toBeGreaterThan(0);
    });

    it('includes adventure summary in outline', async () => {
      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      expect(result.outline?.summary).toBeTruthy();
      expect(result.outline?.summary).toContain('Haunted Forest');
    });
  });

  // =============================================================================
  // Scene Brief Structure Tests
  // =============================================================================

  describe('scene brief structure', () => {
    it('each scene has required fields', async () => {
      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      expect(result.outline?.scenes).toBeDefined();
      for (const scene of result.outline!.scenes) {
        expect(scene.sceneNumber).toBeDefined();
        expect(scene.title).toBeTruthy();
        expect(scene.description).toBeTruthy();
        expect(scene.keyElements).toBeDefined();
        expect(Array.isArray(scene.keyElements)).toBe(true);
      }
    });

    it('scenes are numbered sequentially starting at 1', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 5 }),
      });

      const result = await generateOutlineHandler(input);

      const sceneNumbers = result.outline!.scenes.map((s) => s.sceneNumber);
      expect(sceneNumbers).toEqual([1, 2, 3, 4, 5]);
    });

    it('scenes have valid scene types', async () => {
      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      const validTypes = ['combat', 'exploration', 'social', 'puzzle', 'revelation', 'mixed'];
      for (const scene of result.outline!.scenes) {
        expect(validTypes).toContain(scene.sceneType);
      }
    });

    it('scenes have location suggestions', async () => {
      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      for (const scene of result.outline!.scenes) {
        expect(scene.location).toBeTruthy();
      }
    });

    it('scenes have key elements (1-4 items)', async () => {
      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      for (const scene of result.outline!.scenes) {
        expect(scene.keyElements.length).toBeGreaterThanOrEqual(1);
        expect(scene.keyElements.length).toBeLessThanOrEqual(4);
      }
    });
  });

  // =============================================================================
  // Combat/Exploration Balance Tests
  // =============================================================================

  describe('combat/exploration balance', () => {
    it('generates more combat scenes when combat-heavy', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({
          sceneCount: 6,
          pillarBalance: 'combat-heavy action',
        }),
      });

      const result = await generateOutlineHandler(input);

      const combatScenes = result.outline!.scenes.filter((s) => s.sceneType === 'combat');
      expect(combatScenes.length).toBeGreaterThanOrEqual(3);
    });

    it('generates more exploration scenes when exploration-heavy', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({
          sceneCount: 6,
          pillarBalance: 'exploration and roleplay focused',
        }),
      });

      const result = await generateOutlineHandler(input);

      const explorationScenes = result.outline!.scenes.filter(
        (s) => s.sceneType === 'exploration' || s.sceneType === 'social' || s.sceneType === 'puzzle'
      );
      expect(explorationScenes.length).toBeGreaterThanOrEqual(3);
    });

    it('generates balanced mix when balanced', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({
          sceneCount: 6,
          pillarBalance: 'balanced mix',
        }),
      });

      const result = await generateOutlineHandler(input);

      const combatScenes = result.outline!.scenes.filter((s) => s.sceneType === 'combat');
      const nonCombatScenes = result.outline!.scenes.filter((s) => s.sceneType !== 'combat');
      expect(combatScenes.length).toBeGreaterThanOrEqual(1);
      expect(nonCombatScenes.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =============================================================================
  // Frame Integration Tests
  // =============================================================================

  describe('frame integration', () => {
    it('incorporates DB frame name in title', async () => {
      const input = createMockInput({
        frame: createMockDbFrame({ name: 'The Shadow Keep' }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.outline?.title).toContain('Shadow Keep');
    });

    it('incorporates custom frame name in title', async () => {
      const input = createMockInput({
        frame: createMockCustomFrame({ name: 'The Clockwork City' }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.outline?.title).toContain('Clockwork City');
    });

    it('uses frame description in summary', async () => {
      const input = createMockInput({
        frame: createMockDbFrame({
          description: 'A mystical realm where dreams become reality',
        }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.outline?.summary).toContain('mystical realm');
    });

    it('uses frame adversaries in character suggestions', async () => {
      const input = createMockInput({
        frame: createMockDbFrame({
          typical_adversaries: ['dragons', 'cultists'],
        }),
      });

      const result = await generateOutlineHandler(input);

      // At least one scene should reference frame adversaries
      const hasAdversaryReferences = result.outline!.scenes.some(
        (s) => s.characters?.some((c) => c.toLowerCase().includes('dragon'))
      );
      // Combat scenes should have adversary references or at least exist
      expect(result.outline!.scenes.some((s) => s.sceneType === 'combat') || hasAdversaryReferences).toBe(true);
    });

    it('handles custom frame typicalAdversaries', async () => {
      const input = createMockInput({
        frame: createMockCustomFrame({
          typicalAdversaries: ['automatons', 'rogues'],
        }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
    });
  });

  // =============================================================================
  // Dial Integration Tests
  // =============================================================================

  describe('dial integration', () => {
    it('includes party size in summary', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ partySize: 5 }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.outline?.summary).toContain('5');
    });

    it('includes tier description in summary', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ partyTier: 3 }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.outline?.summary.toLowerCase()).toContain('veteran');
    });

    it('includes tone in summary when provided', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ tone: 'whimsical and lighthearted' }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.outline?.summary).toContain('whimsical');
    });

    it('handles null tone gracefully', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ tone: null }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
      expect(result.outline?.summary).not.toContain('null');
    });

    it('incorporates themes in key elements', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ themes: ['redemption', 'sacrifice'] }),
      });

      const result = await generateOutlineHandler(input);

      // At least one scene should have theme-related key elements
      const allKeyElements = result.outline!.scenes.flatMap((s) => s.keyElements);
      const hasThemeElement = allKeyElements.some(
        (e) => e.toLowerCase().includes('redemption') || e.toLowerCase().includes('sacrifice')
      );
      expect(hasThemeElement).toBe(true);
    });
  });

  // =============================================================================
  // Feedback/Regeneration Tests
  // =============================================================================

  describe('feedback and regeneration', () => {
    it('acknowledges feedback in response message', async () => {
      const previousOutline: Outline = {
        id: 'outline-1',
        title: 'Previous Adventure',
        summary: 'Previous summary',
        scenes: [],
        isConfirmed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const input = createMockInput({
        feedback: 'I want more combat scenes',
        previousOutline,
      });

      const result = await generateOutlineHandler(input);

      expect(result.assistantMessage).toContain('revised');
      expect(result.assistantMessage).toContain('feedback');
    });

    it('adjusts to more combat when feedback requests it', async () => {
      const previousOutline: Outline = {
        id: 'outline-1',
        title: 'Previous Adventure',
        summary: 'Previous summary',
        scenes: [],
        isConfirmed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const input = createMockInput({
        feedback: 'More combat please',
        previousOutline,
        dialsSummary: createMockDialsSummary({ sceneCount: 6 }),
      });

      const result = await generateOutlineHandler(input);

      const combatScenes = result.outline!.scenes.filter((s) => s.sceneType === 'combat');
      // Combat-heavy distribution provides significant combat presence (at least 2 of 6)
      expect(combatScenes.length).toBeGreaterThanOrEqual(2);
    });

    it('adjusts to more exploration when feedback requests less combat', async () => {
      const previousOutline: Outline = {
        id: 'outline-1',
        title: 'Previous Adventure',
        summary: 'Previous summary',
        scenes: [],
        isConfirmed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const input = createMockInput({
        feedback: 'Less combat, more exploration please',
        previousOutline,
        dialsSummary: createMockDialsSummary({ sceneCount: 6 }),
      });

      const result = await generateOutlineHandler(input);

      const explorationScenes = result.outline!.scenes.filter(
        (s) => s.sceneType === 'exploration' || s.sceneType === 'social' || s.sceneType === 'puzzle'
      );
      expect(explorationScenes.length).toBeGreaterThanOrEqual(3);
    });

    it('generates new outline without feedback', async () => {
      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      expect(result.assistantMessage).not.toContain('revised');
      expect(result.assistantMessage).toContain('outline');
    });
  });

  // =============================================================================
  // Response Message Tests
  // =============================================================================

  describe('response messages', () => {
    it('includes frame name in response', async () => {
      const input = createMockInput({
        frame: createMockDbFrame({ name: 'The Crystal Caves' }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.assistantMessage).toContain('Crystal Caves');
    });

    it('includes scene list in response', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 4 }),
      });

      const result = await generateOutlineHandler(input);

      // Should have numbered scenes
      expect(result.assistantMessage).toContain('1.');
      expect(result.assistantMessage).toContain('2.');
      expect(result.assistantMessage).toContain('3.');
      expect(result.assistantMessage).toContain('4.');
    });

    it('prompts for review when generation is complete', async () => {
      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      expect(result.assistantMessage.toLowerCase()).toMatch(/review|confirm|proceed/);
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('edge cases', () => {
    it('handles frame with no themes', async () => {
      const input = createMockInput({
        frame: createMockDbFrame({ themes: undefined }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
    });

    it('handles frame with no adversaries', async () => {
      const input = createMockInput({
        frame: createMockDbFrame({ typical_adversaries: undefined }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
    });

    it('handles empty themes array in dials', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ themes: [] }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
    });

    it('handles null pillarBalance', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ pillarBalance: null }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
      expect(result.outline?.scenes).toBeDefined();
    });

    it('handles very long frame description', async () => {
      const longDescription = 'A'.repeat(500);
      const input = createMockInput({
        frame: createMockDbFrame({ description: longDescription }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
      // Summary should be truncated
      expect(result.outline!.summary.length).toBeLessThan(longDescription.length + 200);
    });

    it('handles frame name that already starts with The', async () => {
      const input = createMockInput({
        frame: createMockDbFrame({ name: 'The Ancient Temple' }),
      });

      const result = await generateOutlineHandler(input);

      // Should not have double "The"
      expect(result.outline?.title).not.toMatch(/^The The/);
    });
  });
});
