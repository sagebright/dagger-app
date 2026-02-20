/**
 * Tests for state-serializer.ts
 *
 * Verifies serializeForLLM produces correct output for:
 * - Empty state
 * - Mid-Weaving state (spark + components + frame + scene arcs)
 * - Full Inscribing state (active scene with all 9 sections)
 * - Tiered context inclusion by stage
 * - Character budget truncation
 */

import { describe, it, expect } from 'vitest';
import { serializeForLLM } from './state-serializer.js';
import type { AdventureState } from '@sage-codex/shared-types';
import { createEmptyAdventureState } from '@sage-codex/shared-types';

// =============================================================================
// Fixtures
// =============================================================================

function createMidWeavingState(): AdventureState {
  const state = createEmptyAdventureState();
  state.stage = 'weaving';
  state.spark = {
    name: 'The Hollow Vigil',
    vision: 'A dark fantasy adventure about a corrupted monastery',
  };
  state.components = {
    span: '3-4 hours',
    scenes: 4,
    members: 4,
    tier: 2,
    tenor: 'serious',
    pillars: 'interwoven',
    chorus: 'moderate',
    threads: ['redemption-sacrifice', 'power-corruption'],
    confirmedComponents: ['span', 'scenes', 'members', 'tier', 'tenor', 'pillars', 'chorus', 'threads'],
  };
  state.frame = {
    id: 'frame-001',
    name: 'The Hollow Vigil',
    description: 'A cursed monastery adventure',
    themes: ['corruption', 'redemption'],
    typicalAdversaries: ['undead', 'cultist'],
    lore: 'Once a beacon of healing',
    isCustom: false,
  };
  state.sceneArcs = [
    {
      id: 'arc-1',
      sceneNumber: 1,
      title: 'Arrival at the Monastery',
      description: 'The party approaches the monastery as evening falls.',
      keyElements: ['crumbling walls', 'silent bell tower'],
      location: 'Monastery Entrance',
      sceneType: 'exploration',
    },
    {
      id: 'arc-2',
      sceneNumber: 2,
      title: 'The Shattered Nave',
      description: 'Inside the monastery, signs of corruption are everywhere.',
      keyElements: ['broken altar', 'shadow whispers'],
      location: 'Main Nave',
      sceneType: 'social',
    },
  ];
  return state;
}

function createFullInscribingState(): AdventureState {
  const state = createMidWeavingState();
  state.stage = 'inscribing';
  state.inscribedScenes = [
    {
      arcId: 'arc-1',
      sceneNumber: 1,
      title: 'Arrival at the Monastery',
      introduction: 'As twilight settles over the valley...',
      keyMoments: [
        { title: 'The Silent Approach', description: 'The party notices the unnatural silence.' },
      ],
      resolution: 'The party must decide whether to enter.',
      npcs: [
        { name: 'Brother Aldric', role: 'quest-giver', description: 'A weathered monk.', sceneId: 'arc-1' },
      ],
      adversaries: [
        { name: 'Shadow Sentinel', type: 'undead', tier: 2, sceneId: 'arc-1', notes: 'Guards the entrance.' },
      ],
      items: [
        { name: 'Aldric\'s Holy Symbol', description: 'A cracked holy symbol.', suggestedTier: 2, sceneId: 'arc-1' },
      ],
      portents: [
        { category: 'Omens', entries: ['The bell tolls at midnight', 'Shadows lengthen unnaturally'] },
      ],
      tierGuidance: 'At Tier 2, environmental threats should feel ominous.',
      toneNotes: 'Maintain an atmosphere of creeping dread.',
      status: 'draft',
    },
    {
      arcId: 'arc-2',
      sceneNumber: 2,
      title: 'The Shattered Nave',
      introduction: 'The nave stretches before you...',
      keyMoments: [],
      resolution: 'Dialogue with the corrupted monk.',
      npcs: [],
      adversaries: [],
      items: [],
      portents: [],
      tierGuidance: '',
      toneNotes: '',
      status: 'confirmed',
    },
  ];
  return state;
}

// =============================================================================
// Tests
// =============================================================================

