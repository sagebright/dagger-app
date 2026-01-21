/**
 * Custom Frame Wizard Types
 *
 * Type definitions for the custom frame creation wizard feature.
 * Includes wizard state management, API contracts, and validation helpers.
 */

import type { DaggerheartCustomFrame } from './database.js';

// ============================================================================
// WIZARD STEP DEFINITIONS
// ============================================================================

/**
 * Ordered wizard steps for custom frame creation
 */
export const CUSTOM_FRAME_WIZARD_STEPS = [
  'identity',       // Title, concept, pitch
  'tone',           // Tone & feel, themes
  'details',        // Complexity, touchstones, overview
  'heritage',       // Heritage & classes modifications
  'principles',     // Player and GM principles
  'world',          // Distinctions, inciting incident
  'mechanics',      // Custom mechanics
  'questions',      // Session zero questions
  'review',         // Final review before save
] as const;

export type CustomFrameWizardStep = (typeof CUSTOM_FRAME_WIZARD_STEPS)[number];

/**
 * Step metadata for UI rendering
 */
export interface WizardStepMeta {
  id: CustomFrameWizardStep;
  title: string;
  description: string;
  isRequired: boolean;
}

export const WIZARD_STEP_META: Record<CustomFrameWizardStep, WizardStepMeta> = {
  identity: {
    id: 'identity',
    title: 'Frame Identity',
    description: 'Define the core identity of your campaign frame',
    isRequired: true,
  },
  tone: {
    id: 'tone',
    title: 'Tone & Themes',
    description: 'Establish the emotional landscape and major themes',
    isRequired: true,
  },
  details: {
    id: 'details',
    title: 'Frame Details',
    description: 'Add complexity rating, touchstones, and overview',
    isRequired: false,
  },
  heritage: {
    id: 'heritage',
    title: 'Heritage & Classes',
    description: 'Configure ancestry and class modifications',
    isRequired: false,
  },
  principles: {
    id: 'principles',
    title: 'Principles',
    description: 'Define player and GM guiding principles',
    isRequired: false,
  },
  world: {
    id: 'world',
    title: 'World Building',
    description: 'Create distinctions and inciting incident',
    isRequired: false,
  },
  mechanics: {
    id: 'mechanics',
    title: 'Custom Mechanics',
    description: 'Design unique game mechanics for your frame',
    isRequired: false,
  },
  questions: {
    id: 'questions',
    title: 'Session Zero',
    description: 'Craft session zero questions for your table',
    isRequired: false,
  },
  review: {
    id: 'review',
    title: 'Review & Save',
    description: 'Review your frame and save',
    isRequired: true,
  },
};

// ============================================================================
// WIZARD STATE TYPES
// ============================================================================

/**
 * Required fields for frame creation (Step 1: Identity)
 */
export interface CustomFrameIdentity {
  title: string;
  concept: string;
  pitch: string;
}

/**
 * Required fields for tone (Step 2: Tone)
 */
export interface CustomFrameTone {
  tone_feel: string[];
  themes: string[];
}

/**
 * Optional detail fields (Step 3: Details)
 */
export interface CustomFrameDetails {
  complexity_rating?: number;
  touchstones?: string[];
  overview?: string;
}

/**
 * Heritage class modification entry
 */
export interface HeritageClassEntry {
  name: string;
  modification: string;
  available: boolean;
  additionalPrompts?: string[];
}

/**
 * Heritage and classes configuration (Step 4: Heritage)
 */
export interface CustomFrameHeritage {
  communities?: HeritageClassEntry[];
  ancestries?: HeritageClassEntry[];
  classes?: HeritageClassEntry[];
}

/**
 * Principles configuration (Step 5: Principles)
 */
export interface CustomFramePrinciples {
  player_principles?: string[];
  gm_principles?: string[];
}

/**
 * Distinction entry for world building
 */
