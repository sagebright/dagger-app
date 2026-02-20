/**
 * Component display value formatting
 *
 * Maps raw component values from SerializableComponentsState
 * to their human-readable display titles from the shared-types
 * choice definitions.
 */

import {
  SPAN_CHOICES,
  SCENES_CHOICES,
  MEMBERS_CHOICES,
  TIER_CHOICES,
  TENOR_CHOICES,
  PILLARS_CHOICES,
  CHORUS_CHOICES,
  THREADS_CHOICES,
} from '@sage-codex/shared-types';
import type {
  ComponentId,
  SerializableComponentsState,
  ComponentChoice,
} from '@sage-codex/shared-types';

// =============================================================================
// Choice Lookup Map
// =============================================================================

const CHOICE_MAP: Record<ComponentId, ComponentChoice<string | number>[]> = {
  span: SPAN_CHOICES,
  scenes: SCENES_CHOICES,
  members: MEMBERS_CHOICES,
  tier: TIER_CHOICES,
  tenor: TENOR_CHOICES,
  pillars: PILLARS_CHOICES,
  chorus: CHORUS_CHOICES,
  threads: THREADS_CHOICES,
};

/** Em dash used for unset component values */
const UNSET_DISPLAY = '\u2014';

// =============================================================================
// Public API
// =============================================================================

/**
 * Get the display string for a component's current value.
 *
 * Returns the choice title for set values, or an em dash for unset ones.
 * For threads (multi-select), returns comma-separated titles.
 */
export function formatComponentValue(
  componentId: ComponentId,
  components: SerializableComponentsState
): string {
  if (componentId === 'threads') {
    return formatThreadsValue(components.threads);
  }

  const rawValue = components[componentId];
  if (rawValue === null || rawValue === undefined) {
    return UNSET_DISPLAY;
  }

  return findChoiceTitle(componentId, rawValue);
}

// =============================================================================
// Helpers
// =============================================================================

function formatThreadsValue(threads: string[]): string {
  if (threads.length === 0) return UNSET_DISPLAY;

  const titles = threads.map((value) =>
    findChoiceTitle('threads', value)
  );

  return titles.join(', ');
}

function findChoiceTitle(
  componentId: ComponentId,
  value: string | number
): string {
  const choices = CHOICE_MAP[componentId];
  const match = choices.find((c) => c.value === value);
  return match?.title ?? String(value);
}
