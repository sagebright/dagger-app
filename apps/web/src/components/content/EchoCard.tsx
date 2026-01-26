/**
 * EchoCard Component (Phase 4.3)
 *
 * Displays a single GM creativity echo with category styling,
 * confirm/edit/regenerate actions, and visual confirmation state.
 */

import type { Echo, EchoCategory } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface EchoCardProps {
  /** The echo to display */
  echo: Echo;
  /** Callback when user confirms the echo */
  onConfirm: (echoId: string) => void;
  /** Callback when user wants to edit the echo */
  onEdit: (echoId: string) => void;
  /** Callback when user requests regeneration */
  onRegenerate: (echoId: string) => void;
  /** Enable edit button (default: true) */
  enableEdit?: boolean;
  /** Enable regenerate button (default: true) */
  enableRegenerate?: boolean;
  /** Show loading state */
  isLoading?: boolean;
  /** Compact display mode */
  compact?: boolean;
}

// =============================================================================
// Category Styling
// =============================================================================

const categoryStyles: Record<EchoCategory, {
  bg: string;
  text: string;
  border: string;
  hoverGlow: string;
}> = {
  complications: {
    bg: 'bg-blood-100 dark:bg-blood-900',
    text: 'text-blood-700 dark:text-blood-200',
    border: 'border-blood-200 dark:border-blood-700',
    hoverGlow: 'motion-safe:hover:shadow-blood-glow',
  },
  rumors: {
    bg: 'bg-gold-100 dark:bg-gold-900',
    text: 'text-gold-700 dark:text-gold-200',
    border: 'border-gold-200 dark:border-gold-700',
    hoverGlow: 'motion-safe:hover:shadow-gold-glow-subtle',
  },
  discoveries: {
    bg: 'bg-parchment-100 dark:bg-parchment-900',
    text: 'text-parchment-700 dark:text-parchment-200',
    border: 'border-parchment-300 dark:border-parchment-700',
    hoverGlow: 'motion-safe:hover:shadow-gold-glow-subtle',
  },
  intrusions: {
    bg: 'bg-shadow-100 dark:bg-shadow-700',
    text: 'text-shadow-700 dark:text-shadow-200',
    border: 'border-shadow-200 dark:border-shadow-600',
    hoverGlow: 'motion-safe:hover:shadow-fantasy',
  },
  wonders: {
    bg: 'bg-ink-100 dark:bg-ink-900',
    text: 'text-ink-700 dark:text-ink-200',
    border: 'border-ink-200 dark:border-ink-700',
    hoverGlow: 'motion-safe:hover:shadow-magic-glow',
  },
};

// =============================================================================
// Component
// =============================================================================

export function EchoCard({
  echo,
  onConfirm,
  onEdit,
  onRegenerate,
  enableEdit = true,
  enableRegenerate = true,
  isLoading = false,
  compact = false,
}: EchoCardProps) {
  const styles = categoryStyles[echo.category];
  const isConfirmed = echo.isConfirmed;

  return (
    <article
      data-testid="echo-card"
      className={`
        relative rounded-lg border p-4 transition-all duration-200
        motion-safe:hover:-translate-y-1
        ${styles.border}
        ${styles.hoverGlow}
        ${isConfirmed
          ? 'bg-parchment-50 dark:bg-shadow-900 ring-1 ring-gold-300 dark:ring-gold-500 motion-safe:animate-selection-glow'
          : 'bg-parchment-50 dark:bg-shadow-800'}
        ${compact ? 'compact' : ''}
      `}
      aria-labelledby={`echo-title-${echo.id}`}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-shadow-900/50 rounded-lg">
          <span role="status" className="animate-spin h-5 w-5 border-2 border-gold-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Confirmed indicator */}
      {isConfirmed && (
        <span
          aria-label="confirmed"
          className="absolute top-2 right-2 text-gold-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}

      {/* Header: Category badge and title */}
      <div className="mb-2 flex items-start gap-2">
        <span
          className={`
            inline-block px-2 py-0.5 text-xs font-medium rounded-full
            ${styles.bg} ${styles.text}
          `}
        >
          {echo.category}
        </span>
      </div>

      {/* Title */}
      <h3
        id={`echo-title-${echo.id}`}
        className="text-lg font-semibold text-ink-900 dark:text-parchment-100 mb-2"
      >
        {echo.title}
      </h3>

      {/* Content */}
      <p
        className={`
          text-ink-700 dark:text-parchment-200 mb-3
          ${compact ? 'line-clamp-2' : ''}
        `}
      >
        {echo.content}
      </p>

      {/* Tags */}
      {!compact && echo.tags && echo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {echo.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-0.5 text-xs bg-parchment-100 dark:bg-shadow-700 text-ink-600 dark:text-parchment-300 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-parchment-200 dark:border-shadow-600">
        <button
          type="button"
          onClick={() => onConfirm(echo.id)}
          disabled={isConfirmed || isLoading}
          className={`
            flex-1 px-3 py-1.5 text-sm font-medium rounded
            ${
              isConfirmed
                ? 'bg-parchment-100 dark:bg-shadow-700 text-parchment-400 dark:text-shadow-500 cursor-not-allowed'
                : 'bg-gold-500 text-ink-900 hover:bg-gold-600'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2
            focus:ring-offset-parchment-100 dark:focus:ring-offset-shadow-900
          `}
        >
          Confirm
        </button>

        {enableEdit && (
          <button
            type="button"
            onClick={() => onEdit(echo.id)}
            disabled={isLoading}
            className="
              px-3 py-1.5 text-sm font-medium rounded
              border border-parchment-300 dark:border-shadow-600 text-ink-700 dark:text-parchment-200
              hover:bg-parchment-50 dark:hover:bg-shadow-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2
              focus:ring-offset-parchment-100 dark:focus:ring-offset-shadow-900
            "
          >
            Edit
          </button>
        )}

        {enableRegenerate && (
          <button
            type="button"
            onClick={() => onRegenerate(echo.id)}
            disabled={isLoading}
            className="
              px-3 py-1.5 text-sm font-medium rounded
              border border-parchment-300 dark:border-shadow-600 text-ink-700 dark:text-parchment-200
              hover:bg-parchment-50 dark:hover:bg-shadow-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2
              focus:ring-offset-parchment-100 dark:focus:ring-offset-shadow-900
            "
          >
            Regenerate
          </button>
        )}
      </div>
    </article>
  );
}
