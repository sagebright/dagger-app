/**
 * SceneArc -- Full scene arc content panel for the Weaving stage
 *
 * Displays the narrative arc for the selected scene:
 *   - Scene title (serif header)
 *   - Subtitle (optional, muted)
 *   - Full narrative description (multiple paragraphs)
 *
 * Lighter than Inscribing's 9-section accordion -- just the outline
 * of what happens in the scene.
 */

import type { SceneArcData } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface SceneArcProps {
  /** The scene arc data to display */
  sceneArc: SceneArcData | null;
  /** Whether the arc content is still streaming */
  isStreaming?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function SceneArc({ sceneArc, isStreaming = false }: SceneArcProps) {
  if (!sceneArc) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ padding: '0 var(--panel-padding)' }}
      >
        <p
          className="font-serif text-[14px] italic text-center"
          style={{ color: 'var(--text-muted)' }}
        >
          The Sage is drafting scene arcs...
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto scrollbar-panel"
      style={{ padding: '0 var(--panel-padding)' }}
      role="tabpanel"
      aria-label={`Scene ${sceneArc.sceneNumber}: ${sceneArc.title}`}
    >
      <h3
        className="font-serif text-[16px] font-semibold mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {sceneArc.title}
      </h3>

      {sceneArc.subtitle && (
        <p
          className="text-[12px] mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          {sceneArc.subtitle}
        </p>
      )}

      <div className="scene-arc-body">
        <DescriptionParagraphs
          text={sceneArc.description}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface DescriptionParagraphsProps {
  text: string;
  isStreaming: boolean;
}

/**
 * Split description text into paragraphs and render them.
 * Applies the streaming cursor to the last paragraph when streaming.
 */
function DescriptionParagraphs({
  text,
  isStreaming,
}: DescriptionParagraphsProps) {
  const paragraphs = text.split('\n\n').filter(Boolean);

  if (paragraphs.length === 0 && !isStreaming) {
    return null;
  }

  return (
    <>
      {paragraphs.map((paragraph, index) => {
        const isLastParagraph = index === paragraphs.length - 1;
        const showCursor = isStreaming && isLastParagraph;

        return (
          <p
            key={index}
            className={showCursor ? 'streaming-cursor' : ''}
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: '1.65',
              marginTop: index > 0 ? '12px' : '0',
            }}
          >
            {paragraph}
          </p>
        );
      })}
    </>
  );
}
