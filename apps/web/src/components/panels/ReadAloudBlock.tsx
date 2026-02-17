/**
 * ReadAloudBlock -- Styled narrative text block for GM read-aloud content
 *
 * Visual treatment:
 * - Gold left border (3px)
 * - Serif italic font
 * - Slightly elevated background
 *
 * Used in NarrativeDetail for Setup, Developments, and Transitions
 * sections where the GM reads text aloud to players.
 */

// =============================================================================
// Types
// =============================================================================

export interface ReadAloudBlockProps {
  /** The read-aloud narrative text */
  text: string;
  /** Optional label above the block (e.g., "Read Aloud") */
  label?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ReadAloudBlock({ text, label }: ReadAloudBlockProps) {
  if (!text) return null;

  const paragraphs = text.split('\n\n').filter(Boolean);

  return (
    <div
      className="read-aloud-block"
      role="blockquote"
      aria-label={label ?? 'Read aloud text'}
    >
      {label && (
        <span className="read-aloud-label">{label}</span>
      )}
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="read-aloud-text">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
