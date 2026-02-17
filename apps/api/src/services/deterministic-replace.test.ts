/**
 * Tests for deterministic-replace service
 *
 * Verifies:
 * - Exact name replacement across section content
 * - Word-boundary matching to avoid partial replacements
 * - Case-sensitive replacement behavior
 * - Multi-section scanning within a scene
 * - Handling of similar/overlapping names
 * - Empty/null content gracefully handled
 */

import { describe, it, expect } from 'vitest';
import {
  replaceNameInContent,
  scanSectionsForName,
  type SectionContent,
  type ReplacementResult,
} from './deterministic-replace.js';

// =============================================================================
// replaceNameInContent
// =============================================================================

describe('replaceNameInContent', () => {
  it('replaces exact name matches in content', () => {
    const content = 'Aldric stands at the gate. Aldric draws his sword.';
    const result = replaceNameInContent(content, 'Aldric', 'Theron');

    expect(result.updatedContent).toBe(
      'Theron stands at the gate. Theron draws his sword.'
    );
    expect(result.replacementCount).toBe(2);
  });

  it('respects word boundaries to avoid partial matches', () => {
    const content =
      'Aldric and Aldricson walk together. Aldric speaks first.';
    const result = replaceNameInContent(content, 'Aldric', 'Theron');

    expect(result.updatedContent).toBe(
      'Theron and Aldricson walk together. Theron speaks first.'
    );
    expect(result.replacementCount).toBe(2);
  });

  it('handles possessive forms (name followed by apostrophe-s)', () => {
    const content = "Aldric's blade gleams. Aldric's plan unfolds.";
    const result = replaceNameInContent(content, 'Aldric', 'Theron');

    expect(result.updatedContent).toBe(
      "Theron's blade gleams. Theron's plan unfolds."
    );
    expect(result.replacementCount).toBe(2);
  });

  it('returns zero replacements when name is not found', () => {
    const content = 'The guard patrols the wall.';
    const result = replaceNameInContent(content, 'Aldric', 'Theron');

    expect(result.updatedContent).toBe('The guard patrols the wall.');
    expect(result.replacementCount).toBe(0);
  });

  it('handles empty content gracefully', () => {
    const result = replaceNameInContent('', 'Aldric', 'Theron');

    expect(result.updatedContent).toBe('');
    expect(result.replacementCount).toBe(0);
  });

  it('is case-sensitive by default', () => {
    const content = 'aldric is not Aldric.';
    const result = replaceNameInContent(content, 'Aldric', 'Theron');

    expect(result.updatedContent).toBe('aldric is not Theron.');
    expect(result.replacementCount).toBe(1);
  });

  it('handles names with special regex characters', () => {
    const content = "O'Malley guards the bridge. O'Malley is fierce.";
    const result = replaceNameInContent(content, "O'Malley", "O'Brien");

    expect(result.updatedContent).toBe(
      "O'Brien guards the bridge. O'Brien is fierce."
    );
    expect(result.replacementCount).toBe(2);
  });

  it('handles multi-word names', () => {
    const content = 'Elder Mira speaks. Elder Mira nods.';
    const result = replaceNameInContent(content, 'Elder Mira', 'Sage Kael');

    expect(result.updatedContent).toBe('Sage Kael speaks. Sage Kael nods.');
    expect(result.replacementCount).toBe(2);
  });
});

// =============================================================================
// scanSectionsForName
// =============================================================================

describe('scanSectionsForName', () => {
  const sections: SectionContent[] = [
    {
      sectionId: 'setup',
      content: 'Aldric greets the party at the village gate.',
    },
    {
      sectionId: 'developments',
      content: 'The merchant reveals Aldric has been working with the bandits.',
    },
    {
      sectionId: 'transitions',
      content: 'The party moves on without encountering anyone notable.',
    },
    {
      sectionId: 'overview',
      content: 'A scene featuring Aldric and the merchant.',
    },
  ];

  it('finds all sections containing the name', () => {
    const results = scanSectionsForName(sections, 'Aldric');

    const sectionIds = results.map((r) => r.sectionId);
    expect(sectionIds).toContain('setup');
    expect(sectionIds).toContain('developments');
    expect(sectionIds).toContain('overview');
    expect(sectionIds).not.toContain('transitions');
  });

  it('returns replacement count per section', () => {
    const results = scanSectionsForName(sections, 'Aldric');

    const setupResult = results.find((r) => r.sectionId === 'setup');
    expect(setupResult?.matchCount).toBe(1);
  });

  it('returns empty array when name appears in no sections', () => {
    const results = scanSectionsForName(sections, 'Theron');
    expect(results).toEqual([]);
  });

  it('handles empty sections array', () => {
    const results = scanSectionsForName([], 'Aldric');
    expect(results).toEqual([]);
  });

  it('replaces name and returns updated content for all matching sections', () => {
    const results = scanSectionsForName(sections, 'Aldric', 'Theron');

    const setupResult = results.find((r) => r.sectionId === 'setup');
    expect(setupResult?.updatedContent).toBe(
      'Theron greets the party at the village gate.'
    );

    const devResult = results.find((r) => r.sectionId === 'developments');
    expect(devResult?.updatedContent).toBe(
      'The merchant reveals Theron has been working with the bandits.'
    );
  });
});
