/**
 * generate_scene_draft MCP Tool
 *
 * Generates full scene content from scene briefs with:
 * - Tier-appropriate content and challenges
 * - Scene-type specific sections (combat, exploration, social, etc.)
 * - Entity extraction for later phases (NPCs, adversaries, items)
 * - Draft-revise workflow support
 */

import type {
  GenerateSceneInput,
  GenerateSceneOutput,
  SceneBrief,
  SceneDraft,
  ExtractedNPC,
  ExtractedAdversary,
  ExtractedItem,
  KeyMoment,
  SelectedFrame,
} from '@dagger-app/shared-types';
import { isCustomFrame } from '@dagger-app/shared-types';
import type { ToolSchema } from '../mcpServer.js';

// =============================================================================
// Tool Schema
// =============================================================================

export const GENERATE_SCENE_SCHEMA: ToolSchema = {
  description:
    'Generate full scene content from a scene brief with tier-appropriate challenges and entity extraction',
  inputSchema: {
    type: 'object',
    properties: {
      sceneBrief: {
        type: 'object',
        description: 'The scene brief to expand into full content',
      },
      frame: {
        type: 'object',
        description: 'The adventure frame for thematic context',
      },
      outline: {
        type: 'object',
        description: 'The full outline for narrative continuity',
      },
      dialsSummary: {
        type: 'object',
        description: 'Current dial settings for party and adventure',
        properties: {
          partySize: { type: 'number' },
          partyTier: { type: 'number' },
          sceneCount: { type: 'number' },
          sessionLength: { type: 'string' },
          tone: { type: 'string' },
          themes: { type: 'array', items: { type: 'string' } },
          pillarBalance: { type: 'string' },
          lethality: { type: 'string' },
        },
      },
      feedback: {
        type: 'string',
        description: 'User feedback for scene revision',
      },
      previousDraft: {
        type: 'object',
        description: 'Previous draft when revising based on feedback',
      },
    },
    required: ['sceneBrief', 'frame', 'outline', 'dialsSummary'],
  },
};

// Re-export types for test file
export type { GenerateSceneInput } from '@dagger-app/shared-types';

// =============================================================================
// Tier Descriptions
// =============================================================================

const TIER_DESCRIPTIONS: Record<number, { label: string; dcRange: string; challenge: string }> = {
  1: {
    label: 'fledgling adventurers',
    dcRange: '10-12',
    challenge: 'straightforward challenges with clear solutions',
  },
  2: {
    label: 'experienced heroes',
    dcRange: '12-15',
    challenge: 'moderate challenges requiring teamwork',
  },
  3: {
    label: 'veteran champions',
    dcRange: '15-18',
    challenge: 'complex challenges with multiple approaches',
  },
  4: {
    label: 'legendary figures',
    dcRange: '18-22',
    challenge: 'epic challenges that test even the mightiest',
  },
};

// =============================================================================
// Content Templates
// =============================================================================

const INTRODUCTION_TEMPLATES: Record<NonNullable<SceneBrief['sceneType']>, string[]> = {
  combat: [
    'The air grows tense as hostile forces reveal themselves.',
    'A sudden movement breaks the silence, and weapons are drawn.',
    'The enemy emerges from the shadows, blocking the path forward.',
  ],
  exploration: [
    'The path leads deeper into uncharted territory.',
    'Strange markings on the walls hint at what lies ahead.',
    'The environment here tells a story of ages past.',
  ],
  social: [
    'A key figure awaits, their intentions unclear.',
    'The gathering place buzzes with conversation and opportunity.',
    'All eyes turn as the party enters the scene.',
  ],
  puzzle: [
    'An ancient mechanism bars the way forward.',
    'Cryptic symbols cover the walls, demanding interpretation.',
    'The solution lies hidden in plain sight.',
  ],
  revelation: [
    'The truth becomes impossible to ignore.',
    'Everything the party thought they knew is called into question.',
    'A pivotal moment arrives, changing the course of events.',
  ],
  mixed: [
    'Multiple challenges converge in this critical moment.',
    'The situation is more complex than it first appeared.',
    'Events unfold rapidly, demanding quick thinking.',
  ],
};

