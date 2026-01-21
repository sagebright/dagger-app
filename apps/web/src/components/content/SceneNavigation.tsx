/**
 * SceneNavigation Component
 *
 * Navigation controls for moving between scenes.
 * Shows current position and provides previous/next buttons.
 * Fantasy-themed styling consistent with other content components.
 */

// =============================================================================
// Props
// =============================================================================

export interface SceneNavigationProps {
  /** Current scene number (1-indexed) */
  currentSceneNumber: number;
  /** Total number of scenes */
  totalScenes: number;
  /** Whether the user can go to the previous scene */
  canGoPrevious: boolean;
  /** Whether the user can go to the next scene */
  canGoNext: boolean;
  /** Callback when user clicks previous */
  onPrevious: () => void;
  /** Callback when user clicks next */
  onNext: () => void;
  /** Whether navigation is currently loading/disabled */
  isLoading?: boolean;
  /** Whether all scenes have been confirmed */
  allScenesConfirmed?: boolean;
  /** Callback when user wants to continue to NPC phase */
  onContinueToNPCs?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function SceneNavigation({
  currentSceneNumber,
  totalScenes,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  isLoading = false,
  allScenesConfirmed = false,
  onContinueToNPCs,
  className = '',
}: SceneNavigationProps) {
  const isPreviousDisabled = !canGoPrevious || isLoading;
  const isNextDisabled = !canGoNext || isLoading;

  return (
    <div
      className={`
        flex items-center justify-between
        p-4 bg-parchment-100 dark:bg-shadow-800
        border-t border-ink-200 dark:border-shadow-600
        ${className}
      `}
    >
      {/* Previous button */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={isPreviousDisabled}
        aria-label="Previous scene"
        className={`
          flex items-center gap-2 px-4 py-2 rounded-fantasy border
          font-medium text-sm transition-all
          ${
            isPreviousDisabled
              ? 'opacity-50 cursor-not-allowed bg-ink-100 dark:bg-shadow-700 border-ink-200 dark:border-shadow-600 text-ink-400 dark:text-parchment-600'
              : 'bg-parchment-50 dark:bg-shadow-700 border-ink-300 dark:border-shadow-500 text-ink-700 dark:text-parchment-300 hover:bg-gold-50 hover:border-gold-400 dark:hover:bg-gold-900/20 dark:hover:border-gold-600'
          }
        `}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Previous
      </button>

      {/* Scene position / Loading indicator */}
      <div className="flex items-center gap-3">
        {isLoading ? (
          <div role="status" className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gold-300 border-t-gold-600 rounded-full animate-spin" />
            <span className="text-sm text-ink-500 dark:text-parchment-500">Loading...</span>
          </div>
        ) : (
          <span className="text-sm font-medium text-ink-700 dark:text-parchment-300">
            Scene {currentSceneNumber} of {totalScenes}
          </span>
        )}
      </div>

      {/* Next / Continue button */}
      {allScenesConfirmed && onContinueToNPCs ? (
        <button
          type="button"
          onClick={onContinueToNPCs}
          disabled={isLoading}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-fantasy border-2
            font-serif font-semibold text-sm transition-all
            ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }
            bg-gold-500 border-gold-600 text-ink-900
            hover:bg-gold-400 hover:border-gold-500
            dark:bg-gold-600 dark:border-gold-500 dark:text-ink-900
            dark:hover:bg-gold-500 dark:hover:border-gold-400
            shadow-gold-glow
          `}
        >
          Continue to NPCs
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          aria-label="Next scene"
          className={`
            flex items-center gap-2 px-4 py-2 rounded-fantasy border
            font-medium text-sm transition-all
            ${
              isNextDisabled
                ? 'opacity-50 cursor-not-allowed bg-ink-100 dark:bg-shadow-700 border-ink-200 dark:border-shadow-600 text-ink-400 dark:text-parchment-600'
                : 'bg-parchment-50 dark:bg-shadow-700 border-ink-300 dark:border-shadow-500 text-ink-700 dark:text-parchment-300 hover:bg-gold-50 hover:border-gold-400 dark:hover:bg-gold-900/20 dark:hover:border-gold-600'
            }
          `}
        >
          Next
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
