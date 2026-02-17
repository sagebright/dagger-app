/**
 * PropagationNotice -- Shows cross-section propagation feedback
 *
 * Displays a notice banner when entities are renamed or modified
 * across sections. Two variants:
 *
 * - **Deterministic**: Shows which sections had literal name
 *   replacements applied (e.g., "Aldric" -> "Theron" in 3 sections).
 *
 * - **Semantic**: Shows which sections need LLM review due to a
 *   deeper entity change (e.g., motivation or role change).
 *
 * The notice auto-dismisses after a timeout or can be closed manually.
 */

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Constants
// =============================================================================

const AUTO_DISMISS_MS = 8000;

// =============================================================================
// Types
// =============================================================================

export interface DeterministicNoticeData {
  type: 'deterministic';
  oldName: string;
  newName: string;
  updatedSections: Array<{
    sectionId: string;
    replacementCount: number;
  }>;
  totalReplacements: number;
}

export interface SemanticNoticeData {
  type: 'semantic';
  entityName: string;
  changeType: string;
  affectedSectionIds: string[];
  suggestedAction: string;
}

export type PropagationNoticeData =
  | DeterministicNoticeData
  | SemanticNoticeData;

export interface PropagationNoticeProps {
  /** The propagation data to display */
  notice: PropagationNoticeData;
  /** Called when the notice is dismissed */
  onDismiss: () => void;
  /** Override auto-dismiss timeout (0 to disable) */
  autoDismissMs?: number;
}

// =============================================================================
// Component
// =============================================================================

export function PropagationNotice({
  notice,
  onDismiss,
  autoDismissMs = AUTO_DISMISS_MS,
}: PropagationNoticeProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (autoDismissMs <= 0) return;

    const timer = setTimeout(handleDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, handleDismiss]);

  if (!isVisible) return null;

  const isDeterministic = notice.type === 'deterministic';

  return (
    <div
      className={`propagation-notice ${isDeterministic ? 'propagation-notice--deterministic' : 'propagation-notice--semantic'}`}
      role="status"
      aria-live="polite"
    >
      <div className="propagation-notice__header">
        <span className="propagation-notice__icon" aria-hidden="true">
          {isDeterministic ? '\u2194' : '\u26A0'}
        </span>
        <span className="propagation-notice__title">
          {isDeterministic ? 'Name Propagated' : 'Semantic Change Detected'}
        </span>
        <button
          className="propagation-notice__close"
          onClick={handleDismiss}
          aria-label="Dismiss propagation notice"
          type="button"
        >
          \u00D7
        </button>
      </div>

      <div className="propagation-notice__body">
        {isDeterministic ? (
          <DeterministicBody data={notice} />
        ) : (
          <SemanticBody data={notice} />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function DeterministicBody({ data }: { data: DeterministicNoticeData }) {
  return (
    <>
      <p className="propagation-notice__summary">
        Renamed <strong>{data.oldName}</strong> to{' '}
        <strong>{data.newName}</strong> across{' '}
        {data.updatedSections.length} section
        {data.updatedSections.length !== 1 ? 's' : ''}{' '}
        ({data.totalReplacements} replacement
        {data.totalReplacements !== 1 ? 's' : ''})
      </p>
      <ul className="propagation-notice__sections" aria-label="Updated sections">
        {data.updatedSections.map((section) => (
          <li key={section.sectionId} className="propagation-notice__section-item">
            <span className="propagation-notice__section-name">
              {formatSectionId(section.sectionId)}
            </span>
            <span className="propagation-notice__section-count">
              {section.replacementCount}x
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function SemanticBody({ data }: { data: SemanticNoticeData }) {
  return (
    <>
      <p className="propagation-notice__summary">
        <strong>{data.entityName}</strong>&apos;s {data.changeType} was
        modified. The following sections may need updates:
      </p>
      <ul className="propagation-notice__sections" aria-label="Affected sections">
        {data.affectedSectionIds.map((sectionId) => (
          <li key={sectionId} className="propagation-notice__section-item">
            <span className="propagation-notice__section-name">
              {formatSectionId(sectionId)}
            </span>
            <span className="propagation-notice__section-badge">
              needs review
            </span>
          </li>
        ))}
      </ul>
      <p className="propagation-notice__action">{data.suggestedAction}</p>
    </>
  );
}

// =============================================================================
// Helpers
// =============================================================================

/** Convert a section ID like "npcs_present" to "NPCs Present" */
function formatSectionId(sectionId: string): string {
  const labels: Record<string, string> = {
    overview: 'Overview',
    setup: 'Setup',
    developments: 'Developments',
    npcs_present: 'NPCs Present',
    adversaries: 'Adversaries',
    items: 'Items',
    transitions: 'Transitions',
    portents: 'Portents',
    gm_notes: 'GM Notes',
  };

  return labels[sectionId] ?? sectionId;
}
