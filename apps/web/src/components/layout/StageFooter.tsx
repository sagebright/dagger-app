/**
 * StageFooter — Fixed footer with stage advancement button
 *
 * Pinned to the bottom of the right panel. Contains a full-width
 * button that advances to the next stage. The button is disabled
 * until the system signals readiness.
 *
 * Shared across all stages via the `label` and `isReady` props.
 */

// =============================================================================
// Types
// =============================================================================

export interface StageFooterProps {
  /** Button label (e.g., "Continue to Attuning") */
  label: string;
  /** Whether the button should be enabled */
  isReady: boolean;
  /** Called when the button is clicked */
  onAdvance: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function StageFooter({ label, isReady, onAdvance }: StageFooterProps) {
  return (
    <div className="panel-footer" role="navigation" aria-label="Stage advancement">
      <button
        className="footer-button"
        disabled={!isReady}
        onClick={onAdvance}
        type="button"
        aria-label={isReady ? label : `${label} (not yet ready)`}
      >
        {label}
      </button>
    </div>
  );
}