export interface DistinctionEntry {
  category: 'world' | 'location' | 'philosophy' | 'figure' | 'other';
  title: string;
  description: string;
  isSecret?: boolean;
}

/**
 * World building configuration (Step 6: World)
 */
export interface CustomFrameWorld {
  distinctions?: DistinctionEntry[];
  inciting_incident?: string;
}

/**
 * Custom mechanic definition
 */
export interface CustomMechanicEntry {
  name: string;
  description: string;
  rules: string;
  impact: 'detail' | 'items' | 'subsystem';
}

/**
 * Custom mechanics configuration (Step 7: Mechanics)
 */
export interface CustomFrameMechanics {
  custom_mechanics?: CustomMechanicEntry[];
}

/**
 * Session zero questions (Step 8: Questions)
 */
export interface CustomFrameQuestions {
  session_zero_questions?: string[];
}

/**
 * Complete wizard state combining all steps
 */
export interface CustomFrameWizardState {
  currentStep: CustomFrameWizardStep;
  identity: Partial<CustomFrameIdentity>;
  tone: Partial<CustomFrameTone>;
  details: CustomFrameDetails;
  heritage: CustomFrameHeritage;
  principles: CustomFramePrinciples;
  world: CustomFrameWorld;
  mechanics: CustomFrameMechanics;
  questions: CustomFrameQuestions;
  isDirty: boolean;
  lastSaved?: string;
}

/**
 * Initial empty wizard state
 */
export const INITIAL_WIZARD_STATE: CustomFrameWizardState = {
  currentStep: 'identity',
  identity: {},
  tone: {},
  details: {},
  heritage: {},
  principles: {},
  world: {},
  mechanics: {},
  questions: {},
  isDirty: false,
};

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create custom frame request payload
 */
export interface CreateCustomFrameRequest {
  title: string;
  concept: string;
  pitch: string;
  tone_feel: string[];
  themes: string[];
  complexity_rating?: number;
  touchstones?: string[];
  overview?: string;
  heritage_classes?: CustomFrameHeritage;
  player_principles?: string[];
  gm_principles?: string[];
  distinctions?: DistinctionEntry[];
  inciting_incident?: string;
  custom_mechanics?: CustomMechanicEntry[];
  session_zero_questions?: string[];
}

/**
 * Update custom frame request payload
 */
export interface UpdateCustomFrameRequest extends Partial<CreateCustomFrameRequest> {
  id: string;
}

/**
 * Custom frame response from API
 */
export interface CustomFrameResponse {
  success: boolean;
  data?: DaggerheartCustomFrame;
  error?: string;
}

/**
 * List custom frames response
 */
