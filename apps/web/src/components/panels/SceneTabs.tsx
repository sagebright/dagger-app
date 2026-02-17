/**
 * SceneTabs -- Horizontal scene tab selector for the Weaving stage
 *
 * Displays numbered scene tabs with three states:
 *   active    -- gold fill, currently being worked on
 *   confirmed -- gold-dim wash, locked
 *   inactive  -- muted surface, upcoming
 *
 * Sequential flow: Scene 1 is active first. Each confirmation locks
 * the scene and advances to the next.
 */

import type { SceneArcData } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface SceneTabsProps {
  /** Scene arc data for each tab */
  sceneArcs: SceneArcData[];
  /** Index of the currently active scene */
  activeSceneIndex: number;
  /** Called when a tab is clicked (only confirmed tabs are clickable) */
  onTabClick: (index: number) => void;
}

type TabState = 'active' | 'confirmed' | 'inactive';

// =============================================================================
// Component
// =============================================================================

export function SceneTabs({
  sceneArcs,
  activeSceneIndex,
  onTabClick,
}: SceneTabsProps) {
  return (
    <div
      className="flex flex-row gap-1.5"
      style={{ padding: '0 var(--panel-padding)', marginBottom: '12px' }}
      role="tablist"
      aria-label="Scene tabs"
    >
      {sceneArcs.map((arc, index) => {
        const state = getTabState(index, activeSceneIndex, arc.confirmed);
        return (
          <SceneTab
            key={arc.id}
            label={`Scene ${arc.sceneNumber}`}
            state={state}
            isSelected={index === activeSceneIndex}
            onClick={() => handleTabClick(state, index, onTabClick)}
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// Tab State Logic
// =============================================================================

function getTabState(
  index: number,
  activeIndex: number,
  isConfirmed: boolean
): TabState {
  if (isConfirmed) return 'confirmed';
  if (index === activeIndex) return 'active';
  return 'inactive';
}

function handleTabClick(
  state: TabState,
  index: number,
  onTabClick: (index: number) => void
): void {
  // Only confirmed tabs are clickable (for review)
  if (state === 'confirmed') {
    onTabClick(index);
  }
}

// =============================================================================
// Sub-components
// =============================================================================

interface SceneTabProps {
  label: string;
  state: TabState;
  isSelected: boolean;
  onClick: () => void;
}

function SceneTab({ label, state, isSelected, onClick }: SceneTabProps) {
  const stateClass =
    state === 'active'
      ? 'scene-badge--active'
      : state === 'confirmed'
        ? 'scene-badge--confirmed'
        : 'scene-badge--inactive';

  return (
    <button
      className={`scene-badge ${stateClass}`}
      onClick={onClick}
      role="tab"
      aria-selected={isSelected}
      aria-label={label}
      type="button"
      disabled={state === 'inactive'}
    >
      {label}
    </button>
  );
}