const RESOLUTION_TEMPLATES: Record<NonNullable<SceneBrief['sceneType']>, string[]> = {
  combat: [
    'The dust settles, revealing the aftermath of battle.',
    'Victory is achieved, but at what cost?',
    'The threat is neutralized, but questions remain.',
  ],
  exploration: [
    'The discovery opens new possibilities.',
    'What was found here will shape the journey ahead.',
    'The path forward is now clear.',
  ],
  social: [
    'The conversation concludes, alliances tested.',
    'New information changes the party\'s understanding.',
    'Relationships are forged or fractured.',
  ],
  puzzle: [
    'The mechanism activates, revealing its purpose.',
    'Understanding dawns as the puzzle yields its secrets.',
    'The solution unlocks more than expected.',
  ],
  revelation: [
    'Nothing will ever be the same.',
    'The truth is a burden and a weapon.',
    'New purpose crystallizes from the revelation.',
  ],
  mixed: [
    'The situation resolves, but complexity remains.',
    'Multiple threads are advanced simultaneously.',
    'The party must process what they have experienced.',
  ],
};

// =============================================================================
// Key Moment Generation
// =============================================================================

function generateKeyMoments(
  sceneBrief: SceneBrief,
  partyTier: number,
  themes: string[]
): KeyMoment[] {
  const moments: KeyMoment[] = [];
  const sceneType = sceneBrief.sceneType || 'mixed';

  // Initial moment based on scene type
  const initialMoments: Record<NonNullable<SceneBrief['sceneType']>, KeyMoment> = {
    combat: {
      title: 'The Opening Clash',
      description: 'Initiative is rolled as combat begins in earnest.',
    },
    exploration: {
      title: 'Initial Discovery',
      description: 'The party begins to uncover what this place holds.',
    },
    social: {
      title: 'First Impressions',
      description: 'The party gauges the situation and those present.',
    },
    puzzle: {
      title: 'The Challenge Revealed',
      description: 'The nature of the puzzle becomes apparent.',
    },
    revelation: {
      title: 'Signs and Portents',
      description: 'Hints of the coming revelation begin to surface.',
    },
    mixed: {
      title: 'The Situation Unfolds',
      description: 'Multiple elements come into play simultaneously.',
    },
  };

  moments.push(initialMoments[sceneType]);

  // Add theme-related moments
  if (themes.includes('redemption')) {
    moments.push({
      title: 'Chance for Redemption',
      description: 'An opportunity presents itself to make amends or offer mercy.',
    });
  }
  if (themes.includes('sacrifice')) {
    moments.push({
      title: 'The Cost',
      description: 'Something valuable must be given up to proceed.',
    });
  }
  if (themes.includes('identity')) {
    moments.push({
      title: 'True Nature Revealed',
      description: 'Someone or something shows their true self.',
    });
  }

  // Add tier-appropriate challenge moment
  const tierInfo = TIER_DESCRIPTIONS[partyTier] || TIER_DESCRIPTIONS[2];
  moments.push({
    title: 'The Challenge',
    description: `A ${tierInfo.challenge} tests the party's abilities (DC ${tierInfo.dcRange}).`,
  });

  // Climax moment
  moments.push({
    title: 'Turning Point',
    description: 'The scene reaches its critical juncture.',
  });

  return moments;
}

// =============================================================================
// Entity Extraction
// =============================================================================

function extractNPCs(
  sceneBrief: SceneBrief,
  sceneType: NonNullable<SceneBrief['sceneType']>,
  feedback?: string
): ExtractedNPC[] {
  const npcs: ExtractedNPC[] = [];
  const sceneId = sceneBrief.id;

  // Social scenes always have NPCs
  if (sceneType === 'social') {
    npcs.push({
      name: `${sceneBrief.title.split(' ')[1] || 'Key'} Contact`,
      role: 'Information broker or ally',
      sceneId,
      description: 'A character central to this social encounter.',
    });
    npcs.push({
      name: 'Observer',
      role: 'Secondary NPC with own agenda',
      sceneId,
    });
  }

  // Add NPCs based on characters in brief
  if (sceneBrief.characters) {
    sceneBrief.characters.forEach((char, i) => {
      if (!char.toLowerCase().includes('adversar') && !char.toLowerCase().includes('hazard')) {
        npcs.push({
          name: char,
          role: i === 0 ? 'Primary NPC' : 'Supporting NPC',
          sceneId,
        });
      }
    });
  }

  // Feedback requesting more NPCs
  if (feedback?.toLowerCase().includes('more npc')) {
    npcs.push({
      name: 'Additional Contact',
      role: 'Supplementary NPC added per feedback',
      sceneId,
    });
  }

  return npcs;
}

