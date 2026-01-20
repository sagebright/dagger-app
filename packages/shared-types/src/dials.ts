/**
 * Daggerheart Adventure Dial Type Definitions
 *
 * Dials are the tuning mechanism for adventure generation.
 * Some are concrete (party size), others are conceptual (tone).
 */

// =============================================================================
// Adventure Phases
// =============================================================================

/**
 * Phases of the adventure generation workflow
 */
export type Phase =
  | 'setup'
  | 'dial-tuning'
  | 'frame'
  | 'outline'
  | 'scenes'
  | 'npcs'
  | 'adversaries'
  | 'items'
  | 'echoes'
  | 'complete';

/**
 * Phase metadata
 */
export interface PhaseInfo {
  id: Phase;
  label: string;
  description: string;
  order: number;
}

export const PHASES: PhaseInfo[] = [
  { id: 'setup', label: 'Setup', description: 'Adventure name and folder', order: 0 },
  { id: 'dial-tuning', label: 'Dial Tuning', description: '14 dials via chat', order: 1 },
  { id: 'frame', label: 'Frame', description: 'Adventure framework', order: 2 },
  { id: 'outline', label: 'Outline', description: '3-6 scene briefs', order: 3 },
  { id: 'scenes', label: 'Scenes', description: 'Draft-feedback-revise per scene', order: 4 },
  { id: 'npcs', label: 'NPCs', description: 'Compile and enrich from scenes', order: 5 },
  { id: 'adversaries', label: 'Adversaries', description: 'Full stat blocks', order: 6 },
  { id: 'items', label: 'Items', description: 'Tier-appropriate rewards', order: 7 },
  { id: 'echoes', label: 'Echoes', description: 'GM creativity tools', order: 8 },
  { id: 'complete', label: 'Complete', description: 'Export to filesystem', order: 9 },
];

// =============================================================================
// Concrete Dials
// =============================================================================

/**
 * Party tier levels (affects encounter scaling, item tiers)
 */
export type PartyTier = 1 | 2 | 3 | 4;

/**
 * Session length options
 */
export type SessionLength = '2-3 hours' | '3-4 hours' | '4-5 hours';

/**
 * Concrete dial values with definite numeric/string values
 */
export interface ConcreteDials {
  /** Number of players (2-6, default 4) */
  partySize: number;
  /** Character tier level (1-4, default 1) */
  partyTier: PartyTier;
  /** Number of scenes (3-6, default 4) */
  sceneCount: number;
  /** Target session length */
  sessionLength: SessionLength;
}

// =============================================================================
// Conceptual Dials
// =============================================================================

/**
 * Available theme options for adventure
 */
export type ThemeOption =
  | 'redemption'
  | 'sacrifice'
  | 'identity'
  | 'power-corruption'
  | 'nature-civilization'
  | 'trust-betrayal'
  | 'found-family'
  | 'legacy'
  | 'survival'
  | 'justice-mercy';

export const THEME_OPTIONS: { id: ThemeOption; label: string; description: string }[] = [
  { id: 'redemption', label: 'Redemption', description: 'Characters seeking to make amends' },
  { id: 'sacrifice', label: 'Sacrifice', description: 'What are you willing to give up?' },
  { id: 'identity', label: 'Identity', description: 'Who are you, really?' },
  { id: 'power-corruption', label: 'Power and Corruption', description: 'What does power cost?' },
  { id: 'nature-civilization', label: 'Nature vs Civilization', description: 'Conflict of worlds' },
  { id: 'trust-betrayal', label: 'Trust and Betrayal', description: 'Who can you believe?' },
  { id: 'found-family', label: 'Found Family', description: 'Bonds beyond blood' },
  { id: 'legacy', label: 'Legacy', description: 'What do we leave behind?' },
  { id: 'survival', label: 'Survival', description: 'Against the odds' },
  { id: 'justice-mercy', label: 'Justice vs Mercy', description: 'The hard choices' },
];

/**
 * Conceptual dial values with spectrum/reference-based values
 */
export interface ConceptualDials {
  /** Tone - reference point or description (e.g., "like The Witcher") */
  tone: string | null;
  /** Combat vs exploration balance spectrum */
  combatExplorationBalance: string | null;
  /** NPC density - sparse, moderate, rich */
  npcDensity: string | null;
  /** Lethality - heroic to brutal */
  lethality: string | null;
  /** Emotional register - thrilling, tense, heartfelt, etc. */
  emotionalRegister: string | null;
  /** Themes - max 3 selections */
  themes: ThemeOption[];
}

// =============================================================================
// Combined Dial State
// =============================================================================

/**
 * All dial identifiers
 */
export type DialId = keyof ConcreteDials | keyof ConceptualDials;

/**
 * Complete dial state
 */
export interface DialsState extends ConcreteDials, ConceptualDials {
  /** Set of dial IDs that have been confirmed by the user */
  confirmedDials: Set<DialId>;
}

/**
 * Dial value can be any valid dial type
 */
export type DialValue = number | PartyTier | SessionLength | string | null | ThemeOption[];

// =============================================================================
// Dial Metadata & Validation
// =============================================================================

export interface DialMetadata {
  id: DialId;
  label: string;
  type: 'number' | 'select' | 'spectrum' | 'multi_select';
  category: 'concrete' | 'conceptual';
  description: string;
  required: boolean;
}