describe('serializeForLLM', () => {
  describe('empty state', () => {
    it('should produce empty text for empty state at invoking', () => {
      const state = createEmptyAdventureState();
      const result = serializeForLLM(state, 'invoking');
      expect(result.text).toBe('');
      expect(result.characterCount).toBe(0);
    });

    it('should include no tiers for empty state', () => {
      const state = createEmptyAdventureState();
      const result = serializeForLLM(state, 'invoking');
      expect(result.tiersIncluded).toEqual([]);
    });
  });

  describe('mid-Weaving state', () => {
    it('should include T1 (spark, components, frame)', () => {
      const state = createMidWeavingState();
      const result = serializeForLLM(state, 'weaving');
      expect(result.tiersIncluded).toContain('T1');
    });

    it('should include T3 (outline) during weaving', () => {
      const state = createMidWeavingState();
      const result = serializeForLLM(state, 'weaving');
      expect(result.tiersIncluded).toContain('T3');
    });

    it('should serialize spark name and vision', () => {
      const state = createMidWeavingState();
      const result = serializeForLLM(state, 'weaving');
      expect(result.text).toContain('The Hollow Vigil');
      expect(result.text).toContain('corrupted monastery');
    });

    it('should serialize component values', () => {
      const state = createMidWeavingState();
      const result = serializeForLLM(state, 'weaving');
      expect(result.text).toContain('Tier: 2');
      expect(result.text).toContain('Tenor: serious');
      expect(result.text).toContain('Threads: redemption-sacrifice, power-corruption');
    });

    it('should serialize frame name and themes', () => {
      const state = createMidWeavingState();
      const result = serializeForLLM(state, 'weaving');
      expect(result.text).toContain('Frame: "The Hollow Vigil"');
      expect(result.text).toContain('Themes: corruption, redemption');
    });

    it('should serialize scene arc briefs in outline', () => {
      const state = createMidWeavingState();
      const result = serializeForLLM(state, 'weaving');
      expect(result.text).toContain('Arrival at the Monastery');
      expect(result.text).toContain('The Shattered Nave');
      expect(result.text).toContain('exploration');
    });

    it('should NOT include T2 during weaving', () => {
      const state = createMidWeavingState();
      const result = serializeForLLM(state, 'weaving');
      expect(result.tiersIncluded).not.toContain('T2');
    });
  });

  describe('full Inscribing state', () => {
    it('should include T1, T2, and T3', () => {
      const state = createFullInscribingState();
      const result = serializeForLLM(state, 'inscribing', { activeSceneId: 'arc-1' });
      expect(result.tiersIncluded).toContain('T1');
      expect(result.tiersIncluded).toContain('T2');
      expect(result.tiersIncluded).toContain('T3');
    });

    it('should serialize active scene with full detail', () => {
      const state = createFullInscribingState();
      const result = serializeForLLM(state, 'inscribing', { activeSceneId: 'arc-1' });
      expect(result.text).toContain('As twilight settles');
      expect(result.text).toContain('Brother Aldric');
      expect(result.text).toContain('Shadow Sentinel');
      expect(result.text).toContain('Aldric\'s Holy Symbol');
      expect(result.text).toContain('Omens');
    });

    it('should serialize confirmed scenes as compressed briefs', () => {
      const state = createFullInscribingState();
      const result = serializeForLLM(state, 'inscribing', { activeSceneId: 'arc-1' });
      expect(result.text).toContain('[confirmed]');
      expect(result.text).toContain('The Shattered Nave');
    });

    it('should NOT include active scene in T3 compressed section', () => {
      const state = createFullInscribingState();
      const result = serializeForLLM(state, 'inscribing', { activeSceneId: 'arc-1' });
      // The active scene text appears in T2 but not in the "Confirmed Scenes" section
      const confirmedSection = result.text.split('Confirmed Scenes:')[1] ?? '';
      expect(confirmedSection).not.toContain('Arrival at the Monastery');
    });
  });

  describe('character budget', () => {
    it('should truncate when exceeding maxCharacters', () => {
      const state = createFullInscribingState();
      const result = serializeForLLM(state, 'inscribing', {
        activeSceneId: 'arc-1',
        maxCharacters: 100,
      });
      expect(result.characterCount).toBeLessThanOrEqual(100);
      expect(result.text.endsWith('...')).toBe(true);
    });
  });

  describe('stage-based tier inclusion', () => {
    it('should only include T1 during attuning', () => {
      const state = createMidWeavingState();
      const result = serializeForLLM(state, 'attuning');
      expect(result.tiersIncluded).toContain('T1');
      expect(result.tiersIncluded).not.toContain('T2');
      expect(result.tiersIncluded).not.toContain('T3');
    });

    it('should include T1 and T3 during delivering', () => {
      const state = createFullInscribingState();
      const result = serializeForLLM(state, 'delivering');
      expect(result.tiersIncluded).toContain('T1');
      expect(result.tiersIncluded).toContain('T3');
      expect(result.tiersIncluded).not.toContain('T2');
    });
  });
});
