/**
 * Dial Validation Utilities
 *
 * Provides validation for dial values with descriptive error messages.
 */

import {
  isValidPartySize,
  isValidPartyTier,
  isValidSceneCount,
  isValidSessionLength,
  isValidThemes,
  DIAL_CONSTRAINTS,
} from '@dagger-app/shared-types';
import type { DialId, DialUpdate, ThemeOption } from '@dagger-app/shared-types';

// =============================================================================
// Dial Category Helpers
// =============================================================================

const CONCRETE_DIALS: DialId[] = ['partySize', 'partyTier', 'sceneCount', 'sessionLength'];
const CONCEPTUAL_DIALS: DialId[] = [
  'tone',
  'combatExplorationBalance',
  'npcDensity',
  'lethality',
  'emotionalRegister',
  'themes',
];

/**
 * Check if a dial ID is a conceptual dial
 */
export function isConceptualDial(dialId: DialId): boolean {
  return CONCEPTUAL_DIALS.includes(dialId);
}

/**
 * Check if a dial ID is a concrete dial
 */
export function isConcreteDial(dialId: DialId): boolean {
  return CONCRETE_DIALS.includes(dialId);
}

// =============================================================================
// Value Validation
// =============================================================================

/**
 * Validate a dial value based on its dial ID
 */
export function validateDialValue(dialId: DialId, value: unknown): boolean {
  switch (dialId) {
    case 'partySize':
      return typeof value === 'number' && isValidPartySize(value);

    case 'partyTier':
      return typeof value === 'number' && isValidPartyTier(value);

    case 'sceneCount':
      return typeof value === 'number' && isValidSceneCount(value);

    case 'sessionLength':
      return typeof value === 'string' && isValidSessionLength(value);

    case 'themes':
      return Array.isArray(value) && isValidThemes(value as ThemeOption[]);

    // Conceptual dials accept string or null
    case 'tone':
    case 'combatExplorationBalance':
    case 'npcDensity':
    case 'lethality':
    case 'emotionalRegister':
      return value === null || typeof value === 'string';

    default:
      return false;
  }
}

// =============================================================================
// Validation Results
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a dial update and return structured result
 */
export function validateDialUpdate(update: DialUpdate): ValidationResult {
  const isValid = validateDialValue(update.dialId, update.value);

  if (isValid) {
    return { valid: true };
  }

  return {
    valid: false,
    error: getDialValidationError(update.dialId, update.value) || 'Invalid value',
  };
}

/**
 * Get a descriptive error message for an invalid dial value
 */
export function getDialValidationError(dialId: DialId, value: unknown): string | null {
  // First check if the value is valid
  if (validateDialValue(dialId, value)) {
    return null;
  }

  switch (dialId) {
    case 'partySize':
      return `Party size must be an integer between ${DIAL_CONSTRAINTS.partySize.min} and ${DIAL_CONSTRAINTS.partySize.max}`;

    case 'partyTier':
      return 'Party tier must be 1-4';

    case 'sceneCount':
      return `Scene count must be an integer between ${DIAL_CONSTRAINTS.sceneCount.min} and ${DIAL_CONSTRAINTS.sceneCount.max}`;

    case 'sessionLength':
      return `Session length must be one of: ${DIAL_CONSTRAINTS.sessionLength.options.join(', ')}`;

    case 'themes':
      if (!Array.isArray(value)) {
        return 'Themes must be an array';
      }
      if (value.length > DIAL_CONSTRAINTS.themes.maxSelections) {
        return `Themes can have at most ${DIAL_CONSTRAINTS.themes.maxSelections} selections`;
      }
      return 'Themes contains invalid values';

    case 'tone':
    case 'combatExplorationBalance':
    case 'npcDensity':
    case 'lethality':
    case 'emotionalRegister':
      return `${formatDialName(dialId)} must be a string or null`;

    default:
      return `Unknown dial: ${dialId}`;
  }
}

/**
 * Format a dial ID into a human-readable name
 */
function formatDialName(dialId: DialId): string {
  const names: Record<DialId, string> = {
    partySize: 'Party size',
    partyTier: 'Party tier',
    sceneCount: 'Scene count',
    sessionLength: 'Session length',
    tone: 'Tone',
    combatExplorationBalance: 'Combat/exploration balance',
    npcDensity: 'NPC density',
    lethality: 'Lethality',
    emotionalRegister: 'Emotional register',
    themes: 'Themes',
  };
  return names[dialId] || dialId;
}

// =============================================================================
// Batch Validation
// =============================================================================

/**
 * Validate multiple dial updates at once
 */
export function validateDialUpdates(
  updates: DialUpdate[]
): { valid: boolean; errors: Map<DialId, string> } {
  const errors = new Map<DialId, string>();

  for (const update of updates) {
    const result = validateDialUpdate(update);
    if (!result.valid && result.error) {
      errors.set(update.dialId, result.error);
    }
  }

  return {
    valid: errors.size === 0,
    errors,
  };
}
