/**
 * SparkPanel — Right panel content for the Invoking stage
 *
 * Displays the adventure's "Spark" — the initial vision captured by the Sage.
 *
 * States:
 * - Empty: Dashed placeholder text ("Your spark will appear here...")
 * - Populated: Shows the distilled spark name and vision text
 *
 * Includes the StageFooter with "Continue to Attuning" button.
 */

import { StageFooter } from '@/components/layout/StageFooter';
import { RevealText } from '@/components/ui/RevealText';
import type { AdventureSpark } from '@sage-codex/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface SparkPanelProps {
  /** The captured spark (null if not yet distilled) */
  spark: AdventureSpark | null;
  /** Whether the stage is ready for advancement */
  isReady: boolean;
  /** Called when "Continue to Attuning" is clicked */
  onAdvance: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function SparkPanel({ spark, isReady, onAdvance }: SparkPanelProps) {
  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Panel header — phase info */}
      <div
        className="flex-shrink-0 flex items-center gap-3"
        style={{ padding: '12px var(--panel-padding) 4px' }}
      >
        <div className="flex-1 min-w-0">
          <div
            className="font-serif text-[16px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Invoking
          </div>
          <div
            className="text-[12px] mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            What shape will your adventure take?
          </div>
        </div>
      </div>

      {/* Spark content area — scrollable */}
      <div
        className="flex-1 overflow-y-auto scrollbar-panel"
        style={{ padding: '8px var(--panel-padding)' }}
      >
        <div className="mt-3">
          <div
            className="font-serif text-[18px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Spark
          </div>
          <div
            className="font-serif text-[14px] italic mt-2 leading-[1.5]"
            style={{ color: 'var(--text-secondary)' }}
          >
            What's the seed of your adventure?
          </div>

          {/* Spark display: placeholder or populated */}
          <div className="mt-4">
            {spark ? (
              <SparkContent spark={spark} />
            ) : (
              <SparkPlaceholder />
            )}
          </div>
        </div>
      </div>

      {/* Fixed footer */}
      <StageFooter
        label="Continue to Attuning"
        isReady={isReady}
        onAdvance={onAdvance}
      />
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function SparkPlaceholder() {
  return (
    <div
      className="text-center font-serif text-[14px] italic leading-[1.6]"
      style={{
        padding: '20px',
        border: '1px dashed var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-muted)',
      }}
    >
      Your spark will appear here once the Sage distills it from your
      conversation.
    </div>
  );
}

function SparkContent({ spark }: { spark: AdventureSpark }) {
  // Key on content so React remounts on spark updates, restarting CSS animations
  const animationKey = `${spark.name}::${spark.vision}`;

  return (
    <div
      key={animationKey}
      className="detail-card detail-card--gold"
      style={{ padding: '16px 20px' }}
    >
      <div
        className="font-serif text-[16px] font-semibold mb-2"
        style={{ color: 'var(--accent-gold)' }}
      >
        <RevealText text={spark.name} />
      </div>
      <div
        className="font-serif text-[14px] leading-[1.65]"
        style={{ color: 'var(--text-primary)' }}
      >
        <RevealText text={spark.vision} />
      </div>
    </div>
  );
}
