/**
 * E2E mock data fixtures for all 6 adventure stages
 *
 * Provides realistic data constants used by SSE builders and MockController
 * to simulate API responses for each stage of the Unfolding.
 */

import { MOCK_USER_ID } from './auth';

// =============================================================================
// Session Constants
// =============================================================================

export const MOCK_SESSION_ID = 'session-e2e-001';

// =============================================================================
// Invoking Fixtures — Spark
// =============================================================================

export const MOCK_SPARK = {
  name: 'The Shattered Beacon',
  vision:
    'A coastal watchtower has gone dark. The lighthouse keeper has vanished, ' +
    'and ships are wrecking on the rocks. Something ancient stirs beneath the waves.',
};

// =============================================================================
// Attuning Fixtures — Components
// =============================================================================

export const MOCK_COMPONENTS = {
  span: '3-4 hours',
  scenes: 4,
  members: 4,
  tier: 2,
  tenor: 'serious',
  pillars: 'interwoven',
  chorus: 'moderate',
  threads: ['redemption-sacrifice', 'trust-betrayal'],
  confirmedComponents: [
    'span',
    'scenes',
    'members',
    'tier',
    'tenor',
    'pillars',
    'chorus',
    'threads',
  ],
};

// =============================================================================
// Binding Fixtures — Frames
// =============================================================================

export const MOCK_FRAMES = [
  {
    id: 'frame-001',
    name: 'The Drowned Lantern',
    pitch: 'A haunted lighthouse draws the party into a mystery beneath the tides.',
    themes: ['mystery', 'horror', 'maritime'],
    sections: [
      {
        key: 'hook',
        label: 'Hook',
        content: 'Ships have been wrecking on the Shattered Coast for weeks.',
        expandedByDefault: true,
      },
      {
        key: 'setting',
        label: 'Setting',
        content: 'A remote lighthouse perched on jagged coastal cliffs.',
      },
    ],
  },
  {
    id: 'frame-002',
    name: 'Tides of Reckoning',
    pitch: 'An ancient pact resurfaces as the sea demands its due.',
    themes: ['duty', 'sacrifice', 'supernatural'],
    sections: [
      {
        key: 'hook',
        label: 'Hook',
        content: 'The coastal village remembers the old pact with dread.',
        expandedByDefault: true,
      },
    ],
  },
  {
    id: 'frame-003',
    name: 'Beneath the Beacon',
    pitch: 'The watchtower hides a passage to something older than the kingdom.',
    themes: ['exploration', 'ancient evil', 'discovery'],
    sections: [
      {
        key: 'hook',
        label: 'Hook',
        content: 'Strange glyphs appear on the lighthouse walls each night.',
        expandedByDefault: true,
      },
    ],
  },
];

export const SELECTED_FRAME_ID = 'frame-001';

// =============================================================================
// Weaving Fixtures — Scene Arcs
// =============================================================================

export const MOCK_SCENE_ARCS = [
  {
    id: 'arc-001',
    sceneNumber: 1,
    title: 'Arrival at the Shattered Coast',
    subtitle: 'The party reaches the remote village',
    description:
      'The party arrives at a windswept fishing village. The locals are fearful and ' +
      'reluctant to speak about the lighthouse. A grizzled fisherman offers to ferry ' +
      'them to the lighthouse island at dawn.',
    confirmed: false,
  },
  {
    id: 'arc-002',
    sceneNumber: 2,
    title: 'The Dark Ascent',
    subtitle: 'Climbing the lightless tower',
    description:
      'The lighthouse interior is a maze of winding stairs and abandoned rooms. ' +
      'Strange symbols cover the walls. The keeper\'s journal reveals growing paranoia.',
    confirmed: false,
  },
  {
    id: 'arc-003',
    sceneNumber: 3,
    title: 'The Depths Below',
    subtitle: 'Descending into the sea caves',
    description:
      'A hidden passage beneath the lighthouse leads to flooded sea caves. ' +
      'Ancient architecture predates the lighthouse by centuries. Something watches from the dark water.',
    confirmed: false,
  },
  {
    id: 'arc-004',
    sceneNumber: 4,
    title: 'The Lantern Relit',
    subtitle: 'Confrontation and resolution',
    description:
      'The party faces the ancient entity that has been extinguishing the light. ' +
      'The lighthouse keeper is found, transformed. The choice: destroy the entity ' +
      'or forge a new pact to keep the beacon burning.',
    confirmed: false,
  },
];

export const MOCK_ADVENTURE_NAME = 'The Shattered Beacon';

// =============================================================================
// Inscribing Fixtures — Sections & Entities
// =============================================================================

