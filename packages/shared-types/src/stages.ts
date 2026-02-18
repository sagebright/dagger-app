/**
 * Sage Codex — Stage & Component Type Definitions
 *
 * Type system for the Sage Codex. Stages replace Phases,
 * Components replace Dials. Old types in dials.ts are preserved
 * for backward compatibility.
 */

// =============================================================================
// Adventure Stages
// =============================================================================

/**
 * The 6 stages of the Unfolding
 */
export type Stage =
  | 'invoking'
  | 'attuning'
  | 'binding'
  | 'weaving'
  | 'inscribing'
  | 'delivering';

export interface StageInfo {
  id: Stage;
  label: string;
  description: string;
  order: number;
}

export const STAGES: StageInfo[] = [
  { id: 'invoking', label: 'Invoking', description: 'Opening the Codex, sharing your vision', order: 0 },
  { id: 'attuning', label: 'Attuning', description: 'Sensing the tale\'s character', order: 1 },
  { id: 'binding', label: 'Binding', description: 'Anchoring the tale to its foundation', order: 2 },
  { id: 'weaving', label: 'Weaving', description: 'Weaving threads of story into a pattern', order: 3 },
  { id: 'inscribing', label: 'Inscribing', description: 'Writing each scene into the Codex', order: 4 },
  { id: 'delivering', label: 'Delivering', description: 'The completed tale, ready to bring to life', order: 5 },
];

// =============================================================================
// Component IDs & Groups
// =============================================================================

/**
 * The 8 Attuning component identifiers
 */
export type ComponentId =
  | 'span'
  | 'scenes'
  | 'members'
  | 'tier'
  | 'tenor'
  | 'pillars'
  | 'chorus'
  | 'threads';

/**
 * Component groups for the Attuning summary panel
 */
export type ComponentGroup = 'session' | 'party' | 'essence';

export interface ComponentGroupInfo {
  id: ComponentGroup;
  label: string;
  components: ComponentId[];
}

export const COMPONENT_GROUPS: ComponentGroupInfo[] = [
  { id: 'session', label: 'Session', components: ['span', 'scenes'] },
  { id: 'party', label: 'Party', components: ['members', 'tier'] },
  { id: 'essence', label: 'Essence', components: ['tenor', 'pillars', 'chorus', 'threads'] },
];

// =============================================================================
// Component Value Types
// =============================================================================

/** Session length */
export type SpanOption = '2-3 hours' | '3-4 hours' | '4-5 hours';

/** Number of scenes */
export type ScenesOption = 3 | 4 | 5 | 6;

/** Party size (number of players) */
export type MembersOption = 2 | 3 | 4 | 5;

/** Character tier level */
export type TierOption = 1 | 2 | 3 | 4;

/** Adventure tone */
export type TenorOption = 'grim' | 'serious' | 'balanced' | 'lighthearted' | 'whimsical';

/** Pillar balance preset */
export type PillarsOption = 'interwoven' | 'battle-led' | 'discovery-led' | 'intrigue-led';

/** NPC density */
export type ChorusOption = 'sparse' | 'moderate' | 'rich';

/** Paired theme tensions (max 3 selections) */
export type ThreadOption =
  | 'redemption-sacrifice'
  | 'identity-legacy'
  | 'found-family'
  | 'power-corruption'
  | 'trust-betrayal'
  | 'survival-justice';

// =============================================================================
// Component Option Metadata
// =============================================================================

export interface ComponentChoice<T extends string | number> {
  value: T;
  title: string;
  description: string;
}

export const SPAN_CHOICES: ComponentChoice<SpanOption>[] = [
  { value: '2-3 hours', title: '2\u20133 Hours', description: 'A tight session \u2014 get in, play hard, get out.' },
  { value: '3-4 hours', title: '3\u20134 Hours', description: 'The standard session \u2014 pacing and depth.' },
  { value: '4-5 hours', title: '4\u20135 Hours', description: 'A long session \u2014 room for everything.' },
];

