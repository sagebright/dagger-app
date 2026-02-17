/**
 * AppShell — Viewport-locked layout with header + 65/35 content grid
 *
 * Provides the outer frame for all adventure stages:
 * - Full-height viewport (h-screen, overflow hidden)
 * - Header bar at top (56px)
 * - Two-column grid below: chat (65%) | panel (35%)
 *
 * Children are passed into the left and right slots.
 * The 1px divider between columns is handled via CSS border.
 */

import type { ReactNode } from 'react';
import { Header } from './Header';

// =============================================================================
// Types
// =============================================================================

export interface AppShellProps {
  /** Content for the left column (65% — typically ChatPanel) */
  chatSlot: ReactNode;
  /** Content for the right column (35% — stage-specific panel) */
  panelSlot: ReactNode;
  /** Adventure name for the header */
  adventureName?: string | null;
  /** Called when the home button is clicked */
  onHomeClick?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function AppShell({
  chatSlot,
  panelSlot,
  adventureName,
  onHomeClick,
}: AppShellProps) {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Header
        adventureName={adventureName}
        onHomeClick={onHomeClick}
      />
      <main className="app-layout flex-1 min-h-0" style={{ gridTemplateRows: '1fr' }}>
        {chatSlot}
        <aside className="content-panel" aria-label="Adventure panel">{panelSlot}</aside>
      </main>
    </div>
  );
}