export const MOCK_WAVE1_SECTIONS = [
  {
    id: 'overview' as const,
    label: 'Overview',
    content: 'The party investigates a darkened lighthouse on a remote coast.',
    wave: 1 as const,
    hasDetail: false,
  },
  {
    id: 'setup' as const,
    label: 'Setup',
    content: 'Begin in the fishing village. The harbormaster briefs the party.',
    wave: 1 as const,
    hasDetail: true,
  },
  {
    id: 'developments' as const,
    label: 'Developments',
    content: 'Discovery of the hidden passage. The keeper\'s journal clues.',
    wave: 1 as const,
    hasDetail: true,
  },
];

export const MOCK_WAVE2_SECTIONS = [
  {
    id: 'npcs_present' as const,
    label: 'NPCs Present',
    content: '',
    wave: 2 as const,
    hasDetail: false,
    entityNPCs: [
      {
        id: 'npc-001',
        name: 'Harbormaster Venn',
        role: 'quest-giver' as const,
        description: 'A weathered woman who knows more than she lets on.',
        sceneAppearances: ['arc-001'],
        isEnriched: true,
      },
      {
        id: 'npc-002',
        name: 'Old Marsh',
        role: 'informant' as const,
        description: 'A retired fisherman who saw the keeper\'s transformation.',
        sceneAppearances: ['arc-001', 'arc-002'],
        isEnriched: false,
      },
    ],
  },
  {
    id: 'adversaries' as const,
    label: 'Adversaries',
    content: '',
    wave: 2 as const,
    hasDetail: false,
    entityAdversaries: [
      {
        id: 'adv-001',
        name: 'Drowned Sentinels',
        type: 'minion' as const,
        difficulty: 5,
        quantity: 4,
        sceneAppearances: ['arc-003'],
        stats: { hp: 8, stress: 2, attack: '+4', damage: '2d6' },
      },
    ],
  },
  {
    id: 'items' as const,
    label: 'Items',
    content: '',
    wave: 2 as const,
    hasDetail: false,
    entityItems: [
      {
        id: 'item-001',
        name: 'Lantern of Revealing',
        category: 'item' as const,
        tier: 2,
        statLine: 'Reveals hidden writing within 30 feet',
        sceneAppearances: ['arc-002'],
      },
    ],
  },
];

export const MOCK_WAVE3_SECTIONS = [
  {
    id: 'transitions' as const,
    label: 'Transitions',
    content: 'The party moves from the village by boat, then climbs the tower.',
    wave: 3 as const,
    hasDetail: true,
  },
  {
    id: 'portents' as const,
    label: 'Portents',
    content: '',
    wave: 3 as const,
    hasDetail: false,
    entityPortents: [
      {
        category: 'environmental' as const,
        label: 'Environmental Shifts',
        entries: [
          {
            id: 'portent-001',
            title: 'Rising Tide',
            sceneBadge: 'Scene 3',
            trigger: 'Party spends too long in the caves',
            benefit: 'Reveals a hidden alcove with the keeper\'s last message',
            complication: 'Escape routes begin flooding',
          },
        ],
      },
    ],
  },
  {
    id: 'gm_notes' as const,
    label: 'GM Notes',
    content: 'The entity is not inherently evil. Consider player choices carefully.',
    wave: 3 as const,
    hasDetail: false,
  },
];

export const MOCK_ALL_SECTIONS = [
  ...MOCK_WAVE1_SECTIONS,
  ...MOCK_WAVE2_SECTIONS,
  ...MOCK_WAVE3_SECTIONS,
];

// =============================================================================
// Session Response Builders
// =============================================================================

/**
 * Build a mock session response object for a given stage.
 */
export function buildSessionResponse(
  stage: string,
  options: { componentsPreConfirmed?: boolean } = {}
) {
  // Include components if past attuning, or if explicitly pre-confirmed
  const includeComponents =
    (stage !== 'invoking' && stage !== 'attuning') ||
    (stage === 'attuning' && options.componentsPreConfirmed);

  return {
    session: {
      id: MOCK_SESSION_ID,
      user_id: MOCK_USER_ID,
      title: 'E2E Test Adventure',
      stage,
      is_active: true,
      created_at: '2026-02-20T10:00:00.000Z',
      updated_at: new Date().toISOString(),
    },
    adventureState: {
      id: 'state-e2e-001',
      session_id: MOCK_SESSION_ID,
      state: {
        stage,
        spark: stage !== 'invoking' ? MOCK_SPARK : null,
        components: includeComponents ? MOCK_COMPONENTS : {},
        frame: ['weaving', 'inscribing', 'delivering'].includes(stage)
          ? MOCK_FRAMES[0]
          : null,
        sceneArcs: ['inscribing', 'delivering'].includes(stage)
          ? MOCK_SCENE_ARCS.map((a) => ({ ...a, confirmed: true }))
          : [],
      },
      components: stage !== 'invoking' ? MOCK_COMPONENTS : {},
      frame: null,
      outline: null,
      scenes: [],
    },
  };
}
