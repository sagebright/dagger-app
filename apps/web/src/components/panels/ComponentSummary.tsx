/**
 * ComponentSummary — Right panel content for the Attuning stage
 *
 * Displays the 8 adventure components grouped as:
 *   - Session: Span, Scenes
 *   - Party: Members, Tier
 *   - Essence: Tenor, Pillars, Chorus, Threads
 *
 * Each row shows confirmed/unconfirmed state with gold treatment
 * on confirmed rows. Clicking a row opens the ComponentChoice panel.
 *
 * Includes the StageFooter with "Continue to Binding" button.
 */

import { StageFooter } from '@/components/layout/StageFooter';
import {
  COMPONENT_GROUPS,
  COMPONENT_METADATA,
} from '@sage-codex/shared-types';
import type {
  ComponentId,
  ComponentGroup,
  SerializableComponentsState,
} from '@sage-codex/shared-types';
import { formatComponentValue, getThreadsTooltip } from './component-display';

// =============================================================================
// Types
// =============================================================================

export interface ComponentSummaryProps {
  /** Current component selections */
  components: SerializableComponentsState;
  /** Called when a component row is clicked */
  onSelectComponent: (componentId: ComponentId) => void;
  /** Called when "Continue to Binding" is clicked */
  onAdvance: () => void;
  /** Whether the stage is ready for advancement */
  isReady: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ComponentSummary({
  components,
  onSelectComponent,
  onAdvance,
  isReady,
}: ComponentSummaryProps) {
  const confirmedCount = components.confirmedComponents.length;

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Panel header */}
      <div
        className="flex-shrink-0 flex items-center gap-3"
        style={{ padding: '12px var(--panel-padding) 4px' }}
      >
        <div className="flex-1 min-w-0">
          <div
            className="font-serif text-[16px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Attuning
          </div>
          <div
            className="text-[12px] mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <span style={{ color: 'var(--accent-gold)', fontWeight: 500 }}>
              {confirmedCount}
            </span>{' '}
            of 8 gathered
          </div>
        </div>
      </div>

      {/* Component list */}
      <div
        className="flex-1 overflow-y-auto scrollbar-panel"
        style={{ padding: '8px var(--panel-padding)' }}
      >
        {COMPONENT_GROUPS.map((group) => (
          <ComponentGroupSection
            key={group.id}
            groupId={group.id}
            label={group.label}
            componentIds={group.components}
            components={components}
            onSelectComponent={onSelectComponent}
          />
        ))}
      </div>

      {/* Fixed footer */}
      <StageFooter
        label="Continue to Binding"
        isReady={isReady}
        onAdvance={onAdvance}
      />
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface ComponentGroupSectionProps {
  groupId: ComponentGroup;
  label: string;
  componentIds: ComponentId[];
  components: SerializableComponentsState;
  onSelectComponent: (componentId: ComponentId) => void;
}

function ComponentGroupSection({
  label,
  componentIds,
  components,
  onSelectComponent,
}: ComponentGroupSectionProps) {
  return (
    <div className="mt-5 first:mt-3">
      <div className="component-group-label">{label}</div>
      {componentIds.map((id) => (
        <ComponentRow
          key={id}
          componentId={id}
          components={components}
          onClick={() => onSelectComponent(id)}
        />
      ))}
    </div>
  );
}

interface ComponentRowProps {
  componentId: ComponentId;
  components: SerializableComponentsState;
  onClick: () => void;
}

function ComponentRow({ componentId, components, onClick }: ComponentRowProps) {
  const metadata = COMPONENT_METADATA.find((m) => m.id === componentId);
  const isConfirmed = components.confirmedComponents.includes(componentId);
  const displayValue = formatComponentValue(componentId, components);
  const tooltip = componentId === 'threads'
    ? getThreadsTooltip(components.threads) ?? undefined
    : undefined;

  const rowClass = isConfirmed
    ? 'component-row component-row--confirmed'
    : 'component-row component-row--unconfirmed';

  return (
    <button
      className={rowClass}
      onClick={onClick}
      type="button"
      aria-label={`Select ${metadata?.label ?? componentId}`}
    >
      <span className="component-label">
        {metadata?.label ?? componentId}
      </span>
      <span className="component-value" title={tooltip}>
        {displayValue}
      </span>
    </button>
  );
}
