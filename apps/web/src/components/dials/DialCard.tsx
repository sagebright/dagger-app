/**
 * DialCard Component
 *
 * Reusable card component for displaying a single dial with inline editing
 * controls. Foundation component for the dial tuning UI layout.
 *
 * Features:
 * - Label with optional required indicator
 * - Optional description text
 * - Value display area
 * - Children slot for inline controls (select, stepper, chips)
 * - Visual state for set vs unset values
 * - Fantasy-themed styling with responsive behavior
 */

import type { ReactNode } from 'react';

export interface DialCardProps {
  /** Display label for the dial (e.g., "Party Size") */
  label: string;
  /** Optional help text describing the dial */
  description?: string;
  /** Current value display (can be string or ReactNode) */
  value: ReactNode;
  /** The inline control (select, stepper, chips) */
  children: ReactNode;
  /** Show required indicator */
  isRequired?: boolean;
  /** Has user set a value (vs default) */
  isSet?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function DialCard({
  label,
  description,
  value,
  children,
  isRequired = false,
  isSet = false,
  className = '',
}: DialCardProps) {
  return (
    <div
      data-testid="dial-card"
      data-set={isSet ? 'true' : 'false'}
      className={`
        w-full flex flex-col gap-2 p-4 rounded-fantasy border
        shadow-fantasy
        ${
          isSet
            ? 'border-gold-400 bg-gold-50/30 dark:border-gold-600 dark:bg-gold-900/10'
            : 'border-ink-200 bg-parchment-50 dark:border-shadow-600 dark:bg-shadow-800'
        }
        ${className}
      `}
    >
      {/* Header row with label and required indicator */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-serif font-semibold text-ink-800 dark:text-parchment-200">
          {label}
        </span>

        {isRequired && (
          <span
            data-testid="required-indicator"
            aria-hidden="true"
            className="text-xs text-blood font-medium uppercase tracking-wide"
          >
            required
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p
          data-testid="dial-card-description"
          className="text-xs text-ink-500 dark:text-parchment-400 -mt-1"
        >
          {description}
        </p>
      )}

      {/* Value display */}
      <div className="text-sm text-ink-700 dark:text-parchment-300 font-medium">
        {value}
      </div>

      {/* Control slot */}
      <div className="mt-1">
        {children}
      </div>
    </div>
  );
}
