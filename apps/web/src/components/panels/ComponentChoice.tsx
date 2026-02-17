/**
 * ComponentChoice — Choice panel for selecting a single component value
 *
 * Replaces the summary panel when a user clicks a component row.
 * Supports two modes:
 *   - Single-select: click to pick one card (most components)
 *   - Multi-select: click to toggle up to 3 cards (Threads only)
 *
 * Layout: back button + header, scrollable card list, fixed confirm footer.
 */

import { useState, useCallback } from 'react';
import {
  COMPONENT_METADATA,
  SPAN_CHOICES,
  SCENES_CHOICES,
  MEMBERS_CHOICES,
  TIER_CHOICES,
  TENOR_CHOICES,
  PILLARS_CHOICES,
  CHORUS_CHOICES,
  THREADS_CHOICES,
} from '@dagger-app/shared-types';
import type {
  ComponentId,
  ComponentChoice as ComponentChoiceType,
} from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface ComponentChoiceProps {
  /** Which component to display choices for */
  componentId: ComponentId;
  /** Current value (for pre-selection) */
  currentValue: string | number | string[] | null;
  /** Called when the user confirms their selection */
  onConfirm: (componentId: ComponentId, value: string | number | string[]) => void;
  /** Called when the user clicks "Return to Attuning" */
  onBack: () => void;
}

type ChoiceValue = string | number;

// =============================================================================
// Choice Lookup
// =============================================================================

const CHOICE_MAP: Record<ComponentId, ComponentChoiceType<ChoiceValue>[]> = {
  span: SPAN_CHOICES,
  scenes: SCENES_CHOICES,
  members: MEMBERS_CHOICES,
  tier: TIER_CHOICES,
  tenor: TENOR_CHOICES,
  pillars: PILLARS_CHOICES,
  chorus: CHORUS_CHOICES,
  threads: THREADS_CHOICES,
};

const MAX_THREAD_SELECTIONS = 3;

// =============================================================================
// Component
// =============================================================================

export function ComponentChoice({
  componentId,
  currentValue,
  onConfirm,
  onBack,
}: ComponentChoiceProps) {
  const metadata = COMPONENT_METADATA.find((m) => m.id === componentId);
  const choices = CHOICE_MAP[componentId] ?? [];
  const isMultiSelect = metadata?.selectMode === 'multi';

  // Local selection state
  const [selectedSingle, setSelectedSingle] = useState<ChoiceValue | null>(
    isMultiSelect ? null : (currentValue as ChoiceValue | null)
  );
  const [selectedMulti, setSelectedMulti] = useState<ChoiceValue[]>(
    isMultiSelect && Array.isArray(currentValue) ? currentValue : []
  );

  const hasSelection = isMultiSelect
    ? selectedMulti.length > 0
    : selectedSingle !== null;

  // Single-select handler
  const handleSingleSelect = useCallback((value: ChoiceValue) => {
    setSelectedSingle(value);
  }, []);

  // Multi-select toggle handler
  const handleMultiToggle = useCallback(
    (value: ChoiceValue) => {
      setSelectedMulti((prev) => {
        if (prev.includes(value)) {
          return prev.filter((v) => v !== value);
        }
        if (prev.length >= MAX_THREAD_SELECTIONS) {
          return prev;
        }
        return [...prev, value];
      });
    },
    []
  );

  // Confirm selection
  const handleConfirm = useCallback(() => {
    if (!hasSelection) return;

    if (isMultiSelect) {
      onConfirm(componentId, selectedMulti as string[]);
    } else if (selectedSingle !== null) {
      onConfirm(componentId, selectedSingle);
    }
  }, [componentId, hasSelection, isMultiSelect, onConfirm, selectedMulti, selectedSingle]);

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Header with back button */}
      <div
        className="flex-shrink-0"
        style={{
          padding: 'var(--panel-padding)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          className="back-link"
          onClick={onBack}
          type="button"
        >
          <BackArrowIcon />
          Return to Attuning
        </button>
        <div
          className="font-serif text-[18px] font-semibold mt-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {metadata?.label ?? componentId}
        </div>
        <div
          className="font-serif text-[14px] italic mt-2 leading-[1.5]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {metadata?.question ?? ''}
        </div>
      </div>

      {/* Choice cards */}
      <div
        className="flex-1 overflow-y-auto scrollbar-panel flex flex-col gap-2"
        style={{ padding: '16px var(--panel-padding)' }}
      >
        {choices.map((choice) => {
          const isSelected = isMultiSelect
            ? selectedMulti.includes(choice.value)
            : selectedSingle === choice.value;

          return (
            <ChoiceCard
              key={String(choice.value)}
              title={choice.title}
              description={choice.description}
              isSelected={isSelected}
              onClick={() =>
                isMultiSelect
                  ? handleMultiToggle(choice.value)
                  : handleSingleSelect(choice.value)
              }
            />
          );
        })}
      </div>

      {/* Confirm footer */}
      <div
        className="flex-shrink-0"
        style={{
          padding: '12px var(--panel-padding) 32px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <button
          className="footer-button"
          disabled={!hasSelection}
          onClick={handleConfirm}
          type="button"
        >
          Select {metadata?.label ?? componentId}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface ChoiceCardProps {
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

function ChoiceCard({ title, description, isSelected, onClick }: ChoiceCardProps) {
  const cardClass = isSelected
    ? 'choice-card choice-card--selected'
    : 'choice-card';

  return (
    <button
      className={cardClass}
      onClick={onClick}
      type="button"
      aria-pressed={isSelected}
    >
      <div className="choice-card-title">{title}</div>
      <div className="choice-card-desc">{description}</div>
    </button>
  );
}

function BackArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
