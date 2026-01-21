/**
 * generateScene MCP Tool Tests
 *
 * Tests for the scene generation tool that creates full scene content
 * from scene briefs with draft-revise workflow support.
 */

import { describe, it, expect } from 'vitest';
import {
  generateSceneHandler,
  GENERATE_SCENE_SCHEMA,
  type GenerateSceneInput,
} from './generateScene.js';
import type { SceneBrief, SelectedFrame, Outline } from '@dagger-app/shared-types';

// =============================================================================
// Test Data
// =============================================================================

const mockFrame: SelectedFrame = {
  id: 'frame-1',
  name: 'The Hollow Vigil',
  description: 'A haunted keep where spirits guard ancient secrets.',
  themes: ['horror', 'mystery'],
  lore: 'Long ago, the Vigil fell to darkness...',
  typicalAdversaries: ['Wraith', 'Specter', 'Corrupted Knight'],
  isCustom: true,
};

const mockSceneBrief: SceneBrief = {
  id: 'scene-1',
  sceneNumber: 1,
  title: 'The Approaching Darkness',
  description: 'The party discovers a mysterious location shrouded in mist.',
  keyElements: ['Perception checks', 'Environmental hazards', 'Discovery moments'],
  location: 'Ancient ruins entrance',
  characters: ['Local guide', 'Wildlife'],
  sceneType: 'exploration',
};