export const CONCRETE_DIAL_METADATA: DialMetadata[] = [
  {
    id: 'partySize',
    label: 'Party Size',
    type: 'number',
    category: 'concrete',
    description: 'Number of players at the table (2-6)',
    required: true,
  },
  {
    id: 'partyTier',
    label: 'Party Tier',
    type: 'select',
    category: 'concrete',
    description: 'Character tier level (1-4)',
    required: true,
  },
  {
    id: 'sceneCount',
    label: 'Scene Count',
    type: 'number',
    category: 'concrete',
    description: 'Number of scenes (3-6)',
    required: true,
  },
  {
    id: 'sessionLength',
    label: 'Session Length',
    type: 'select',
    category: 'concrete',
    description: 'Target session duration',
    required: true,
  },
];

export const CONCEPTUAL_DIAL_METADATA: DialMetadata[] = [
  {
    id: 'tone',
    label: 'Tone',
    type: 'spectrum',
    category: 'conceptual',
    description: 'Adventure tone (reference points welcome)',
    required: false,
  },
  {
    id: 'combatExplorationBalance',
    label: 'Combat/Exploration Balance',
    type: 'spectrum',
    category: 'conceptual',
    description: 'Heavy combat to exploration focus',
    required: false,
  },
  {
    id: 'npcDensity',
    label: 'NPC Density',
    type: 'spectrum',
    category: 'conceptual',
    description: 'Sparse to rich NPC presence',
    required: false,
  },
  {
    id: 'lethality',
    label: 'Lethality',
    type: 'spectrum',
    category: 'conceptual',
    description: 'Heroic to brutal difficulty',
    required: false,
  },
  {
    id: 'emotionalRegister',
    label: 'Emotional Register',
    type: 'spectrum',
    category: 'conceptual',
    description: 'Primary emotional journey',
    required: false,
  },
  {
    id: 'themes',
    label: 'Themes',
    type: 'multi_select',
    category: 'conceptual',
    description: 'Story themes (max 3)',
    required: false,
  },
];

export const ALL_DIAL_METADATA: DialMetadata[] = [
  ...CONCRETE_DIAL_METADATA,
  ...CONCEPTUAL_DIAL_METADATA,
];

// =============================================================================
// Default Values
// =============================================================================

export const DEFAULT_CONCRETE_DIALS: ConcreteDials = {
  partySize: 4,
  partyTier: 1,
  sceneCount: 4,
  sessionLength: '3-4 hours',
};

export const DEFAULT_CONCEPTUAL_DIALS: ConceptualDials = {
  tone: null,
  combatExplorationBalance: null,
  npcDensity: null,
  lethality: null,
  emotionalRegister: null,
  themes: [],
};

// =============================================================================
// Validation
// =============================================================================

export const DIAL_CONSTRAINTS = {
  partySize: { min: 2, max: 6 },
  partyTier: { options: [1, 2, 3, 4] as const },
  sceneCount: { min: 3, max: 6 },
  sessionLength: { options: ['2-3 hours', '3-4 hours', '4-5 hours'] as const },
  themes: { maxSelections: 3 },
} as const;

/**
 * Validate a party size value
 */
export function isValidPartySize(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= DIAL_CONSTRAINTS.partySize.min &&
    value <= DIAL_CONSTRAINTS.partySize.max
  );
}

/**
 * Validate a party tier value
 */
export function isValidPartyTier(value: number): value is PartyTier {
  return DIAL_CONSTRAINTS.partyTier.options.includes(value as PartyTier);
}

/**
 * Validate a scene count value
 */
export function isValidSceneCount(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= DIAL_CONSTRAINTS.sceneCount.min &&
    value <= DIAL_CONSTRAINTS.sceneCount.max
  );
}

/**
 * Validate a session length value
 */
export function isValidSessionLength(value: string): value is SessionLength {
  return (DIAL_CONSTRAINTS.sessionLength.options as readonly string[]).includes(value);
}

/**
 * Validate themes array
 */
export function isValidThemes(themes: ThemeOption[]): boolean {
  if (themes.length > DIAL_CONSTRAINTS.themes.maxSelections) {
    return false;
  }
  const validThemes = THEME_OPTIONS.map((t) => t.id);
  return themes.every((t) => validThemes.includes(t));
}

// =============================================================================
// Reference Points (for conceptual dials)
// =============================================================================

export interface ReferencePoint {
  name: string;
  description: string;
}

export const TONE_REFERENCES: ReferencePoint[] = [
  { name: 'Princess Bride', description: 'Lighthearted adventure with heart' },
  { name: 'The Witcher', description: 'Gritty, morally gray' },
  { name: 'Lord of the Rings', description: 'Epic heroic fantasy' },
  { name: 'Bloodborne', description: 'Cosmic horror, dread' },
  { name: 'Avatar: The Last Airbender', description: 'Serious themes, moments of levity' },
  { name: 'Game of Thrones', description: 'Political intrigue, high stakes' },
  { name: 'Stardew Valley', description: 'Cozy, community-focused' },
];

export const COMBAT_BALANCE_REFERENCES: ReferencePoint[] = [
  { name: 'Dark Souls', description: 'Combat-focused dungeon crawler' },
  { name: "Baldur's Gate 3", description: 'Balanced with meaningful both' },
  { name: 'Disco Elysium', description: 'Almost no combat, pure investigation' },
  { name: 'Critical Role', description: 'Character-driven with memorable fights' },
];

export const LETHALITY_REFERENCES: ReferencePoint[] = [
  { name: 'Marvel movies', description: 'Heroes triumph, death is rare' },
  { name: "Baldur's Gate 3", description: 'Tactical, death is possible' },
  { name: 'Dark Souls', description: 'Every mistake can kill' },
  { name: 'Tomb of Horrors', description: 'Brutal, expect casualties' },
];
