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
  isValidTone,
  isValidNPCDensity,
  isValidLethality,
  isValidEmotionalRegister,
  isValidPillarBalance,
  DIAL_CONSTRAINTS,
} from '@dagger-app/shared-types';
import type { DialId, DialUpdate, ThemeOption, PillarBalance } from '@dagger-app/shared-types';

// =============================================================================
// Dial Category Helpers
// =============================================================================

const CONCRETE_DIALS: DialId[] = ['partySize', 'partyTier', 'sceneCount', 'sessionLength'];
const CONCEPTUAL_DIALS: DialId[] = [
  'tone',
  'pillarBalance',
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

    // Discrete conceptual dials with specific option types
    case 'tone':
      return value === null || (typeof value === 'string' && isValidTone(value));

    case 'npcDensity':
      return value === null || (typeof value === 'string' && isValidNPCDensity(value));

    case 'lethality':
      return value === null || (typeof value === 'string' && isValidLethality(value));

    case 'emotionalRegister':
      return value === null || (typeof value === 'string' && isValidEmotionalRegister(value));

    // PillarBalance is a complex object
    case 'pillarBalance':
      return value === null || isValidPillarBalance(value as PillarBalance);

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
      return `Party size must be one of: ${DIAL_CONSTRAINTS.partySize.options.join(', ')}`;

    case 'partyTier':
      return `Party tier must be one of: ${DIAL_CONSTRAINTS.partyTier.options.join(', ')}`;

    case 'sceneCount':
      return `Scene count must be one of: ${DIAL_CONSTRAINTS.sceneCount.options.join(', ')}`;

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
      return `Tone must be null or one of: ${DIAL_CONSTRAINTS.tone.options.join(', ')}`;

    case 'npcDensity':
      return `NPC density must be null or one of: ${DIAL_CONSTRAINTS.npcDensity.options.join(', ')}`;

    case 'lethality':
      return `Lethality must be null or one of: ${DIAL_CONSTRAINTS.lethality.options.join(', ')}`;

    case 'emotionalRegister':
      return `Emotional register must be null or one of: ${DIAL_CONSTRAINTS.emotionalRegister.options.join(', ')}`;

    case 'pillarBalance':
      return 'Pillar balance must be null or an object with primary, secondary, and tertiary pillars (combat, exploration, social) with no duplicates';

    default:
      return `Unknown dial: ${dialId}`;
  }
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
