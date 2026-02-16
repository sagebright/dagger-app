/**
 * FrameCard Component
 *
 * Compact frame card for the gallery view — shows name + pitch only.
 * Three visual states matching the binding mockup:
 *   Default   — subtle border, clickable
 *   Exploring — light border (detail panel is showing for this frame)
 *   Active    — gold treatment (frame confirmed via "Select Frame")
 */

import type { DaggerheartFrame, SelectedFrame } from '@dagger-app/shared-types';
import { isCustomFrame } from '@dagger-app/shared-types';

export type FrameCardState = 'default' | 'exploring' | 'active';

export interface FrameCardProps {
  frame: DaggerheartFrame | SelectedFrame;
  state?: FrameCardState;
  onSelect: (frame: DaggerheartFrame | SelectedFrame) => void;
  className?: string;
}

export function FrameCard({
  frame,
  state = 'default',
  onSelect,
  className = '',
}: FrameCardProps) {
  const isCustom = isCustomFrame(frame as SelectedFrame);

  // Resolve pitch: custom frames may use lore as pitch, DB frames use description
  const pitch = frame.description;

  return (
    <button
      type="button"
      onClick={() => onSelect(frame)}
      aria-pressed={state === 'active'}
      aria-label={`${frame.name}: ${pitch}`}
      className={`
        flex flex-col items-start p-4 rounded-fantasy
        border border-l-[3px]
        w-full text-left cursor-pointer
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2
        focus:ring-offset-parchment-100 dark:focus:ring-offset-shadow-900
        ${state === 'active'
          ? 'bg-gold-100/60 border-gold-300 border-l-gold-500 dark:bg-gold-900/20 dark:border-gold-600 dark:border-l-gold-400'
          : state === 'exploring'
            ? 'bg-transparent border-ink-400 border-l-ink-400 dark:border-parchment-600 dark:border-l-parchment-600'
            : 'bg-transparent border-ink-200 border-l-transparent hover:bg-parchment-100/50 hover:border-ink-300 hover:border-l-ink-300 dark:border-shadow-600 dark:border-l-transparent dark:hover:bg-shadow-700/50 dark:hover:border-shadow-400 dark:hover:border-l-shadow-400'
        }
        ${className}
      `}
    >
      <div className="flex items-center gap-2 w-full">
        <h3
          className={`
            font-serif text-[15px] font-semibold
            ${state === 'active'
              ? 'text-gold-600 dark:text-gold-300'
              : 'text-ink-900 dark:text-parchment-100'
            }
          `}
        >
          {frame.name}
        </h3>
        {isCustom && (
          <span className="px-2 py-0.5 text-xs font-medium bg-gold-200 text-gold-800 rounded dark:bg-gold-800 dark:text-gold-200">
            Custom
          </span>
        )}
      </div>

      <p className="mt-1 text-[13px] text-ink-500 dark:text-parchment-500 leading-snug line-clamp-2">
        {pitch}
      </p>
    </button>
  );
}
