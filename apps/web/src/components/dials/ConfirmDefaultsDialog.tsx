/**
 * ConfirmDefaultsDialog Component
 *
 * Modal dialog shown when user continues with unset optional dials.
 * Displays list of unset dials with their default values and allows
 * user to go back or proceed to frame selection.
 */

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

// =============================================================================
// Types
// =============================================================================

export interface UnsetDial {
  label: string;
  defaultValue: string;
}

export interface ConfirmDefaultsDialogProps {
  unsetDials: UnsetDial[];
  onConfirm: () => void;
  onCancel: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function ConfirmDefaultsDialog({
  unsetDials,
  onConfirm,
  onCancel,
}: ConfirmDefaultsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const goBackButtonRef = useRef<HTMLButtonElement>(null);

  // Handle escape key to close dialog
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  // Focus trap implementation
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !dialogRef.current) {
      return;
    }

    const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // If shift+tab from first element, move to last
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
      return;
    }

    // If tab from last element, move to first
    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleTabKey);

    // Set initial focus to Go Back button
    goBackButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [handleKeyDown, handleTabKey]);

  return createPortal(
    <div
      role="dialog"
      aria-labelledby="confirm-defaults-title"
      aria-describedby="confirm-defaults-desc"
      aria-modal="true"
      ref={dialogRef}
      className="fixed inset-0 bg-shadow-950/70 z-50 flex items-center justify-center animate-in fade-in duration-200"
    >
      <div className="bg-parchment-50 dark:bg-shadow-800 rounded-fantasy shadow-fantasy p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <h2
          id="confirm-defaults-title"
          className="font-serif text-xl font-bold text-ink-800 dark:text-parchment-100 mb-2"
        >
          Some settings will use defaults
        </h2>
        <p
          id="confirm-defaults-desc"
          className="text-ink-600 dark:text-parchment-400 text-sm mb-4"
        >
          The following dials haven't been set:
        </p>

        {/* Unset dials list */}
        {unsetDials.length > 0 && (
          <ul className="bg-parchment-100 dark:bg-shadow-700 rounded-fantasy p-4 mb-4 border border-ink-200 dark:border-shadow-600 space-y-2">
            {unsetDials.map((dial) => (
              <li
                key={dial.label}
                className="flex items-center text-sm"
              >
                <span className="text-ink-500 dark:text-parchment-500 mr-1">
                  •
                </span>
                <span className="text-ink-700 dark:text-parchment-300">
                  {dial.label}
                </span>
                <span className="text-ink-400 dark:text-parchment-500 mx-2">
                  →
                </span>
                <span className="text-gold-600 dark:text-gold-400 font-medium">
                  {dial.defaultValue}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Reassurance text */}
        <p className="text-ink-500 dark:text-parchment-500 text-sm mb-6">
          You can always change these later.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          {/* Secondary: Go Back */}
          <button
            ref={goBackButtonRef}
            onClick={onCancel}
            className="
              flex-1 py-3 px-4 rounded-fantasy border
              bg-parchment-100 dark:bg-shadow-700
              border-ink-300 dark:border-shadow-500
              text-ink-700 dark:text-parchment-200
              font-semibold
              hover:bg-parchment-200 dark:hover:bg-shadow-600
              focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2
              dark:focus:ring-offset-shadow-800
              transition-all duration-200
            "
          >
            Go Back
          </button>

          {/* Primary: Continue Anyway */}
          <button
            onClick={onConfirm}
            className="
              flex-1 py-3 px-4 rounded-fantasy border-2
              bg-gold-500 border-gold-600 text-ink-900
              font-serif font-semibold text-base
              hover:bg-gold-400 hover:border-gold-500
              dark:bg-gold-600 dark:border-gold-500
              dark:hover:bg-gold-500 dark:hover:border-gold-400
              shadow-gold-glow
              focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2
              dark:focus:ring-offset-shadow-800
              transition-all duration-200
            "
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
