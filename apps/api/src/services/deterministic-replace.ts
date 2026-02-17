/**
 * Deterministic find-and-replace service for cross-section propagation
 *
 * Handles literal name replacements across scene sections using
 * word-boundary-safe regex matching. This is the "safety net" layer
 * that catches exact string matches when entities are renamed.
 *
 * Design decisions:
 * - Word-boundary matching prevents partial replacements (e.g., "Aldric"
 *   won't match "Aldricson")
 * - Case-sensitive by default to preserve authorial intent
 * - Special regex characters in names are escaped automatically
 * - Possessive forms (name's) are handled naturally by word boundaries
 */

// =============================================================================
// Types
// =============================================================================

/** A section's ID and content for scanning */
export interface SectionContent {
  sectionId: string;
  content: string;
}

/** Result of replacing a name in a single piece of content */
export interface ReplacementResult {
  updatedContent: string;
  replacementCount: number;
}

/** Result of scanning a section for a name (with optional replacement) */
export interface SectionScanResult {
  sectionId: string;
  matchCount: number;
  updatedContent?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Escape special regex characters in a string so it can be used
 * as a literal pattern in a RegExp constructor.
 */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a word-boundary-safe regex for a name.
 *
 * Uses \b (word boundary) to prevent partial matches. The global
 * flag ensures all occurrences are found/replaced.
 */
function buildNamePattern(name: string): RegExp {
  const escaped = escapeRegExp(name);
  return new RegExp(`\\b${escaped}\\b`, 'g');
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Replace all exact occurrences of `oldName` with `newName` in content.
 *
 * Uses word-boundary matching to avoid partial replacements.
 * Returns the updated content and the number of replacements made.
 */
export function replaceNameInContent(
  content: string,
  oldName: string,
  newName: string
): ReplacementResult {
  if (!content || !oldName) {
    return { updatedContent: content, replacementCount: 0 };
  }

  const pattern = buildNamePattern(oldName);
  let replacementCount = 0;

  const updatedContent = content.replace(pattern, () => {
    replacementCount++;
    return newName;
  });

  return { updatedContent, replacementCount };
}

/**
 * Scan multiple sections for occurrences of a name.
 *
 * When `newName` is provided, also performs the replacement and
 * includes updatedContent in the results.
 *
 * Returns only sections that contain at least one match.
 */
export function scanSectionsForName(
  sections: SectionContent[],
  oldName: string,
  newName?: string
): SectionScanResult[] {
  if (!sections.length || !oldName) {
    return [];
  }

  const results: SectionScanResult[] = [];

  for (const section of sections) {
    const pattern = buildNamePattern(oldName);
    const matches = section.content.match(pattern);

    if (!matches || matches.length === 0) {
      continue;
    }

    const scanResult: SectionScanResult = {
      sectionId: section.sectionId,
      matchCount: matches.length,
    };

    if (newName !== undefined) {
      const { updatedContent } = replaceNameInContent(
        section.content,
        oldName,
        newName
      );
      scanResult.updatedContent = updatedContent;
    }

    results.push(scanResult);
  }

  return results;
}
