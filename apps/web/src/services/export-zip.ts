/**
 * ZIP export builder for adventure downloads
 *
 * Packages the adventure into a downloadable ZIP containing:
 *   - adventure.md  — Full Markdown document
 *   - adventure.txt — Plain-text formatted version (table-friendly)
 *
 * Uses JSZip (already a project dependency) for ZIP generation.
 * The plain-text version serves as a lightweight PDF alternative
 * that works on all devices without requiring a PDF renderer.
 *
 * Pure async function with no side effects beyond Blob creation.
 */

import JSZip from 'jszip';

// =============================================================================
// Public API
// =============================================================================

/**
 * Build a ZIP archive containing the adventure in multiple formats.
 *
 * Returns a Blob ready for browser download.
 */
export async function buildAdventureZip(
  adventureName: string | null,
  markdown: string
): Promise<Blob> {
  const zip = new JSZip();
  const safeName = buildSafeFilename(adventureName);

  zip.file(`${safeName}.md`, markdown);
  zip.file(`${safeName}.txt`, convertMarkdownToPlainText(markdown));

  return zip.generateAsync({ type: 'blob' });
}

// =============================================================================
// Markdown-to-Plain-Text Converter
// =============================================================================

/**
 * Convert Markdown to clean plain text suitable for printing.
 *
 * Strips Markdown syntax while preserving structure through
 * whitespace and simple ASCII decoration.
 */
function convertMarkdownToPlainText(markdown: string): string {
  let text = markdown;

  // Convert horizontal rules to ASCII decoration
  text = text.replace(/^---$/gm, repeatChar('=', 60));

  // Convert headings to underlined text
  text = text.replace(/^### (.+)$/gm, (_match, title: string) =>
    `${title}\n${repeatChar('-', title.length)}`
  );
  text = text.replace(/^## (.+)$/gm, (_match, title: string) =>
    `\n${title.toUpperCase()}\n${repeatChar('=', title.length)}`
  );
  text = text.replace(/^# (.+)$/gm, (_match, title: string) =>
    `${title.toUpperCase()}\n${repeatChar('=', title.length)}\n`
  );

  // Convert blockquotes
  text = text.replace(/^> (.+)$/gm, '  $1');

  // Strip bold and italic markers
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/_(.+?)_/g, '$1');

  // Collapse multiple blank lines to two
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim() + '\n';
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Create a filesystem-safe filename from the adventure name.
 */
function buildSafeFilename(name: string | null): string {
  const raw = name ?? 'adventure';
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'adventure';
}

/**
 * Repeat a character N times.
 */
function repeatChar(char: string, count: number): string {
  return char.repeat(count);
}
