/**
 * Tests for version-history.ts
 *
 * Verifies:
 * - pushVersion adds entries to the stack
 * - pushVersion enforces max 10 entries
 * - popVersion returns the most recent entry
 * - popVersion returns failure when no history
 * - applyUndo restores top-level sections
 * - applyUndo restores scene sections
 * - parseSectionPath correctly parses all path types
 */

import { describe, it, expect } from 'vitest';
import {
  pushVersion,
  popVersion,
  applyUndo,
  parseSectionPath,
  getVersionHistory,
  getVersionCount,
} from './version-history.js';
import { createEmptyAdventureState } from '@sage-codex/shared-types';
import type { AdventureState, SectionPath } from '@sage-codex/shared-types';

// =============================================================================
// Helpers
// =============================================================================

function createStateWithSpark(): AdventureState {
  const state = createEmptyAdventureState();
  state.spark = { name: 'Test Adventure', vision: 'A test vision' };
  return state;
}

function createStateWithScene(): AdventureState {
  const state = createEmptyAdventureState();
  state.inscribedScenes = [
    {
      arcId: 'arc-1',
      sceneNumber: 1,
      title: 'Test Scene',
      introduction: 'Original introduction',
      keyMoments: [],
      resolution: '',
      npcs: [],
      adversaries: [],
      items: [],
      portents: [],
      tierGuidance: '',
      toneNotes: '',
      status: 'draft',
    },
  ];
  return state;
}

// =============================================================================
// Tests
// =============================================================================

describe('pushVersion', () => {
  it('should add an entry to the version history stack', () => {
    const state = createEmptyAdventureState();
    pushVersion({
      state,
      sectionPath: 'spark',
      previousValue: null,
      description: 'Initial push',
    });

    const history = getVersionHistory(state, 'spark');
    expect(history).toHaveLength(1);
    expect(history[0].value).toBeNull();
    expect(history[0].description).toBe('Initial push');
  });

  it('should preserve multiple entries in order', () => {
    const state = createEmptyAdventureState();
    pushVersion({ state, sectionPath: 'spark', previousValue: 'first' });
    pushVersion({ state, sectionPath: 'spark', previousValue: 'second' });
    pushVersion({ state, sectionPath: 'spark', previousValue: 'third' });

    const history = getVersionHistory(state, 'spark');
    expect(history).toHaveLength(3);
    expect(history[0].value).toBe('first');
    expect(history[2].value).toBe('third');
  });

  it('should enforce max 10 entries by dropping oldest', () => {
    const state = createEmptyAdventureState();
    for (let i = 0; i < 15; i++) {
      pushVersion({ state, sectionPath: 'spark', previousValue: `entry-${i}` });
    }

    const history = getVersionHistory(state, 'spark');
    expect(history).toHaveLength(10);
    // Oldest entries (0-4) should be dropped
    expect(history[0].value).toBe('entry-5');
    expect(history[9].value).toBe('entry-14');
  });

  it('should deep-clone the previous value', () => {
    const state = createEmptyAdventureState();
    const originalSpark = { name: 'Before', vision: 'Original' };
    pushVersion({ state, sectionPath: 'spark', previousValue: originalSpark });

    // Mutate the original — stored version should be unaffected
    originalSpark.name = 'Mutated';

    const history = getVersionHistory(state, 'spark');
    expect((history[0].value as { name: string }).name).toBe('Before');
  });

  it('should include a timestamp', () => {
    const state = createEmptyAdventureState();
    pushVersion({ state, sectionPath: 'spark', previousValue: null });

    const history = getVersionHistory(state, 'spark');
    expect(history[0].timestamp).toBeTruthy();
    expect(new Date(history[0].timestamp).getTime()).not.toBeNaN();
  });
});

