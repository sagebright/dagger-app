/**
 * ThinkingIndicator — Animated dots showing the Sage is processing
 *
 * Displays a "Sage" label followed by three gold pulsing dots.
 * Used when the assistant is processing but hasn't started streaming yet.
 *
 * Shared across all stages — no stage-specific logic.
 */

export function ThinkingIndicator() {
  return (
    <div
      className="flex items-center gap-2 self-start"
      role="status"
      aria-label="Sage is thinking"
    >
      <span className="sage-label">Sage</span>
      <div className="thinking-dots">
        <div className="thinking-dot" />
        <div className="thinking-dot" />
        <div className="thinking-dot" />
      </div>
    </div>
  );
}
