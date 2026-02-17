/**
 * Sample adventure state fixtures for testing
 *
 * Provides realistic adventure state objects for use in tests
 * that need adventure context (scene generation, NPC compilation, etc.)
 */

// =============================================================================
// Dials Summary Fixtures
// =============================================================================

/** Standard tier 2 party dials summary */
export const SAMPLE_DIALS_SUMMARY = {
  partySize: 4,
  partyTier: 2 as const,
  sceneCount: 4,
  sessionLength: '3-4 hours',
  tone: 'mysterious',
  themes: ['corruption', 'redemption'],
  pillarBalance: 'balanced',
  lethality: 'moderate',
};

/** Minimal dials summary for basic tests */
export const MINIMAL_DIALS_SUMMARY = {
  partySize: 3,
  partyTier: 1 as const,
  sceneCount: 3,
  tone: null,
  themes: [],
};

// =============================================================================
// Frame Fixtures
// =============================================================================

/** A sample database frame */
export const SAMPLE_FRAME = {
  id: 'frame-001',
  name: 'The Hollow Vigil',
  description: 'A cursed monastery sits atop a forgotten hill, its bells still ringing at midnight.',
  themes: ['corruption', 'redemption', 'faith'],
  typical_adversaries: ['undead', 'cultist', 'corrupted guardian'],
  lore: 'Once a beacon of healing, the monastery fell when its abbot made a pact with shadow.',
  embedding: null,
  source_book: 'Core Rulebook',
  created_at: '2025-01-01T00:00:00Z',
};

/** A sample custom frame */
export const SAMPLE_CUSTOM_FRAME = {
  id: 'custom-frame-001',
  name: 'Echoes of the Sunken City',
  description: 'An ancient city beneath the waves holds secrets that surface dwellers were never meant to find.',
  themes: ['mystery', 'forbidden knowledge'],
  typicalAdversaries: ['sea creatures', 'ancient constructs'],
  lore: 'The city sank millennia ago, but its magic keeps the water at bay for those who know the way.',
  isCustom: true as const,
};

// =============================================================================
// Outline Fixtures
// =============================================================================

/** A sample scene brief */
export const SAMPLE_SCENE_BRIEF = {
  id: 'scene-brief-001',
  sceneNumber: 1,
  title: 'Arrival at the Monastery',
  description: 'The party approaches the monastery as evening falls, noticing the eerie silence.',
  keyElements: ['crumbling walls', 'silent bell tower', 'flickering lights'],
  location: 'Monastery Entrance',
  characters: ['Brother Aldric', 'Shadow Sentinel'],
  sceneType: 'exploration' as const,
};

/** A complete sample outline with 4 scenes */
export const SAMPLE_OUTLINE = {
  id: 'outline-001',
  title: 'The Hollow Vigil',
  summary: 'The party investigates a cursed monastery where an ancient evil stirs beneath the crypt.',
  scenes: [
    SAMPLE_SCENE_BRIEF,
    {
      id: 'scene-brief-002',
      sceneNumber: 2,
      title: 'The Shattered Nave',
      description: 'Inside the monastery, signs of corruption are everywhere.',
      keyElements: ['broken altar', 'shadow whispers', 'corrupted relics'],
      location: 'Main Nave',
      characters: ['Corrupted Monk'],
      sceneType: 'social' as const,
    },
    {
      id: 'scene-brief-003',
      sceneNumber: 3,
      title: 'Descent into the Crypt',
      description: 'The party descends into the crypt where the source of corruption lies.',
      keyElements: ['ancient seals', 'shadow tendrils', 'puzzle locks'],
      location: 'Monastery Crypt',
      sceneType: 'puzzle' as const,
    },
    {
      id: 'scene-brief-004',
      sceneNumber: 4,
      title: 'The Abbot\'s Reckoning',
      description: 'The party confronts the corrupted abbot in his shadow sanctum.',
      keyElements: ['boss fight', 'moral choice', 'breaking the curse'],
      location: 'Shadow Sanctum',
      characters: ['Corrupted Abbot'],
      sceneType: 'combat' as const,
    },
  ],
  isConfirmed: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

// =============================================================================
// Scene Draft Fixtures
// =============================================================================

/** A complete scene draft for scene 1 */
export const SAMPLE_SCENE_DRAFT = {
  sceneId: 'scene-brief-001',
  sceneNumber: 1,
  title: 'Arrival at the Monastery',
  introduction: 'As twilight settles over the valley, the party crests the final hill.',
  keyMoments: [
    {
      title: 'The Silent Approach',
      description: 'The party notices the unnatural silence surrounding the monastery.',
    },
    {
      title: 'Brother Aldric\'s Warning',
      description: 'A lone monk emerges from the shadows with a dire warning.',
    },
  ],
  resolution: 'The party must decide whether to enter the monastery or wait until dawn.',
  tierGuidance: 'At Tier 2, the environmental threats should feel ominous but not overwhelming.',
  toneNotes: 'Maintain an atmosphere of creeping dread and mystery.',
  extractedEntities: {
    npcs: [
      {
        name: 'Brother Aldric',
        role: 'quest-giver',
        sceneId: 'scene-brief-001',
        description: 'A weathered monk who escaped the corruption.',
      },
    ],
    adversaries: [
      {
        name: 'Shadow Sentinel',
        type: 'standard',
        tier: 2,
        sceneId: 'scene-brief-001',
        notes: 'Guards the monastery entrance.',
      },
    ],
    items: [
      {
        name: 'Aldric\'s Holy Symbol',
        suggestedTier: 2,
        sceneId: 'scene-brief-001',
        description: 'A cracked holy symbol that still glows faintly.',
      },
    ],
  },
};

// =============================================================================
// NPC Fixtures
// =============================================================================

/** A compiled NPC */
export const SAMPLE_NPC = {
  id: 'npc-001',
  name: 'Brother Aldric',
  role: 'quest-giver' as const,
  description: 'A weathered monk who escaped the monastery\'s corruption.',
  appearance: 'Gaunt figure in tattered robes, with kind but haunted eyes.',
  personality: 'Gentle and patient, but deeply troubled by guilt over his failure to stop the corruption.',
  motivations: ['Redeem the monastery', 'Protect the remaining monks'],
  connections: ['Former student of the Abbot', 'Knows the crypt\'s layout'],
  sceneAppearances: ['scene-brief-001', 'scene-brief-002'],
};

// =============================================================================
// Adversary Fixtures (Database Format)
// =============================================================================

/** A sample adversary from the database */
export const SAMPLE_ADVERSARY = {
  id: 'adversary-001',
  name: 'Shadow Sentinel',
  tier: 2,
  type: 'undead',
  description: 'A guardian consumed by shadow magic, now standing eternal watch.',
  motives_tactics: ['Guard the entrance', 'Consume light sources'],
  difficulty: 12,
  thresholds: 'Minor: 5, Major: 10, Severe: 15',
  hp: 8,
  stress: 3,
  atk: '+5',
  weapon: 'Shadow Blade',
  range: 'Melee',
  dmg: '2d6+2',
  experiences: null,
  features: [{ name: 'Shadow Step', description: 'Can teleport between shadows within 30 feet.' }],
  searchable_text: null,
  embedding: null,
  source_book: 'Core Rulebook',
  created_at: '2025-01-01T00:00:00Z',
};