function extractAdversaries(
  sceneBrief: SceneBrief,
  frame: SelectedFrame,
  partyTier: number,
  sceneType: NonNullable<SceneBrief['sceneType']>
): ExtractedAdversary[] {
  const adversaries: ExtractedAdversary[] = [];
  const sceneId = sceneBrief.id;

  // Combat scenes have adversaries
  if (sceneType === 'combat' || sceneType === 'mixed') {
    // Get frame adversaries
    const frameAdversaries = isCustomFrame(frame)
      ? frame.typicalAdversaries || []
      : (frame as { typical_adversaries?: string[] }).typical_adversaries || [];

    if (frameAdversaries.length > 0) {
      adversaries.push({
        name: frameAdversaries[0],
        type: 'standard',
        tier: partyTier,
        sceneId,
        notes: 'Primary adversary for this encounter',
      });
    }

    // Add minions for combat scenes
    if (sceneType === 'combat') {
      adversaries.push({
        name: 'Minion Group',
        type: 'minion',
        tier: Math.max(1, partyTier - 1),
        sceneId,
        notes: 'Supporting enemies',
      });
    }
  }

  return adversaries;
}

function extractItems(
  sceneBrief: SceneBrief,
  partyTier: number,
  sceneType: NonNullable<SceneBrief['sceneType']>
): ExtractedItem[] {
  const items: ExtractedItem[] = [];
  const sceneId = sceneBrief.id;

  // Exploration scenes may have discoverable items
  if (sceneType === 'exploration' || sceneType === 'puzzle') {
    items.push({
      name: 'Discovered Artifact',
      suggestedTier: Math.min(partyTier, 2),
      sceneId,
      description: 'An item found during exploration.',
    });
  }

  // Combat rewards
  if (sceneType === 'combat' || sceneType === 'mixed') {
    items.push({
      name: 'Combat Trophy',
      suggestedTier: partyTier,
      sceneId,
      description: 'A reward claimed from the encounter.',
    });
  }

  return items;
}

// =============================================================================
// Scene-Type Specific Content
// =============================================================================

function generateSceneTypeContent(
  sceneType: NonNullable<SceneBrief['sceneType']>,
  sceneBrief: SceneBrief,
  partyTier: number
): Partial<SceneDraft> {
  const content: Partial<SceneDraft> = {};
  const tierInfo = TIER_DESCRIPTIONS[partyTier] || TIER_DESCRIPTIONS[2];

  switch (sceneType) {
    case 'combat':
      content.combatNotes = `Initiative order and tactical considerations for tier ${partyTier}. ` +
        `Use DC ${tierInfo.dcRange} for maneuvers. Consider terrain and positioning.`;
      break;

    case 'exploration':
      content.environmentDetails = sceneBrief.location
        ? `Setting: ${sceneBrief.location}. ${sceneBrief.description}`
        : sceneBrief.description;
      content.discoveryOpportunities = [
        'Hidden passage or cache',
        'Environmental clue',
        'Ancient inscription or marker',
      ];
      break;

    case 'social':
      content.socialChallenges = `This social encounter involves persuasion, deception, or insight checks. ` +
        `Tier ${partyTier} parties should face ${tierInfo.challenge}.`;
      break;

    case 'puzzle':
      content.puzzleDetails = `A puzzle appropriate for tier ${partyTier} ${tierInfo.label}. ` +
        `Multiple approaches should be viable. Intelligence or Wisdom checks at DC ${tierInfo.dcRange}.`;
      break;

    case 'revelation':
      content.revelationContent = `A major plot revelation occurs here. ` +
        `This information should significantly impact the party's understanding or goals.`;
      break;

    case 'mixed':
      content.combatNotes = `If combat occurs, use DC ${tierInfo.dcRange} for tactical actions.`;
      content.socialChallenges = 'Social elements may provide alternatives to direct conflict.';
      break;
  }

  return content;
}