export const SCENES_CHOICES: ComponentChoice<ScenesOption>[] = [
  { value: 3, title: '3 Scenes', description: 'Quick and punchy \u2014 a focused one-shot.' },
  { value: 4, title: '4 Scenes', description: 'Room to breathe \u2014 the sweet spot for most sessions.' },
  { value: 5, title: '5 Scenes', description: 'Expansive \u2014 more room for subplots and twists.' },
  { value: 6, title: '6 Scenes', description: 'Epic scope \u2014 a full day of adventure.' },
];

export const MEMBERS_CHOICES: ComponentChoice<MembersOption>[] = [
  { value: 2, title: '2 Players', description: 'Intimate duo \u2014 every choice carries weight.' },
  { value: 3, title: '3 Players', description: 'A tight-knit trio \u2014 nimble and focused.' },
  { value: 4, title: '4 Players', description: 'The classic party \u2014 balanced and versatile.' },
  { value: 5, title: '5 Players', description: 'A full company \u2014 more chaos, more fun.' },
];

export const TIER_CHOICES: ComponentChoice<TierOption>[] = [
  { value: 1, title: 'Tier 1', description: 'Levels 1\u20134 \u2014 fresh adventurers finding their footing.' },
  { value: 2, title: 'Tier 2', description: 'Levels 5\u20138 \u2014 proven heroes with growing renown.' },
  { value: 3, title: 'Tier 3', description: 'Levels 9\u201312 \u2014 legendary figures shaping the world.' },
  { value: 4, title: 'Tier 4', description: 'Levels 13+ \u2014 mythic power, world-altering stakes.' },
];

export const TENOR_CHOICES: ComponentChoice<TenorOption>[] = [
  { value: 'grim', title: 'Grim', description: 'Dark, oppressive, and relentless.' },
  { value: 'serious', title: 'Serious', description: 'Grounded stakes with moments of levity.' },
  { value: 'balanced', title: 'Balanced', description: 'Equal parts drama and fun.' },
  { value: 'lighthearted', title: 'Lighthearted', description: 'Fun-first with real stakes underneath.' },
  { value: 'whimsical', title: 'Whimsical', description: 'Playful, absurd, and joyful.' },
];

export const PILLARS_CHOICES: ComponentChoice<PillarsOption>[] = [
  { value: 'interwoven', title: 'Interwoven', description: 'All three pillars share the stage \u2014 no single focus dominates.' },
  { value: 'battle-led', title: 'Battle-Led', description: 'Fights are the centerpiece; discovery and intrigue support them.' },
  { value: 'discovery-led', title: 'Discovery-Led', description: 'Discovery drives the story; combat and social arise from what\u2019s found.' },
  { value: 'intrigue-led', title: 'Intrigue-Led', description: 'Relationships and intrigue lead; combat and discovery serve the drama.' },
];

export const CHORUS_CHOICES: ComponentChoice<ChorusOption>[] = [
  { value: 'sparse', title: 'Sparse', description: 'A few key figures \u2014 lonely roads and meaningful encounters.' },
  { value: 'moderate', title: 'Moderate', description: 'A solid cast without overwhelm \u2014 enough to fill a tavern.' },
  { value: 'rich', title: 'Rich', description: 'A bustling world \u2014 names and faces around every corner.' },
];

export const THREADS_CHOICES: ComponentChoice<ThreadOption>[] = [
  { value: 'redemption-sacrifice', title: 'Redemption & Sacrifice', description: 'What would you give to make things right?' },
  { value: 'identity-legacy', title: 'Identity & Legacy', description: 'Who are you, and what will endure?' },
  { value: 'found-family', title: 'Found Family', description: 'Bonds forged by choice, not blood.' },
  { value: 'power-corruption', title: 'Power & Corruption', description: 'What does power cost those who wield it?' },
  { value: 'trust-betrayal', title: 'Trust & Betrayal', description: 'Who can you believe when it matters most?' },
  { value: 'survival-justice', title: 'Survival & Justice', description: 'When staying alive conflicts with doing right.' },
];