export interface ListCustomFramesResponse {
  success: boolean;
  data?: DaggerheartCustomFrame[];
  total?: number;
  error?: string;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Complexity rating range
 */
export const COMPLEXITY_RATING_MIN = 1;
export const COMPLEXITY_RATING_MAX = 4;

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates that required identity fields are present and non-empty
 */
export function validateIdentity(identity: Partial<CustomFrameIdentity>): ValidationResult {
  const errors: string[] = [];

  if (!identity.title?.trim()) {
    errors.push('Title is required');
  }
  if (!identity.concept?.trim()) {
    errors.push('Concept is required');
  }
  if (!identity.pitch?.trim()) {
    errors.push('Pitch is required');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates that required tone fields are present and have values
 */
export function validateTone(tone: Partial<CustomFrameTone>): ValidationResult {
  const errors: string[] = [];

  if (!tone.tone_feel || tone.tone_feel.length === 0) {
    errors.push('At least one tone/feel descriptor is required');
  }
  if (!tone.themes || tone.themes.length === 0) {
    errors.push('At least one theme is required');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates complexity rating is within allowed range
 */
export function validateComplexityRating(rating: number | undefined): ValidationResult {
  const errors: string[] = [];

  if (rating !== undefined) {
    if (!Number.isInteger(rating)) {
      errors.push('Complexity rating must be a whole number');
    } else if (rating < COMPLEXITY_RATING_MIN || rating > COMPLEXITY_RATING_MAX) {
      errors.push(`Complexity rating must be between ${COMPLEXITY_RATING_MIN} and ${COMPLEXITY_RATING_MAX}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates the entire wizard state for completeness
 */
export function validateWizardState(state: CustomFrameWizardState): ValidationResult {
  const errors: string[] = [];

  // Validate required steps
  const identityResult = validateIdentity(state.identity);
  const toneResult = validateTone(state.tone);
  const complexityResult = validateComplexityRating(state.details.complexity_rating);

  errors.push(...identityResult.errors);
  errors.push(...toneResult.errors);
  errors.push(...complexityResult.errors);

  return { isValid: errors.length === 0, errors };
}

/**
 * Checks if a wizard step is complete
 */
export function isStepComplete(step: CustomFrameWizardStep, state: CustomFrameWizardState): boolean {
  switch (step) {
    case 'identity':
      return validateIdentity(state.identity).isValid;
    case 'tone':
      return validateTone(state.tone).isValid;
    case 'details':
      // Optional step - always "complete" for navigation purposes
      return true;
    case 'heritage':
      return true;
    case 'principles':
      return true;
    case 'world':
      return true;
    case 'mechanics':
      return true;
    case 'questions':
      return true;
    case 'review':
      // Review is complete when all required steps are valid
      return validateWizardState(state).isValid;
    default:
      return false;
  }
}

/**
 * Converts wizard state to API request payload
 */
export function wizardStateToRequest(state: CustomFrameWizardState): CreateCustomFrameRequest | null {
  const validation = validateWizardState(state);
  if (!validation.isValid) {
    return null;
  }

  return {
    title: state.identity.title!,
    concept: state.identity.concept!,
    pitch: state.identity.pitch!,
    tone_feel: state.tone.tone_feel!,
    themes: state.tone.themes!,
    complexity_rating: state.details.complexity_rating,
    touchstones: state.details.touchstones,
    overview: state.details.overview,
    heritage_classes: Object.keys(state.heritage).length > 0 ? state.heritage : undefined,
    player_principles: state.principles.player_principles,
    gm_principles: state.principles.gm_principles,
    distinctions: state.world.distinctions,
    inciting_incident: state.world.inciting_incident,
    custom_mechanics: state.mechanics.custom_mechanics,
    session_zero_questions: state.questions.session_zero_questions,
  };
}

/**
 * Converts a DaggerheartCustomFrame to wizard state for editing
 */
export function frameToWizardState(frame: DaggerheartCustomFrame): CustomFrameWizardState {
  return {
    currentStep: 'review',
    identity: {
      title: frame.title,
      concept: frame.concept,
      pitch: frame.pitch,
    },
    tone: {
      tone_feel: frame.tone_feel,
      themes: frame.themes,
    },
    details: {
      complexity_rating: frame.complexity_rating ?? undefined,
      touchstones: frame.touchstones ?? undefined,
      overview: frame.overview ?? undefined,
    },
    heritage: (frame.heritage_classes as unknown as CustomFrameHeritage) ?? {},
    principles: {
      player_principles: frame.player_principles ?? undefined,
      gm_principles: frame.gm_principles ?? undefined,
    },
    world: {
      distinctions: (frame.distinctions as unknown as DistinctionEntry[]) ?? undefined,
      inciting_incident: frame.inciting_incident ?? undefined,
    },
    mechanics: {
      custom_mechanics: (frame.custom_mechanics as unknown as CustomMechanicEntry[]) ?? undefined,
    },
    questions: {
      session_zero_questions: frame.session_zero_questions ?? undefined,
    },
    isDirty: false,
    lastSaved: frame.updated_at ?? frame.created_at ?? undefined,
  };
}
