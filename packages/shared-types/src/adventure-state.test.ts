/**
 * Tests for mergeWithDefaults — ensures partial server state
 * is safely merged with complete defaults to prevent crashes.
 */

import { describe, it, expect } from 'vitest';
import {
  createEmptyAdventureState,
  mergeWithDefaults,
} from './adventure-state.js';
import type { AdventureState } from './adventure-state.js';

describe('mergeWithDefaults', () => {
  it('fills missing components with defaults', () => {
    const result = mergeWithDefaults({ stage: 'attuning' });

    expect(result.components).toBeDefined();
    expect(result.components.confirmedComponents).toEqual([]);
    expect(result.components.threads).toEqual([]);
    expect(result.components.span).toBeNull();
  });

  it('preserves partial components and fills rest with defaults', () => {
    const result = mergeWithDefaults({
      components: { span: '3 sessions' } as never,
    });

    expect(result.components.span).toBe('3 sessions');
    expect(result.components.confirmedComponents).toEqual([]);
    expect(result.components.tier).toBeNull();
    expect(result.components.threads).toEqual([]);
  });

  it('returns complete state from empty object', () => {
    const result = mergeWithDefaults({});
    const expected = createEmptyAdventureState();

    expect(result).toEqual(expected);
  });

  it('passes through a complete state unchanged', () => {
    const complete: AdventureState = {
      stage: 'weaving',
      spark: { name: 'Test', vision: 'A test adventure' },
      components: {
        span: '2 sessions',
        scenes: 4,
        members: 3,
        tier: 2,
        tenor: 'heroic',
        pillars: 'exploration',
        chorus: 'hopeful',
        threads: ['thread1'],
        confirmedComponents: ['span', 'scenes'],
      },
      frame: null,
      sceneArcs: [{ id: 'arc-1', sceneNumber: 1, title: 'Opening', description: 'Start', keyElements: [], location: 'Town', sceneType: 'exploration' }],
      inscribedScenes: [],
      inscribingSections: {},
      versionHistory: { spark: [] },
      adventureName: 'Test Adventure',
    };

    const result = mergeWithDefaults(complete);

    expect(result).toEqual(complete);
  });

  it('defaults missing arrays to empty', () => {
    const result = mergeWithDefaults({
      stage: 'binding',
      sceneArcs: undefined,
      inscribedScenes: undefined,
    });

    expect(result.sceneArcs).toEqual([]);
    expect(result.inscribedScenes).toEqual([]);
    expect(result.versionHistory).toEqual({});
  });
});
