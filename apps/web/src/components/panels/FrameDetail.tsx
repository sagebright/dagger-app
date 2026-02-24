/**
 * FrameDetail -- Full detail view for a single frame
 *
 * Shows when a user clicks a frame card in the gallery.
 * Contains:
 *   - Back to Frames link (returns to gallery, no selection)
 *   - Frame name and pitch
 *   - Collapsible accordion sections (Overview + Inciting Incident expanded)
 *   - Fixed "Select Frame" footer button
 *
 * Two exit paths:
 *   "Back to Frames" -- returns to gallery with no frame active
 *   "Select Frame"   -- returns to gallery with frame marked active
 */

import { useState, useCallback } from 'react';
import type { FrameCardData, FrameDetailSection } from '@sage-codex/shared-types';
import { RevealHTML } from '../ui/RevealHTML';

// =============================================================================
// Types
// =============================================================================

export interface FrameDetailProps {
  /** The frame to display */
  frame: FrameCardData;
  /** Called when "Back to Frames" is clicked */
  onBack: () => void;
  /** Called when "Select Frame" is clicked */
  onSelectFrame: (frameId: string) => void;
  /** When true, hides the back button and select footer */
  readOnly?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function FrameDetail({
  frame,
  onBack,
  onSelectFrame,
  readOnly = false,
}: FrameDetailProps) {
  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Fixed header */}
      <div
        className="flex-shrink-0"
        style={{ padding: '8px var(--panel-padding) 4px' }}
      >
        {!readOnly && (
          <button
            className="back-link"
            onClick={onBack}
            type="button"
          >
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Frames
          </button>
        )}
        <div
          className="font-serif text-[16px] font-semibold mt-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {frame.name}
        </div>
        <div
          className="font-serif text-[13px] italic mt-1"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
        >
          {frame.pitch}
        </div>
      </div>

      {/* Scrollable sections */}
      <div
        className="flex-1 overflow-y-auto scrollbar-panel"
        style={{ padding: '0 var(--panel-padding)', paddingBottom: 8 }}
      >
        {frame.sections.map((section) => (
          <AccordionSection key={section.key} section={section} />
        ))}
      </div>

      {/* Fixed footer (hidden in read-only mode) */}
      {!readOnly && (
        <div
          className="flex-shrink-0"
          style={{
            padding: '12px var(--panel-padding) 32px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <button
            className="btn-select-frame"
            onClick={() => onSelectFrame(frame.id)}
            type="button"
          >
            Select Frame
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface AccordionSectionProps {
  section: FrameDetailSection;
}

function AccordionSection({ section }: AccordionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(
    section.expandedByDefault ?? false
  );

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const expandedClass = isExpanded ? 'detail-section--expanded' : '';

  return (
    <div className={`detail-section ${expandedClass}`}>
      <button
        className="detail-section-header"
        onClick={toggleExpanded}
        type="button"
        aria-expanded={isExpanded}
      >
        <span className="detail-section-chevron">&#x25B8;</span>
        <span className="detail-section-label">{section.label}</span>
      </button>
      {isExpanded && (
        <div className="detail-section-body">
          {section.pills && section.pills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {section.pills.map((pill) => (
                <span key={pill} className="detail-pill">
                  {pill}
                </span>
              ))}
            </div>
          ) : (
            <RevealHTML key={section.content} text={section.content} />
          )}
        </div>
      )}
    </div>
  );
}