// =============================================================================
// Main Handler
// =============================================================================

export async function generateSceneHandler(
  input: GenerateSceneInput
): Promise<GenerateSceneOutput> {
  const { sceneBrief, frame, outline, dialsSummary, feedback, previousDraft } = input;
  const { partyTier, themes, tone } = dialsSummary;

  const sceneType: NonNullable<SceneBrief['sceneType']> = sceneBrief.sceneType || 'mixed';
  const isClimactic = sceneBrief.sceneNumber === outline.scenes.length;
  const tierInfo = TIER_DESCRIPTIONS[partyTier] || TIER_DESCRIPTIONS[2];

  // Generate introduction
  const introTemplates = INTRODUCTION_TEMPLATES[sceneType];
  const introIndex = (sceneBrief.sceneNumber + frame.name.length) % introTemplates.length;
  let introduction = introTemplates[introIndex];

  // Enhance introduction with location if available
  if (sceneBrief.location) {
    introduction = `${sceneBrief.location}: ${introduction}`;
  }

  // Generate key moments
  const keyMoments = generateKeyMoments(sceneBrief, partyTier, themes);

  // Generate resolution
  const resolutionTemplates = RESOLUTION_TEMPLATES[sceneType];
  const resolutionIndex = (sceneBrief.sceneNumber + 1) % resolutionTemplates.length;
  const resolution = resolutionTemplates[resolutionIndex];

  // Generate tier guidance
  const tierGuidance = `For tier ${partyTier} ${tierInfo.label}: ` +
    `${tierInfo.challenge}. Skill DCs should range from ${tierInfo.dcRange}.`;

  // Generate tone notes if tone is set
  const toneNotes = tone
    ? `Maintain a ${tone} atmosphere throughout this scene.`
    : undefined;

  // Generate scene-type specific content
  const sceneTypeContent = generateSceneTypeContent(sceneType, sceneBrief, partyTier);

  // Extract entities
  const npcs = extractNPCs(sceneBrief, sceneType, feedback);
  const adversaries = extractAdversaries(sceneBrief, frame, partyTier, sceneType);
  const items = extractItems(sceneBrief, partyTier, sceneType);

  // Handle revision
  let title = sceneBrief.title;
  let sceneNumber = sceneBrief.sceneNumber;
  if (previousDraft) {
    // Preserve scene number and title from previous draft
    title = previousDraft.title;
    sceneNumber = previousDraft.sceneNumber;
  }

  // Build the scene draft
  const sceneDraft: SceneDraft = {
    sceneId: sceneBrief.id,
    sceneNumber,
    title,
    introduction,
    keyMoments,
    resolution,
    tierGuidance,
    toneNotes,
    isClimactic,
    ...sceneTypeContent,
    extractedEntities: {
      npcs,
      adversaries,
      items,
    },
  };

  // Build response message
  const keyMomentsList = keyMoments
    .map((m, i) => `${i + 1}. **${m.title}**: ${m.description}`)
    .join('\n');

  let responseMessage: string;
  if (feedback) {
    responseMessage =
      `I've revised **Scene ${sceneNumber}: ${title}** based on your feedback.\n\n` +
      `**Introduction**\n${introduction}\n\n` +
      `**Key Moments**\n${keyMomentsList}\n\n` +
      `**Resolution**\n${resolution}\n\n` +
      `Review the updated scene and let me know if you'd like further changes, or confirm to move on.`;
  } else {
    responseMessage =
      `Here's the draft for **Scene ${sceneNumber}: ${title}**:\n\n` +
      `**Introduction**\n${introduction}\n\n` +
      `**Key Moments**\n${keyMomentsList}\n\n` +
      `**Resolution**\n${resolution}\n\n` +
      `Provide feedback to revise, or confirm this scene to proceed.`;
  }

  return {
    assistantMessage: responseMessage,
    sceneDraft,
    isComplete: true,
  };
}
