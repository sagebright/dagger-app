/**
 * StageDropdown -- 6-stage navigation dropdown for the Sage Codex
 *
 * Sits in the panel header and shows all 6 stages of the Unfolding.
 * States:
 *   completed -- stages the user has passed through (clickable, view-only)
 *   current   -- the active stage (gold highlight)
 *   future    -- stages not yet reached (locked, non-interactive)
 *
 * Backward navigation triggers a callback but is view-only: the user
 * can review sealed stages without modifying them.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { STAGES } from '@dagger-app/shared-types';
import type { Stage } from '@dagger-app/shared-types';

// =============================================================================
// Stage Descriptions (shown under each stage name)
// =============================================================================

const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  invoking: 'What shape will your adventure take?',
  attuning: 'How should it feel?',
  binding: 'Which frame holds the story?',
  weaving: 'How does the plot unfold?',
  inscribing: 'What unfolds in each scene?',
  delivering: 'Your tale awaits',
};

// =============================================================================
// Types
// =============================================================================

export interface StageDropdownProps {
  /** The current active stage */
  currentStage: Stage;
  /** Called when the user navigates to a completed stage (view-only) */
  onNavigate?: (stage: Stage) => void;
}

type StageState = 'completed' | 'current' | 'future';

// =============================================================================
// Component
// =============================================================================

export function StageDropdown({ currentStage, onNavigate }: StageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentStageInfo = STAGES.find((s) => s.id === currentStage);
  const currentOrder = currentStageInfo?.order ?? 0;

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  function getStageState(stageOrder: number): StageState {
    if (stageOrder < currentOrder) return 'completed';
    if (stageOrder === currentOrder) return 'current';
    return 'future';
  }

  function handleStageClick(stage: Stage, state: StageState) {
    if (state === 'future') return;
    if (state === 'completed' && onNavigate) {
      onNavigate(stage);
    }
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        className="stage-dropdown-trigger"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        type="button"
      >
        <span
          className="text-[13px] font-medium"
          style={{ color: 'var(--accent-gold)' }}
        >
          {currentStageInfo?.label ?? 'Unknown'}
        </span>
        <span
          className="text-[12px]"
          style={{ color: 'var(--text-muted)' }}
        >
          {STAGE_DESCRIPTIONS[currentStage]}
        </span>
        <span
          className="text-[10px] ml-[-2px]"
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }}
        >
          &#x25BE;
        </span>
      </button>

      {isOpen && (
        <div ref={menuRef} className="stage-dropdown-menu" role="menu">
          {STAGES.map((stage) => {
            const state = getStageState(stage.order);
            return (
              <StageDropdownItem
                key={stage.id}
                stage={stage.id}
                label={stage.label}
                description={STAGE_DESCRIPTIONS[stage.id]}
                state={state}
                onClick={() => handleStageClick(stage.id, state)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface StageDropdownItemProps {
  stage: Stage;
  label: string;
  description: string;
  state: StageState;
  onClick: () => void;
}

function StageDropdownItem({
  label,
  description,
  state,
  onClick,
}: StageDropdownItemProps) {
  const stateClass =
    state === 'current'
      ? 'stage-dropdown-item--current'
      : state === 'completed'
        ? 'stage-dropdown-item--completed'
        : 'stage-dropdown-item--future';

  return (
    <button
      className={`stage-dropdown-item ${stateClass}`}
      onClick={onClick}
      role="menuitem"
      tabIndex={state === 'future' ? -1 : 0}
      disabled={state === 'future'}
      type="button"
    >
      <div className="flex flex-col gap-px min-w-0">
        <span>{label}</span>
        <span
          className="text-[11px] font-normal"
          style={{
            color:
              state === 'current'
                ? 'var(--accent-gold)'
                : 'var(--text-muted)',
            opacity: state === 'current' ? 0.7 : 1,
          }}
        >
          {description}
        </span>
      </div>
      {state === 'future' && (
        <span className="flex items-center flex-shrink-0 ml-auto pl-3">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
      )}
    </button>
  );
}