// =============================================================================
// Component Metadata
// =============================================================================

export interface ComponentMetadata {
  id: ComponentId;
  label: string;
  group: ComponentGroup;
  question: string;
  selectMode: 'single' | 'multi';
  maxSelections?: number;
}

export const COMPONENT_METADATA: ComponentMetadata[] = [
  { id: 'span', label: 'Span', group: 'session', question: 'How long is this session?', selectMode: 'single' },
  { id: 'scenes', label: 'Scenes', group: 'session', question: 'How many scenes should the adventure have?', selectMode: 'single' },
  { id: 'members', label: 'Members', group: 'party', question: 'How many players will be at the table?', selectMode: 'single' },
  { id: 'tier', label: 'Tier', group: 'party', question: 'What tier are the characters?', selectMode: 'single' },
  { id: 'tenor', label: 'Tenor', group: 'essence', question: 'What kind of tenor should your adventure have?', selectMode: 'single' },
  { id: 'pillars', label: 'Pillars', group: 'essence', question: 'Every adventure leans on three pillars \u2014 combat, discovery, and social. Which should lead?', selectMode: 'single' },
  { id: 'chorus', label: 'Chorus', group: 'essence', question: 'How populated should this world feel?', selectMode: 'single' },
  { id: 'threads', label: 'Threads', group: 'essence', question: 'Pick up to 3 threads that resonate with your story.', selectMode: 'multi', maxSelections: 3 },
];

// =============================================================================
// Component State
// =============================================================================

/**
 * Complete component selections state
 */
export interface ComponentsState {
  span: SpanOption | null;
  scenes: ScenesOption | null;
  members: MembersOption | null;
  tier: TierOption | null;
  tenor: TenorOption | null;
  pillars: PillarsOption | null;
  chorus: ChorusOption | null;
  threads: ThreadOption[];
  confirmedComponents: Set<ComponentId>;
}

export const DEFAULT_COMPONENTS: Omit<ComponentsState, 'confirmedComponents'> = {
  span: null,
  scenes: null,
  members: null,
  tier: null,
  tenor: null,
  pillars: null,
  chorus: null,
  threads: [],
};

// =============================================================================
// Validation
// =============================================================================

export function isValidSpan(value: string): value is SpanOption {
  return ['2-3 hours', '3-4 hours', '4-5 hours'].includes(value);
}

export function isValidScenes(value: number): value is ScenesOption {
  return [3, 4, 5, 6].includes(value);
}

export function isValidMembers(value: number): value is MembersOption {
  return [2, 3, 4, 5].includes(value);
}

export function isValidTier(value: number): value is TierOption {
  return [1, 2, 3, 4].includes(value);
}

export function isValidTenor(value: string): value is TenorOption {
  return ['grim', 'serious', 'balanced', 'lighthearted', 'whimsical'].includes(value);
}

export function isValidPillars(value: string): value is PillarsOption {
  return ['interwoven', 'battle-led', 'discovery-led', 'intrigue-led'].includes(value);
}

export function isValidChorus(value: string): value is ChorusOption {
  return ['sparse', 'moderate', 'rich'].includes(value);
}

export function isValidThread(value: string): value is ThreadOption {
  return [
    'redemption-sacrifice', 'identity-legacy', 'found-family',
    'power-corruption', 'trust-betrayal', 'survival-justice',
  ].includes(value);
}

export function isValidThreads(threads: ThreadOption[]): boolean {
  if (threads.length > 3) return false;
  return threads.every(isValidThread);
}

/**
 * Check if all 8 components are confirmed
 */
export function areAllComponentsConfirmed(state: ComponentsState): boolean {
  const required: ComponentId[] = ['span', 'scenes', 'members', 'tier', 'tenor', 'pillars', 'chorus', 'threads'];
  return required.every(id => state.confirmedComponents.has(id));
}
