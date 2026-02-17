/**
 * WaveIndicator -- Visual indicator for the 3-wave generation lifecycle
 *
 * Shows three dots representing the three waves of Inscribing:
 *   Wave 1 (Overview, Setup, Developments) — primary narrative
 *   Wave 2 (NPCs Present, Adversaries, Items) — entities
 *   Wave 3 (Transitions, Portents, GM Notes) — synthesis
 *
 * Dot states:
 *   filled  — wave is populated
 *   active  — wave is currently being generated (gold border + glow)
 *   dimmed  — wave is locked/pending (0.4 opacity)
 *   empty   — wave has no content yet
 */

import type { WaveNumber } from '@dagger-app/shared-types';

// =============================================================================
// Constants
// =============================================================================

const WAVE_LABELS: Record<WaveNumber, string> = {
  1: 'Narrative',
  2: 'Entities',
  3: 'Synthesis',
};

// =============================================================================
// Types
// =============================================================================

export interface WaveIndicatorProps {
  /** Which waves are populated with content */
  populatedWaves: Set<WaveNumber>;
  /** Which wave is currently being generated (if any) */
  activeWave?: WaveNumber | null;
  /** Whether Wave 3 is dimmed (waiting for Waves 1-2 to settle) */
  isWave3Dimmed: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function WaveIndicator({
  populatedWaves,
  activeWave = null,
  isWave3Dimmed,
}: WaveIndicatorProps) {
  const waves: WaveNumber[] = [1, 2, 3];

  return (
    <div className="wave-indicator" aria-label="Wave progress">
      {waves.map((wave) => {
        const isFilled = populatedWaves.has(wave);
        const isActive = activeWave === wave;
        const isDimmed = wave === 3 && isWave3Dimmed && !isFilled;

        return (
          <WaveDot
            key={wave}
            wave={wave}
            isFilled={isFilled}
            isActive={isActive}
            isDimmed={isDimmed}
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface WaveDotProps {
  wave: WaveNumber;
  isFilled: boolean;
  isActive: boolean;
  isDimmed: boolean;
}

function WaveDot({ wave, isFilled, isActive, isDimmed }: WaveDotProps) {
  const classNames = [
    'wave-dot',
    isFilled ? 'wave-dot--filled' : '',
    isActive ? 'wave-dot--active' : '',
    isDimmed ? 'wave-dot--dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const label = WAVE_LABELS[wave];
  const stateLabel = isFilled ? 'populated' : isDimmed ? 'pending' : 'empty';

  return (
    <div
      className={classNames}
      title={`Wave ${wave}: ${label} (${stateLabel})`}
      aria-label={`Wave ${wave}: ${label}, ${stateLabel}`}
    />
  );
}
