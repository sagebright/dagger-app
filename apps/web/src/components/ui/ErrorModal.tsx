/**
 * ErrorModal Component
 *
 * A modal component for displaying user-friendly error messages with
 * actionable instructions. Uses fantasy theme styling to match the app.
 */

import { createPortal } from 'react-dom';
import type { StructuredErrorResponse } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface ErrorModalProps {
  /** Structured error object with title, message, and instructions */
  error: StructuredErrorResponse;
  /** Callback when the modal is dismissed */
  onClose: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function ErrorModal({ error, onClose }: ErrorModalProps) {
  const titleId = 'error-modal-title';
  const descriptionId = 'error-modal-description';

  return createPortal(
    <div
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="fixed inset-0 bg-shadow-950/70 z-50 flex items-center justify-center animate-in fade-in duration-200"
    >
      <div className="bg-parchment-50 dark:bg-shadow-800 rounded-fantasy shadow-fantasy p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-blood-100 dark:bg-blood-900/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blood-600 dark:text-blood-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2
          id={titleId}
          className="font-serif text-xl font-bold text-ink-800 dark:text-parchment-100 text-center mb-2"
        >
          {error.title}
        </h2>

        {/* Message */}
        <p
          id={descriptionId}
          className="text-ink-600 dark:text-parchment-400 text-center mb-6"
        >
          {error.message}
        </p>

        {/* Instructions */}
        {error.instructions.length > 0 && (
          <div className="bg-parchment-100 dark:bg-shadow-700 rounded-fantasy p-4 mb-6 border border-ink-200 dark:border-shadow-600">
            <p className="text-sm font-semibold text-ink-700 dark:text-parchment-300 mb-3">
              To resolve this issue:
            </p>
            <ol
              role="list"
              className="list-decimal list-inside space-y-2 text-sm text-ink-600 dark:text-parchment-400"
            >
              {error.instructions.map((instruction, index) => (
                <li key={index} className="leading-relaxed">
                  {instruction}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="
            w-full py-3 px-4 rounded-fantasy border
            bg-parchment-100 dark:bg-shadow-700
            border-ink-300 dark:border-shadow-500
            text-ink-700 dark:text-parchment-200
            font-semibold
            hover:bg-parchment-200 dark:hover:bg-shadow-600
            transition-all duration-200
          "
          aria-label="Dismiss error"
        >
          Dismiss
        </button>
      </div>
    </div>,
    document.body
  );
}
