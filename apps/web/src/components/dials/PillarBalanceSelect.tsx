/**
 * PillarBalanceSelect Component
 *
 * A priority ranking UI for the three TTRPG pillars: Combat, Exploration, Social.
 * Click a pillar to promote it to primary position. The previous pillars shift down.
 * Fantasy-themed with gold accent for primary pillar.
 */

import { useId, useCallback } from 'react';
import type { Pillar, PillarBalance } from '@dagger-app/shared-types';

export interface PillarBalanceSelectProps {
  /** Current pillar balance configuration */
  value: PillarBalance;
  /** Callback when balance changes */
  onChange: (balance: PillarBalance) => void;
  /** Optional label */
  label?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Pillar display metadata */
const PILLAR_INFO: Record<Pillar, { label: string; description: string }> = {
  combat: { label: 'Combat', description: 'Tactical encounters and battles' },
  exploration: { label: 'Exploration', description: 'Discovery and investigation' },
  social: { label: 'Social', description: 'Roleplay and negotiation' },
};

/** Position labels */
const POSITION_LABELS = ['1st', '2nd', '3rd'] as const;

/** Get the position of a pillar in the balance */
function getPillarPosition(pillar: Pillar, balance: PillarBalance): 0 | 1 | 2 {
  if (balance.primary === pillar) return 0;
  if (balance.secondary === pillar) return 1;
  return 2;
}

/** Promote a pillar to primary, shifting others down */
function promoteToPrimary(pillar: Pillar, current: PillarBalance): PillarBalance {
  const position = getPillarPosition(pillar, current);

  // Already primary, no change
  if (position === 0) {
    return current;
  }

  // Promote from secondary: swap with primary
  if (position === 1) {
    return {
      primary: pillar,
      secondary: current.primary,
      tertiary: current.tertiary,
    };
  }

  // Promote from tertiary: shift all up
  return {
    primary: pillar,
    secondary: current.primary,
    tertiary: current.secondary,
  };
}

export function PillarBalanceSelect({
  value,
  onChange,
  label,
  disabled = false,
  className = '',
}: PillarBalanceSelectProps) {
  const groupId = useId();
  const labelId = `${groupId}-label`;

  const handlePillarClick = useCallback(
    (pillar: Pillar) => {
      if (disabled) return;

      const newBalance = promoteToPrimary(pillar, value);

      // Only call onChange if the balance actually changed
      if (
        newBalance.primary !== value.primary ||
        newBalance.secondary !== value.secondary ||
        newBalance.tertiary !== value.tertiary
      ) {
        onChange(newBalance);
      }
    },
    [disabled, value, onChange]
  );

  // Get pillars in display order (by their assigned position)
  const pillarsInOrder: Pillar[] = [value.primary, value.secondary, value.tertiary];

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {label && (
        <span id={labelId} className="text-sm font-medium text-parchment-200">
          {label}
        </span>
      )}

      {/* Priority slots header */}
      <div className="flex gap-2 text-xs text-parchment-400 px-1">
        <span className="flex-1 text-center">1st</span>
        <span className="flex-1 text-center">2nd</span>
        <span className="flex-1 text-center">3rd</span>
      </div>

      {/* Pillar list showing current order */}
      <ol
        role="group"
        aria-labelledby={label ? labelId : undefined}
        className="flex gap-2"
      >
        {pillarsInOrder.map((pillar, index) => {
          const info = PILLAR_INFO[pillar];
          const isPrimary = index === 0;

          return (
            <li key={pillar} className="flex-1">
              <button
                type="button"
                onClick={() => handlePillarClick(pillar)}
                disabled={disabled}
                aria-label={`${info.label} - ${POSITION_LABELS[index]} priority`}
                className={`
                  w-full flex flex-col items-center px-3 py-3 rounded-lg border-2 transition-all
                  focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-shadow-900
                  ${
                    isPrimary
                      ? 'bg-gold-600/20 border-gold-500 text-parchment-100'
                      : 'bg-shadow-800 border-shadow-600 text-parchment-300 hover:border-shadow-500 hover:bg-shadow-700'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="text-xs text-parchment-400 mb-1">
                  {POSITION_LABELS[index]}
                </span>
                <span className="font-medium">{info.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-parchment-500 text-center">
        Click a pillar to promote it to primary
      </p>
    </div>
  );
}
