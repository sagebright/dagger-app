/**
 * DialGroup Component
 *
 * Container component for grouping related dials with a header.
 * Organizes dials into logical sections (Party, Session, Atmosphere, Themes)
 * with a responsive grid layout.
 *
 * Features:
 * - Section header with decorative line styling
 * - Responsive grid: 3 columns (desktop), 2 columns (tablet), 1 column (mobile)
 * - Accessible grouping with role="group" and aria-labelledby
 * - Fantasy-themed styling matching project design system
 */

import { useId, type ReactNode } from 'react';

export interface DialGroupProps {
  /** Section title (e.g., "Party", "Session", "Atmosphere") */
  title: string;
  /** Child elements - typically DialCard components */
  children: ReactNode;
}

export function DialGroup({ title, children }: DialGroupProps) {
  const headerId = useId();

  return (
    <section
      role="group"
      aria-labelledby={headerId}
      data-testid="dial-group"
      className="flex flex-col gap-4"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <h3
          id={headerId}
          data-testid="dial-group-header"
          className="font-serif text-lg font-semibold text-ink-700 dark:text-parchment-200 whitespace-nowrap"
        >
          {title}
        </h3>
        <div
          data-testid="dial-group-decorative-line"
          aria-hidden="true"
          className="flex-1 h-px bg-gradient-to-r from-ink-300 via-gold-400 to-transparent dark:from-shadow-500 dark:via-gold-600 dark:to-transparent"
        />
      </div>

      {/* Responsive Grid */}
      <div
        data-testid="dial-group-grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {children}
      </div>
    </section>
  );
}
