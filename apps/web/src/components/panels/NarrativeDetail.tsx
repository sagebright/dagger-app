/**
 * NarrativeDetail -- Drill-in detail view for narrative sections
 *
 * Shows full content for Setup, Developments, and Transitions sections
 * with read-aloud blocks (gold left border, serif italic).
 *
 * Two-level navigation: Section accordion -> NarrativeDetail
 * Back button returns to the section accordion view.
 *
 * Content is split into narrative paragraphs and read-aloud blocks.
 * Read-aloud blocks are delimited by `[READ_ALOUD]...[/READ_ALOUD]` markers
 * in the content string.
 */

import { ReadAloudBlock } from './ReadAloudBlock';
import type { InscribingSectionId } from '@sage-codex/shared-types';
import { SECTION_LABELS } from '@sage-codex/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface NarrativeDetailProps {
  /** Which narrative section is being viewed */
  sectionId: InscribingSectionId;
  /** The full section content (may contain read-aloud markers) */
  content: string;
  /** Scene title for context */
  sceneTitle: string;
  /** Called when the user clicks "Back to Scene" */
  onBack: () => void;
}

// =============================================================================
// Content Parser
// =============================================================================

interface ContentBlock {
  type: 'narrative' | 'read_aloud';
  text: string;
}

const READ_ALOUD_PATTERN = /\[READ_ALOUD\]([\s\S]*?)\[\/READ_ALOUD\]/g;

/**
 * Parse content string into narrative and read-aloud blocks.
 *
 * Text between [READ_ALOUD]...[/READ_ALOUD] markers becomes
 * read-aloud blocks. Everything else is narrative text.
 */
function parseContentBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(READ_ALOUD_PATTERN)) {
    const matchStart = match.index ?? 0;

    // Add narrative text before this read-aloud block
    if (matchStart > lastIndex) {
      const narrativeText = content.slice(lastIndex, matchStart).trim();
      if (narrativeText) {
        blocks.push({ type: 'narrative', text: narrativeText });
      }
    }

    // Add the read-aloud block
    const readAloudText = match[1].trim();
    if (readAloudText) {
      blocks.push({ type: 'read_aloud', text: readAloudText });
    }

    lastIndex = matchStart + match[0].length;
  }

  // Add any remaining narrative text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex).trim();
    if (remainingText) {
      blocks.push({ type: 'narrative', text: remainingText });
    }
  }

  // If no markers found, treat entire content as narrative
  if (blocks.length === 0 && content.trim()) {
    blocks.push({ type: 'narrative', text: content.trim() });
  }

  return blocks;
}

// =============================================================================
// Component
// =============================================================================

export function NarrativeDetail({
  sectionId,
  content,
  sceneTitle,
  onBack,
}: NarrativeDetailProps) {
  const sectionLabel = SECTION_LABELS[sectionId];
  const blocks = parseContentBlocks(content);

  return (
    <div
      className="flex-1 overflow-y-auto scrollbar-panel"
      style={{ padding: '0 var(--panel-padding)' }}
    >
      {/* Back navigation */}
      <button className="back-link" onClick={onBack} type="button">
        <BackArrow />
        Back to Scene
      </button>

      {/* Section header */}
      <div style={{ marginTop: 12, marginBottom: 16 }}>
        <h3
          className="font-serif text-[16px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {sectionLabel}
        </h3>
        <p
          className="text-[12px]"
          style={{ color: 'var(--text-muted)', marginTop: 2 }}
        >
          {sceneTitle}
        </p>
      </div>

      {/* Content blocks */}
      <div style={{ paddingBottom: 24 }}>
        {blocks.map((block, index) => (
          <ContentBlockRenderer key={index} block={block} />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface ContentBlockRendererProps {
  block: ContentBlock;
}

function ContentBlockRenderer({ block }: ContentBlockRendererProps) {
  if (block.type === 'read_aloud') {
    return <ReadAloudBlock text={block.text} label="Read Aloud" />;
  }

  const paragraphs = block.text.split('\n\n').filter(Boolean);

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: '1.65',
            marginTop: index > 0 ? '12px' : '8px',
          }}
        >
          {paragraph}
        </p>
      ))}
    </>
  );
}

function BackArrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}