describe('popVersion', () => {
  it('should return the most recent entry', () => {
    const state = createEmptyAdventureState();
    pushVersion({ state, sectionPath: 'spark', previousValue: 'old' });
    pushVersion({ state, sectionPath: 'spark', previousValue: 'newer' });

    const result = popVersion(state, 'spark');
    expect(result.success).toBe(true);
    expect(result.restoredValue).toBe('newer');
    expect(result.remainingEntries).toBe(1);
  });

  it('should return failure when no history exists', () => {
    const state = createEmptyAdventureState();
    const result = popVersion(state, 'spark');
    expect(result.success).toBe(false);
    expect(result.error).toContain('No version history');
  });

  it('should remove the popped entry from the stack', () => {
    const state = createEmptyAdventureState();
    pushVersion({ state, sectionPath: 'spark', previousValue: 'only-one' });

    popVersion(state, 'spark');
    const count = getVersionCount(state, 'spark');
    expect(count).toBe(0);
  });
});

describe('applyUndo', () => {
  it('should restore spark to its previous value', () => {
    const state = createStateWithSpark();

    // Push current value before updating
    pushVersion({ state, sectionPath: 'spark', previousValue: state.spark });

    // Simulate an update
    state.spark = { name: 'Updated Adventure', vision: 'Updated vision' };

    // Undo
    const result = applyUndo(state, 'spark');
    expect(result.success).toBe(true);
    expect(state.spark?.name).toBe('Test Adventure');
    expect(state.spark?.vision).toBe('A test vision');
  });

  it('should restore components to their previous value', () => {
    const state = createEmptyAdventureState();
    const originalComponents = { ...state.components };
    pushVersion({ state, sectionPath: 'components', previousValue: originalComponents });

    state.components.tier = 3;
    state.components.tenor = 'grim';

    const result = applyUndo(state, 'components');
    expect(result.success).toBe(true);
    expect(state.components.tier).toBeNull();
    expect(state.components.tenor).toBeNull();
  });

  it('should restore a scene section to its previous value', () => {
    const state = createStateWithScene();
    const path: SectionPath = 'scene:arc-1:introduction';

    pushVersion({ state, sectionPath: path, previousValue: 'Original introduction' });
    state.inscribedScenes[0].introduction = 'Updated introduction';

    const result = applyUndo(state, path);
    expect(result.success).toBe(true);
    expect(state.inscribedScenes[0].introduction).toBe('Original introduction');
  });

  it('should return failure when no history exists', () => {
    const state = createEmptyAdventureState();
    const result = applyUndo(state, 'spark');
    expect(result.success).toBe(false);
  });
});

describe('parseSectionPath', () => {
  it('should parse top-level paths', () => {
    expect(parseSectionPath('spark')).toEqual({ type: 'top-level', key: 'spark' });
    expect(parseSectionPath('components')).toEqual({ type: 'top-level', key: 'components' });
    expect(parseSectionPath('frame')).toEqual({ type: 'top-level', key: 'frame' });
    expect(parseSectionPath('sceneArcs')).toEqual({ type: 'top-level', key: 'sceneArcs' });
  });

  it('should parse scene section paths', () => {
    const result = parseSectionPath('scene:arc-1:introduction');
    expect(result).toEqual({
      type: 'scene',
      arcId: 'arc-1',
      section: 'introduction',
    });
  });

  it('should handle various scene sections', () => {
    const sections = [
      'introduction', 'keyMoments', 'resolution',
      'npcs', 'adversaries', 'items',
      'portents', 'tierGuidance', 'toneNotes',
    ];
    for (const section of sections) {
      const path = `scene:test-arc:${section}` as SectionPath;
      const result = parseSectionPath(path);
      expect(result.type).toBe('scene');
      if (result.type === 'scene') {
        expect(result.section).toBe(section);
      }
    }
  });
});

describe('getVersionCount', () => {
  it('should return 0 for sections with no history', () => {
    const state = createEmptyAdventureState();
    expect(getVersionCount(state, 'spark')).toBe(0);
  });

  it('should return correct count after pushes', () => {
    const state = createEmptyAdventureState();
    pushVersion({ state, sectionPath: 'spark', previousValue: 'a' });
    pushVersion({ state, sectionPath: 'spark', previousValue: 'b' });
    expect(getVersionCount(state, 'spark')).toBe(2);
  });
});
