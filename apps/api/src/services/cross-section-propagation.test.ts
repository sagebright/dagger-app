/**
 * Tests for cross-section-propagation service
 *
 * Verifies:
 * - Deterministic propagation: renames propagate across all sections
 * - Semantic propagation: motivation/role changes produce LLM update hints
 * - Propagation trigger detection: classifies change types correctly
 * - Section collection: gathers all sections for a scene
 * - Edge cases: no matching sections, empty scenes, same name
 */

import { describe, it, expect } from 'vitest';
import {
  detectPropagationType,
  buildDeterministicPropagation,
  buildSemanticPropagationHint,
  type PropagationType,
  type EntityChange,
  type DeterministicPropagationResult,
  type SemanticPropagationHint,
} from './cross-section-propagation.js';
import type { SectionContent } from './deterministic-replace.js';

// =============================================================================
// detectPropagationType
// =============================================================================

describe('detectPropagationType', () => {
  it('returns "deterministic" for name-only changes', () => {
    const change: EntityChange = {
      entityType: 'npc',
      entityId: 'npc-1',
      changeType: 'rename',
      oldValue: 'Aldric',
      newValue: 'Theron',
    };

    expect(detectPropagationType(change)).toBe('deterministic');
  });

  it('returns "semantic" for motivation changes', () => {
    const change: EntityChange = {
      entityType: 'npc',
      entityId: 'npc-1',
      changeType: 'motivation',
      oldValue: 'Protect the village',
      newValue: 'Betray the village for gold',
    };

    expect(detectPropagationType(change)).toBe('semantic');
  });

  it('returns "semantic" for role changes', () => {
    const change: EntityChange = {
      entityType: 'npc',
      entityId: 'npc-1',
      changeType: 'role',
      oldValue: 'ally',
      newValue: 'antagonist',
    };

    expect(detectPropagationType(change)).toBe('semantic');
  });

  it('returns "semantic" for description changes', () => {
    const change: EntityChange = {
      entityType: 'npc',
      entityId: 'npc-1',
      changeType: 'description',
      oldValue: 'A kindly elder',
      newValue: 'A sinister warlock',
    };

    expect(detectPropagationType(change)).toBe('semantic');
  });

  it('returns "both" for combined rename + role change', () => {
    const change: EntityChange = {
      entityType: 'npc',
      entityId: 'npc-1',
      changeType: 'rename_and_role',
      oldValue: 'Aldric',
      newValue: 'Theron',
      additionalChanges: { role: { old: 'ally', new: 'antagonist' } },
    };

    expect(detectPropagationType(change)).toBe('both');
  });

  it('returns "none" when old and new values are identical', () => {
    const change: EntityChange = {
      entityType: 'npc',
      entityId: 'npc-1',
      changeType: 'rename',
      oldValue: 'Aldric',
      newValue: 'Aldric',
    };

    expect(detectPropagationType(change)).toBe('none');
  });
});

// =============================================================================
// buildDeterministicPropagation
// =============================================================================

describe('buildDeterministicPropagation', () => {
  const sections: SectionContent[] = [
    {
      sectionId: 'setup',
      content: 'Aldric stands at the gate, welcoming travelers.',
    },
    {
      sectionId: 'developments',
      content: 'Aldric reveals a hidden passage behind the altar.',
    },
    {
      sectionId: 'transitions',
      content: 'The party continues north without stopping.',
    },
    {
      sectionId: 'gm_notes',
      content: 'If Aldric survives, he may appear in a future scene.',
    },
  ];

  it('returns updated sections with name replacements', () => {
    const result = buildDeterministicPropagation(
      sections,
      'Aldric',
      'Theron'
    );

    expect(result.updatedSections).toHaveLength(3);
    expect(result.totalReplacements).toBe(3);
  });

  it('includes the correct section IDs that were updated', () => {
    const result = buildDeterministicPropagation(
      sections,
      'Aldric',
      'Theron'
    );

    const updatedIds = result.updatedSections.map((s) => s.sectionId);
    expect(updatedIds).toContain('setup');
    expect(updatedIds).toContain('developments');
    expect(updatedIds).toContain('gm_notes');
    expect(updatedIds).not.toContain('transitions');
  });

  it('correctly replaces names in the updated content', () => {
    const result = buildDeterministicPropagation(
      sections,
      'Aldric',
      'Theron'
    );

    const setupSection = result.updatedSections.find(
      (s) => s.sectionId === 'setup'
    );
    expect(setupSection?.updatedContent).toBe(
      'Theron stands at the gate, welcoming travelers.'
    );
  });

  it('returns empty results when name is not found', () => {
    const result = buildDeterministicPropagation(
      sections,
      'Zephyr',
      'Storm'
    );

    expect(result.updatedSections).toHaveLength(0);
    expect(result.totalReplacements).toBe(0);
  });

  it('skips the originating section when excludeSectionId is provided', () => {
    const result = buildDeterministicPropagation(
      sections,
      'Aldric',
      'Theron',
      'setup'
    );

    const updatedIds = result.updatedSections.map((s) => s.sectionId);
    expect(updatedIds).not.toContain('setup');
    expect(updatedIds).toContain('developments');
    expect(updatedIds).toContain('gm_notes');
    expect(result.totalReplacements).toBe(2);
  });
});

// =============================================================================
// buildSemanticPropagationHint
// =============================================================================

describe('buildSemanticPropagationHint', () => {
  it('produces a hint describing the semantic change', () => {
    const change: EntityChange = {
      entityType: 'npc',
      entityId: 'npc-1',
      changeType: 'motivation',
      oldValue: 'Protect the village',
      newValue: 'Betray the village for gold',
    };

    const sections: SectionContent[] = [
      {
        sectionId: 'setup',
        content: 'Aldric pledges loyalty and vows to defend the gates.',
      },
      {
        sectionId: 'developments',
        content: 'Aldric coordinates the defense with the militia.',
      },
    ];

    const hint = buildSemanticPropagationHint(change, sections, 'Aldric');

    expect(hint.entityName).toBe('Aldric');
    expect(hint.changeDescription).toContain('motivation');
    expect(hint.affectedSections).toHaveLength(2);
    expect(hint.affectedSections[0].sectionId).toBe('setup');
    expect(hint.suggestedAction).toContain('update');
  });

  it('only includes sections that reference the entity', () => {
    const change: EntityChange = {
      entityType: 'npc',
      entityId: 'npc-1',
      changeType: 'role',
      oldValue: 'ally',
      newValue: 'antagonist',
    };

    const sections: SectionContent[] = [
      {
        sectionId: 'setup',
        content: 'Aldric greets the party warmly.',
      },
      {
        sectionId: 'developments',
        content: 'The merchant sells potions.',
      },
    ];

    const hint = buildSemanticPropagationHint(change, sections, 'Aldric');

    expect(hint.affectedSections).toHaveLength(1);
    expect(hint.affectedSections[0].sectionId).toBe('setup');
  });

  it('returns empty affected sections when entity not referenced', () => {
    const change: EntityChange = {
      entityType: 'npc',
      entityId: 'npc-1',
      changeType: 'description',
      oldValue: 'A kindly elder',
      newValue: 'A sinister warlock',
    };

    const sections: SectionContent[] = [
      {
        sectionId: 'setup',
        content: 'The village is quiet at dawn.',
      },
    ];

    const hint = buildSemanticPropagationHint(change, sections, 'Aldric');

    expect(hint.affectedSections).toHaveLength(0);
  });
});
