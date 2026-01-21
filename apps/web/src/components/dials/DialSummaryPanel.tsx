/**
 * DialSummaryPanel Component
 *
 * Right-side panel showing all dial selectors inline.
 * Each dial is always editable with options visible.
 * Organized by category (Concrete vs Conceptual) with collapsible sections.
 * Shows progress and "Continue to Frame" button when complete.
 * Fantasy-themed styling.
 */

import { useState, memo, type ReactNode } from 'react';
import type { DialId } from '@dagger-app/shared-types';
import {
  CONCRETE_DIAL_METADATA,
  CONCEPTUAL_DIAL_METADATA,
} from '@dagger-app/shared-types';
import { DialProgressBar } from './DialProgressBar';
import { DialSummaryItem } from './DialSummaryItem';
import type { DialsState } from '../../stores/dialsStore';

// Total number of dials
const TOTAL_DIALS = 10;

export interface DialSummaryPanelProps {
  /** Complete dials state from store */
  dials: DialsState;
  /** Callback when user toggles confirmation for a dial */
  onConfirmToggle: (dialId: DialId) => void;
  /** Callback when user clicks Continue to Frame */
  onContinue: () => void;
  /** Render function for selector widgets */
  renderSelector: (dialId: DialId) => ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Collapsible section component
 */
interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-ink-200 dark:border-shadow-600 rounded-fantasy overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="
          w-full flex items-center justify-between px-3 py-2
          bg-parchment-100 dark:bg-shadow-700
          hover:bg-parchment-200 dark:hover:bg-shadow-600
          transition-colors duration-200
        "
      >
        <span className="text-sm font-serif font-semibold text-ink-700 dark:text-parchment-200">
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-ink-500 dark:text-parchment-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="p-2 space-y-2 bg-parchment-50/50 dark:bg-shadow-800/50">
          {children}
        </div>
      )}
    </div>
  );
}

function DialSummaryPanelComponent({
  dials,
  onConfirmToggle,
  onContinue,
  renderSelector,
  className = '',
}: DialSummaryPanelProps) {
  const confirmedCount = dials.confirmedDials.size;
  const allConfirmed = confirmedCount === TOTAL_DIALS;

  return (
    <div
      data-testid="dial-summary-panel"
      className={`
        flex flex-col h-full
        bg-parchment-50 dark:bg-shadow-900
        border-l border-ink-200 dark:border-shadow-600
        ${className}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-ink-200 dark:border-shadow-600">
        <h2 className="text-lg font-serif font-bold text-ink-800 dark:text-parchment-100 mb-3">
          Adventure Dials
        </h2>
        <DialProgressBar confirmedCount={confirmedCount} totalCount={TOTAL_DIALS} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Concrete Dials Section */}
        <CollapsibleSection title="Concrete">
          {CONCRETE_DIAL_METADATA.map((meta) => (
            <DialSummaryItem
              key={meta.id}
              dialId={meta.id}
              label={meta.label}
              isConfirmed={dials.confirmedDials.has(meta.id)}
              onConfirmToggle={() => onConfirmToggle(meta.id)}
              renderSelector={() => renderSelector(meta.id)}
            />
          ))}
        </CollapsibleSection>

        {/* Conceptual Dials Section */}
        <CollapsibleSection title="Conceptual">
          {CONCEPTUAL_DIAL_METADATA.map((meta) => (
            <DialSummaryItem
              key={meta.id}
              dialId={meta.id}
              label={meta.label}
              isConfirmed={dials.confirmedDials.has(meta.id)}
              onConfirmToggle={() => onConfirmToggle(meta.id)}
              renderSelector={() => renderSelector(meta.id)}
            />
          ))}
        </CollapsibleSection>
      </div>

      {/* Footer with Continue button */}
      {allConfirmed && (
        <div className="p-4 border-t border-ink-200 dark:border-shadow-600">
          <button
            type="button"
            onClick={onContinue}
            className="
              w-full py-3 px-4 rounded-fantasy border-2
              bg-gold-500 border-gold-600 text-ink-900
              font-serif font-semibold text-base
              hover:bg-gold-400 hover:border-gold-500
              dark:bg-gold-600 dark:border-gold-500 dark:text-ink-900
              dark:hover:bg-gold-500 dark:hover:border-gold-400
              shadow-gold-glow
              transition-all duration-200
            "
          >
            Continue to Frame →
          </button>
        </div>
      )}
    </div>
  );
}

/** Memoized DialSummaryPanel to prevent unnecessary re-renders during parent state updates */
export const DialSummaryPanel = memo(DialSummaryPanelComponent);
