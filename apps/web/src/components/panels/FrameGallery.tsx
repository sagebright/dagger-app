/**
 * FrameGallery -- Scrollable grid of frame cards for the Binding stage
 *
 * Displays ~3 frame cards with name + pitch (inciting incident).
 * Three card states:
 *   default   -- subtle border, clickable
 *   exploring -- white/light border (clicked, viewing detail panel)
 *   active    -- gold treatment (frame confirmed via "Select Frame" button)
 *
 * Includes the StageFooter with "Continue to Weaving" button.
 */

import { StageFooter } from '@/components/layout/StageFooter';
import type { FrameCardData } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface FrameGalleryProps {
  /** Frame cards to display */
  frames: FrameCardData[];
  /** ID of the frame currently being explored (detail view open) */
  exploringFrameId: string | null;
  /** ID of the confirmed/active frame */
  activeFrameId: string | null;
  /** Called when a frame card is clicked */
  onExploreFrame: (frameId: string) => void;
  /** Called when "Continue to Weaving" is clicked */
  onAdvance: () => void;
  /** Whether the stage is ready for advancement */
  isReady: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function FrameGallery({
  frames,
  exploringFrameId,
  activeFrameId,
  onExploreFrame,
  onAdvance,
  isReady,
}: FrameGalleryProps) {
  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Scrollable frame list */}
      <div
        className="flex-1 overflow-y-auto scrollbar-panel"
        style={{ padding: '8px var(--panel-padding)' }}
      >
        {frames.length === 0 && (
          <div
            className="text-center py-8"
            style={{ color: 'var(--text-muted)' }}
          >
            <p className="font-serif text-[14px] italic">
              The Sage is searching the archives...
            </p>
          </div>
        )}

        {frames.map((frame) => (
          <FrameCard
            key={frame.id}
            frame={frame}
            isExploring={frame.id === exploringFrameId}
            isActive={frame.id === activeFrameId}
            onClick={() => onExploreFrame(frame.id)}
          />
        ))}
      </div>

      {/* Fixed footer */}
      <StageFooter
        label="Continue to Weaving"
        isReady={isReady}
        onAdvance={onAdvance}
      />
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface FrameCardProps {
  frame: FrameCardData;
  isExploring: boolean;
  isActive: boolean;
  onClick: () => void;
}

function FrameCard({ frame, isExploring, isActive, onClick }: FrameCardProps) {
  const stateClass = isActive
    ? 'frame-card--active'
    : isExploring
      ? 'frame-card--exploring'
      : '';

  return (
    <button
      className={`frame-card ${stateClass}`}
      onClick={onClick}
      type="button"
      aria-label={`Explore frame: ${frame.name}`}
      style={{ display: 'block', width: '100%', textAlign: 'left' }}
    >
      <div className="frame-card-name">{frame.name}</div>
      <div className="frame-card-pitch">{frame.pitch}</div>
    </button>
  );
}