const mockOutline: Outline = {
  id: 'outline-1',
  title: 'Into The Hollow Vigil',
  summary: 'An adventure for 4 experienced heroes...',
  scenes: [mockSceneBrief],
  isConfirmed: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockDialsSummary = {
  partySize: 4,
  partyTier: 2 as const,
  sceneCount: 4,
  sessionLength: '3-4 hours',
  tone: 'mysterious and haunting',
  themes: ['horror', 'mystery'],
  pillarBalance: 'balanced',
  lethality: 'moderate',
};

// =============================================================================
// Schema Tests
// =============================================================================

describe('GENERATE_SCENE_SCHEMA', () => {
  it('has valid description', () => {
    expect(GENERATE_SCENE_SCHEMA.description).toBeDefined();
    expect(GENERATE_SCENE_SCHEMA.description).toContain('scene');
  });

  it('has required input properties', () => {
    const inputSchema = GENERATE_SCENE_SCHEMA.inputSchema;
    expect(inputSchema).toBeDefined();

    const properties = inputSchema?.properties ?? {};
    const required = inputSchema?.required ?? [];

    expect(required).toContain('sceneBrief');
    expect(required).toContain('frame');
    expect(required).toContain('outline');
    expect(required).toContain('dialsSummary');

    expect(properties.sceneBrief).toBeDefined();
    expect(properties.frame).toBeDefined();
    expect(properties.outline).toBeDefined();
    expect(properties.dialsSummary).toBeDefined();
    expect(properties.feedback).toBeDefined();
    expect(properties.previousDraft).toBeDefined();
  });
});

// =============================================================================
// Handler Tests - Basic Generation
// =============================================================================

describe('generateSceneHandler', () => {
  describe('basic scene generation', () => {
    it('generates a scene draft from scene brief', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: mockSceneBrief,
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
      };

      const result = await generateSceneHandler(input);

      expect(result).toBeDefined();
      expect(result.assistantMessage).toBeDefined();
      expect(result.assistantMessage.length).toBeGreaterThan(50);
      expect(result.isComplete).toBe(true);
    });

    it('generates scene with all required sections', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: mockSceneBrief,
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft).toBeDefined();
      expect(result.sceneDraft?.title).toBeDefined();
      expect(result.sceneDraft?.introduction).toBeDefined();
      expect(result.sceneDraft?.keyMoments).toBeDefined();
      expect(result.sceneDraft?.keyMoments.length).toBeGreaterThan(0);
    });

    it('includes extracted entities for later phases', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: { ...mockSceneBrief, sceneType: 'combat' },
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft?.extractedEntities).toBeDefined();
      expect(result.sceneDraft?.extractedEntities?.npcs).toBeDefined();
      expect(result.sceneDraft?.extractedEntities?.adversaries).toBeDefined();
      expect(result.sceneDraft?.extractedEntities?.items).toBeDefined();
    });

    it('generates tier-appropriate content', async () => {
      const tier1Input: GenerateSceneInput = {
        sceneBrief: mockSceneBrief,
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: { ...mockDialsSummary, partyTier: 1 },
      };

      const tier4Input: GenerateSceneInput = {
        sceneBrief: mockSceneBrief,
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: { ...mockDialsSummary, partyTier: 4 },
      };

      const tier1Result = await generateSceneHandler(tier1Input);
      const tier4Result = await generateSceneHandler(tier4Input);

      // Results should both be valid
      expect(tier1Result.sceneDraft).toBeDefined();
      expect(tier4Result.sceneDraft).toBeDefined();

      // Tier info should be reflected in content
      expect(tier1Result.sceneDraft?.tierGuidance).toBeDefined();
      expect(tier4Result.sceneDraft?.tierGuidance).toBeDefined();
    });
  });

  // ===========================================================================
  // Scene Type Specific Generation
  // ===========================================================================

  describe('scene type specific content', () => {
    it('generates combat-focused content for combat scenes', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: { ...mockSceneBrief, sceneType: 'combat' },
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft?.combatNotes).toBeDefined();
      expect(result.sceneDraft?.extractedEntities?.adversaries?.length).toBeGreaterThan(0);
    });

    it('generates exploration content for exploration scenes', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: { ...mockSceneBrief, sceneType: 'exploration' },
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft?.environmentDetails).toBeDefined();
      expect(result.sceneDraft?.discoveryOpportunities).toBeDefined();
    });

    it('generates social content for social scenes', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: { ...mockSceneBrief, sceneType: 'social' },
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft?.extractedEntities?.npcs?.length).toBeGreaterThan(0);
      expect(result.sceneDraft?.socialChallenges).toBeDefined();
    });

    it('generates puzzle content for puzzle scenes', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: { ...mockSceneBrief, sceneType: 'puzzle' },
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft?.puzzleDetails).toBeDefined();
    });

    it('generates revelation content for revelation scenes', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: { ...mockSceneBrief, sceneType: 'revelation' },
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft?.revelationContent).toBeDefined();
    });
  });

  // ===========================================================================
  // Feedback and Revision
  // ===========================================================================

  describe('feedback handling', () => {
    const mockPreviousDraft = {
      sceneId: 'scene-1',
      sceneNumber: 1,
      title: 'The Approaching Darkness',
      introduction: 'Original introduction text...',
      keyMoments: [{ title: 'Moment 1', description: 'Description 1' }],
      resolution: 'Original resolution...',
      tierGuidance: 'Tier guidance...',
      extractedEntities: {
        npcs: [],
        adversaries: [],
        items: [],
      },
    };

    it('incorporates user feedback into revision', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: mockSceneBrief,
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
        feedback: 'Add more tension and make it darker',
        previousDraft: mockPreviousDraft,
      };

      const result = await generateSceneHandler(input);

      expect(result.assistantMessage).toContain('revised');
      expect(result.isComplete).toBe(true);
      expect(result.sceneDraft).toBeDefined();
    });

    it('handles specific element feedback', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: mockSceneBrief,
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
        feedback: 'Add more NPCs to interact with',
        previousDraft: mockPreviousDraft,
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft?.extractedEntities?.npcs?.length).toBeGreaterThan(
        mockPreviousDraft.extractedEntities.npcs.length
      );
    });

    it('preserves scene continuity on revision', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: mockSceneBrief,
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
        feedback: 'Make the introduction shorter',
        previousDraft: mockPreviousDraft,
      };

      const result = await generateSceneHandler(input);

      // Scene number should be preserved
      expect(result.sceneDraft?.sceneNumber).toBe(mockPreviousDraft.sceneNumber);
      // Title should be preserved
      expect(result.sceneDraft?.title).toBe(mockPreviousDraft.title);
    });
  });

  // ===========================================================================
  // Entity Extraction
  // ===========================================================================

  describe('entity extraction', () => {
    it('extracts NPCs with names and descriptions', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: { ...mockSceneBrief, sceneType: 'social' },
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
      };

      const result = await generateSceneHandler(input);
      const npcs = result.sceneDraft?.extractedEntities?.npcs;

      expect(npcs).toBeDefined();
      if (npcs && npcs.length > 0) {
        expect(npcs[0].name).toBeDefined();
        expect(npcs[0].role).toBeDefined();
      }
    });

    it('extracts adversaries with type info', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: { ...mockSceneBrief, sceneType: 'combat' },
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
      };

      const result = await generateSceneHandler(input);
      const adversaries = result.sceneDraft?.extractedEntities?.adversaries;

      expect(adversaries).toBeDefined();
      if (adversaries && adversaries.length > 0) {
        expect(adversaries[0].name).toBeDefined();
        expect(adversaries[0].type).toBeDefined();
      }
    });

    it('extracts items with tier appropriateness', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: mockSceneBrief,
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: { ...mockDialsSummary, partyTier: 2 },
      };

      const result = await generateSceneHandler(input);
      const items = result.sceneDraft?.extractedEntities?.items;

      expect(items).toBeDefined();
      if (items && items.length > 0) {
        expect(items[0].name).toBeDefined();
        expect(items[0].suggestedTier).toBeDefined();
        expect(items[0].suggestedTier).toBeLessThanOrEqual(2);
      }
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('handles missing optional fields gracefully', async () => {
      const minimalBrief: SceneBrief = {
        id: 'scene-minimal',
        sceneNumber: 1,
        title: 'Minimal Scene',
        description: 'A basic scene.',
        keyElements: [],
      };

      const input: GenerateSceneInput = {
        sceneBrief: minimalBrief,
        frame: mockFrame,
        outline: { ...mockOutline, scenes: [minimalBrief] },
        dialsSummary: mockDialsSummary,
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft).toBeDefined();
      expect(result.isComplete).toBe(true);
    });

    it('handles empty feedback gracefully', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: mockSceneBrief,
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
        feedback: '',
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft).toBeDefined();
      expect(result.isComplete).toBe(true);
    });

    it('handles very long feedback', async () => {
      const longFeedback = 'Please add more detail. '.repeat(50);

      const input: GenerateSceneInput = {
        sceneBrief: mockSceneBrief,
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: mockDialsSummary,
        feedback: longFeedback,
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft).toBeDefined();
      expect(result.isComplete).toBe(true);
    });

    it('handles climactic scene (last scene)', async () => {
      const climacticBrief: SceneBrief = {
        ...mockSceneBrief,
        sceneNumber: 4,
        sceneType: 'mixed',
        title: 'The Final Reckoning',
      };

      const fullOutline: Outline = {
        ...mockOutline,
        scenes: [
          mockSceneBrief,
          { ...mockSceneBrief, sceneNumber: 2, id: 'scene-2' },
          { ...mockSceneBrief, sceneNumber: 3, id: 'scene-3' },
          climacticBrief,
        ],
      };

      const input: GenerateSceneInput = {
        sceneBrief: climacticBrief,
        frame: mockFrame,
        outline: fullOutline,
        dialsSummary: { ...mockDialsSummary, sceneCount: 4 },
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft?.isClimactic).toBe(true);
    });
  });

  // ===========================================================================
  // Tone Application
  // ===========================================================================

  describe('tone application', () => {
    it('applies dark tone to scene content', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: mockSceneBrief,
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: { ...mockDialsSummary, tone: 'dark and foreboding' },
      };

      const result = await generateSceneHandler(input);

      // Tone should influence the output
      expect(result.sceneDraft?.toneNotes).toBeDefined();
      expect(result.assistantMessage).toBeDefined();
    });

    it('applies light tone to scene content', async () => {
      const input: GenerateSceneInput = {
        sceneBrief: mockSceneBrief,
        frame: mockFrame,
        outline: mockOutline,
        dialsSummary: { ...mockDialsSummary, tone: 'light and adventurous' },
      };

      const result = await generateSceneHandler(input);

      expect(result.sceneDraft?.toneNotes).toBeDefined();
    });
  });
});
