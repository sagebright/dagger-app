/**
 * SceneList Component
 *
 * Progress indicator showing all scenes with their status.
 * Allows navigation between scenes (only to completed/current scenes).
 * Fantasy-themed styling consistent with other content components.
 */

import { useMemo } from 'react';
import type { Scene, SceneStatus } from '@dagger-app/shared-types';

// =============================================================================
// Props
// =============================================================================

export interface SceneListProps {
  /** All scenes in the adventure */
  scenes: Scene[];
  /** ID of the currently active scene */
  currentSceneId: string;
  /** Callback when user selects a scene */
  onSelectScene: (sceneId: string) => void;
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal';
  /** Compact mode (hides descriptions) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function SceneList({
  scenes,
  currentSceneId,
  onSelectScene,
  orientation = 'vertical',
  compact = false,
  className = '',
}: SceneListProps) {
  // Calculate progress
  const { confirmedCount, progressPercent } = useMemo(() => {
    const confirmed = scenes.filter((s) => s.status === 'confirmed').length;
    const percent = scenes.length > 0 ? Math.round((confirmed / scenes.length) * 100) : 0;
    return { confirmedCount: confirmed, progressPercent: percent };
  }, [scenes]);

  // Find current scene index
  const currentIndex = useMemo(
    () => scenes.findIndex((s) => s.brief.id === currentSceneId),
    [scenes, currentSceneId]
  );

  // Empty state
  if (scenes.length === 0) {
    return (
      <div className={`text-center p-4 text-ink-500 dark:text-parchment-500 ${className}`}>
        No scenes available
      </div>
    );
  }

  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={className}>
      {/* Progress header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-ink-700 dark:text-parchment-300">
            Scene Progress
          </span>
          <span className="text-sm text-ink-500 dark:text-parchment-500">
            {confirmedCount} of {scenes.length} confirmed
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 bg-ink-200 dark:bg-shadow-700 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-gold-500 dark:bg-gold-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Scene list */}
      <ul
        role="list"
        className={`
          flex gap-2
          ${isHorizontal ? 'flex-row overflow-x-auto' : 'flex-col'}
        `}
      >
        {scenes.map((scene, index) => {
          const isCurrent = scene.brief.id === currentSceneId;
          const canNavigate =
            scene.status === 'confirmed' ||
            scene.status === 'draft' ||
            isCurrent ||
            index <= currentIndex;

          return (
            <li key={scene.brief.id} className={isHorizontal ? 'flex-shrink-0' : ''}>
              <button
                type="button"
                onClick={() => onSelectScene(scene.brief.id)}
                disabled={!canNavigate}
                className={`
                  w-full text-left p-3 rounded-fantasy border transition-all
                  ${
                    isCurrent
                      ? 'ring-2 ring-gold-500 border-gold-400 bg-gold-50 dark:bg-gold-900/30 dark:border-gold-600'
                      : 'border-ink-200 dark:border-shadow-600 hover:border-gold-300 dark:hover:border-gold-700'
                  }
                  ${
                    !canNavigate
                      ? 'opacity-50 cursor-not-allowed bg-ink-50 dark:bg-shadow-900'
                      : 'bg-parchment-50 dark:bg-shadow-800 cursor-pointer'
                  }
                  ${isHorizontal ? 'w-48' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Scene number badge with status */}
                  <SceneNumberBadge
                    number={scene.brief.sceneNumber}
                    status={scene.status}
                    isCurrent={isCurrent}
                  />

                  {/* Scene info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`
                          font-medium truncate
                          ${
                            isCurrent
                              ? 'text-ink-900 dark:text-parchment-50'
                              : 'text-ink-700 dark:text-parchment-300'
                          }
                        `}
                      >
                        {scene.brief.title}
                      </h4>
                    </div>

                    {/* Scene type badge */}
                    {scene.brief.sceneType && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-xs bg-ink-100 dark:bg-shadow-700 text-ink-600 dark:text-parchment-400 rounded capitalize">
                        {scene.brief.sceneType}
                      </span>
                    )}

                    {/* Description (not in compact mode) */}
                    {!compact && (
                      <p className="mt-1 text-xs text-ink-500 dark:text-parchment-500 line-clamp-2">
                        {scene.brief.description}
                      </p>
                    )}

                    {/* Status indicator text */}
                    {scene.status === 'generating' && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-gold-600 dark:text-gold-400">
                        <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse" />
                        Generating...
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface SceneNumberBadgeProps {
  number: number;
  status: SceneStatus;
  isCurrent: boolean;
}

function SceneNumberBadge({ number, status, isCurrent }: SceneNumberBadgeProps) {
  const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold';

  if (status === 'confirmed') {
    return (
      <div className={`${baseClasses} bg-gold-500 text-ink-900`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (status === 'generating') {
    return (
      <div className={`${baseClasses} bg-gold-100 dark:bg-gold-900/40 text-gold-700 dark:text-gold-400`}>
        <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'draft') {
    return (
      <div
        className={`${baseClasses} bg-parchment-200 dark:bg-shadow-600 text-ink-700 dark:text-parchment-300 ring-2 ring-gold-400`}
      >
        {number}
      </div>
    );
  }

  // Pending
  return (
    <div
      className={`
        ${baseClasses}
        ${
          isCurrent
            ? 'bg-gold-100 dark:bg-gold-900/40 text-gold-700 dark:text-gold-400'
            : 'bg-ink-100 dark:bg-shadow-700 text-ink-500 dark:text-parchment-500'
        }
      `}
    >
      {number}
    </div>
  );
}
