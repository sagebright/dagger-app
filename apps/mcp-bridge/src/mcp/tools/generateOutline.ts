/**
 * generate_outline_draft MCP Tool
 *
 * Generates adventure outlines with scene briefs based on:
 * - Selected frame (setting/theme)
 * - Dial settings (scene count, tone, combat balance, etc.)
 * - User feedback (for regeneration)
 */

import type {
  GenerateOutlineInput,
  GenerateOutlineOutput,
  SceneBrief,
  Outline,
  SelectedFrame,
} from '@dagger-app/shared-types';
import { isCustomFrame } from '@dagger-app/shared-types';
import type { ToolSchema } from '../mcpServer.js';

// =============================================================================
// Tool Schema
// =============================================================================

export const GENERATE_OUTLINE_SCHEMA: ToolSchema = {
  description: 'Generate an adventure outline with scene briefs from frame and dials',
  inputSchema: {
    type: 'object',
    properties: {
      frame: {
        type: 'object',
        description: 'The selected adventure frame',
      },
      dialsSummary: {
        type: 'object',
        description: 'Current dial settings',
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
        description: 'Optional user feedback for regeneration',
      },
      previousOutline: {
        type: 'object',
        description: 'Previous outline when regenerating based on feedback',
      },
    },
    required: ['frame', 'dialsSummary'],
  },
};

// =============================================================================
// Scene Type Distribution
// =============================================================================

/**
 * Scene type patterns based on combat/exploration balance
 */
const SCENE_TYPE_DISTRIBUTIONS: Record<string, Array<SceneBrief['sceneType']>> = {
  'combat-heavy': ['combat', 'combat', 'exploration', 'combat', 'social', 'combat'],
  'exploration-heavy': ['exploration', 'social', 'exploration', 'puzzle', 'revelation', 'exploration'],
  'balanced': ['exploration', 'social', 'combat', 'puzzle', 'revelation', 'combat'],
  default: ['exploration', 'combat', 'social', 'revelation', 'combat', 'mixed'],
};

/**
 * Get scene types based on dial settings
 */
function getSceneTypeDistribution(
  sceneCount: number,
  combatBalance: string | null
): Array<SceneBrief['sceneType']> {
  let key = 'default';
  if (combatBalance) {
    const lower = combatBalance.toLowerCase();
    if (lower.includes('combat') || lower.includes('action')) {
      key = 'combat-heavy';
    } else if (lower.includes('exploration') || lower.includes('story') || lower.includes('roleplay')) {
      key = 'exploration-heavy';
    } else if (lower.includes('balance')) {
      key = 'balanced';
    }
  }

  const distribution = SCENE_TYPE_DISTRIBUTIONS[key];
  return distribution.slice(0, sceneCount);
}

// =============================================================================
// Scene Template Generation
// =============================================================================

/**
 * Scene templates by type
 */
const SCENE_TEMPLATES: Record<NonNullable<SceneBrief['sceneType']>, string[]> = {
  combat: [
    'A confrontation with hostile forces threatens the party',
    'An ambush catches the party off guard',
    'The party must defend a key location against attackers',
    'A chase through dangerous terrain turns violent',
  ],
  exploration: [
    'The party discovers a mysterious location',
    'Environmental hazards test the party\'s resourcefulness',
    'Hidden passages reveal forgotten secrets',
    'Navigation through treacherous terrain',
  ],
  social: [
    'Negotiations with a key faction determine the next steps',
    'Information gathering in a populated area',
    'A moral dilemma requires careful consideration',
    'Building alliances with potential allies',
  ],
  puzzle: [
    'An ancient mechanism must be deciphered',
    'Riddles guard the path forward',
    'Piecing together scattered clues',
    'A magical ward requires creative solutions',
  ],
  revelation: [
    'A shocking truth changes everything',
    'The true nature of the threat becomes clear',
    'Hidden connections come to light',
    'A key ally\'s secret is revealed',
  ],
  mixed: [
    'Multiple challenges converge in a critical moment',
    'The situation escalates beyond initial expectations',
    'Unexpected complications force difficult choices',
    'The climax brings together all threads',
  ],
};

/**
 * Generate key elements based on scene type
 */
function generateKeyElements(sceneType: SceneBrief['sceneType'], themes: string[]): string[] {
  const baseElements: Record<NonNullable<SceneBrief['sceneType']>, string[]> = {
    combat: ['Initiative check', 'Tactical positioning', 'Environmental hazards'],
    exploration: ['Perception checks', 'Resource management', 'Discovery moments'],
    social: ['Roleplay opportunity', 'Information reveal', 'Trust building'],
    puzzle: ['Clue gathering', 'Problem solving', 'Knowledge checks'],
    revelation: ['Plot twist', 'Emotional impact', 'Story advancement'],
    mixed: ['Escalating tension', 'Multiple skill checks', 'Party coordination'],
  };

  const elements = [...(baseElements[sceneType || 'mixed'] || baseElements.mixed)];

  // Add theme-related elements
  if (themes.includes('redemption')) elements.push('Opportunity for redemption');
  if (themes.includes('sacrifice')) elements.push('Potential sacrifice moment');
  if (themes.includes('identity')) elements.push('Identity revelation');
  if (themes.includes('legacy')) elements.push('Connection to the past');

  return elements.slice(0, 4);
}

/**
 * Generate a scene title based on type and context
 */
function generateSceneTitle(
  sceneNumber: number,
  sceneType: SceneBrief['sceneType'],
  frameThemes: string[],
  isClimactic: boolean
): string {
  const climacticPrefixes = ['The Final', 'The Ultimate', 'The Decisive'];
  const regularPrefixes = ['The', 'A', 'Into the'];

  const typeNouns: Record<NonNullable<SceneBrief['sceneType']>, string[]> = {
    combat: ['Confrontation', 'Battle', 'Clash', 'Siege'],
    exploration: ['Discovery', 'Journey', 'Passage', 'Search'],
    social: ['Negotiation', 'Gathering', 'Council', 'Meeting'],
    puzzle: ['Enigma', 'Riddle', 'Mystery', 'Challenge'],
    revelation: ['Truth', 'Revelation', 'Awakening', 'Unveiling'],
    mixed: ['Crossroads', 'Convergence', 'Turning Point', 'Reckoning'],
  };

  const nouns = typeNouns[sceneType || 'mixed'] || typeNouns.mixed;
  const noun = nouns[Math.floor(sceneNumber % nouns.length)];
  const prefix = isClimactic
    ? climacticPrefixes[Math.floor(sceneNumber % climacticPrefixes.length)]
    : regularPrefixes[Math.floor(sceneNumber % regularPrefixes.length)];

  // Add thematic flavor
  const themeAdjectives: Record<string, string> = {
    horror: 'Dreadful',
    mystery: 'Hidden',
    heist: 'Cunning',
    political: 'Delicate',
    dungeon: 'Ancient',
    wilderness: 'Untamed',
    urban: 'Shadowy',
    war: 'Fierce',
  };

  const themeAdj = frameThemes.find((t) => themeAdjectives[t]);
  const adjective = themeAdj ? themeAdjectives[themeAdj] : '';

  return `${prefix} ${adjective ? adjective + ' ' : ''}${noun}`;
}

// =============================================================================
// Location Generation
// =============================================================================

/**
 * Generate location suggestions based on frame and scene type
 */
function generateLocation(
  frame: SelectedFrame,
  sceneType: SceneBrief['sceneType'],
  sceneIndex: number
): string {
  const frameDescription = frame.description.toLowerCase();

  // Extract location hints from frame
  const locationKeywords = [
    'forest', 'dungeon', 'city', 'castle', 'temple', 'cave', 'mountain',
    'swamp', 'desert', 'tower', 'ruins', 'village', 'camp', 'ship',
  ];

  const foundLocations = locationKeywords.filter((kw) => frameDescription.includes(kw));

  // Default locations by scene type
  const defaultLocations: Record<NonNullable<SceneBrief['sceneType']>, string[]> = {
    combat: ['contested battlefield', 'narrow passage', 'defensive position', 'open arena'],
    exploration: ['uncharted territory', 'ancient ruins', 'winding paths', 'hidden chamber'],
    social: ['public gathering place', 'private meeting room', 'busy marketplace', 'tavern'],
    puzzle: ['sealed chamber', 'arcane library', 'mechanism room', 'shrine'],
    revelation: ['inner sanctum', 'secret vault', 'throne room', 'sacred grove'],
    mixed: ['central hub', 'crossroads', 'battleground', 'climactic arena'],
  };

  const typeLocations = defaultLocations[sceneType || 'mixed'] || defaultLocations.mixed;

  // Prefer frame-suggested locations, fall back to type-based
  if (foundLocations.length > sceneIndex % foundLocations.length) {
    return `The ${foundLocations[sceneIndex % foundLocations.length]}`;
  }

  return typeLocations[sceneIndex % typeLocations.length];
}

// =============================================================================
// Character/Adversary Suggestions
// =============================================================================

/**
 * Generate character suggestions based on frame
 */
function generateCharacters(
  frame: SelectedFrame,
  sceneType: SceneBrief['sceneType']
): string[] {
  const adversaries = isCustomFrame(frame)
    ? frame.typicalAdversaries || []
    : (frame as { typical_adversaries?: string[] }).typical_adversaries || [];

  const characters: string[] = [];

  switch (sceneType) {
    case 'combat':
      // Add adversaries for combat scenes
      if (adversaries.length > 0) {
        characters.push(adversaries[0]);
      }
      characters.push('Environmental hazards');
      break;
    case 'social':
      characters.push('Key NPC', 'Faction representative');
      break;
    case 'exploration':
      characters.push('Local guide (optional)', 'Wildlife');
      break;
    case 'puzzle':
      characters.push('Ancient guardian (optional)', 'Trapped spirit');
      break;
    case 'revelation':
      characters.push('Key informant', 'Hidden observer');
      break;
    case 'mixed':
    default:
      if (adversaries.length > 0) {
        characters.push(adversaries[0]);
      }
      characters.push('Supporting NPC');
      break;
  }

  return characters.slice(0, 3);
}

// =============================================================================
// Adventure Title Generation
// =============================================================================

/**
 * Generate an adventure title from frame
 */
function generateAdventureTitle(frame: SelectedFrame): string {
  // If frame has a compelling name, use it with a modifier
  const prefixes = ['The', 'Quest for', 'Shadows of', 'Into', 'Beyond'];
  const prefix = prefixes[Math.floor(frame.name.length % prefixes.length)];

  if (frame.name.length > 30) {
    return frame.name;
  }

  // Avoid double "The"
  if (frame.name.startsWith('The ')) {
    return frame.name;
  }

  return `${prefix} ${frame.name}`;
}

// =============================================================================
// Main Handler
// =============================================================================

/**
 * Generate outline with scene briefs
 */
export async function generateOutlineHandler(
  input: GenerateOutlineInput
): Promise<GenerateOutlineOutput> {
  const { frame, dialsSummary, feedback, previousOutline } = input;
  const { sceneCount, themes, pillarBalance, tone } = dialsSummary;

  // Validate scene count
  if (sceneCount < 3 || sceneCount > 6) {
    return {
      assistantMessage: 'Scene count must be between 3 and 6. Please adjust the scene count dial.',
      isComplete: false,
      followUpQuestion: 'How many scenes would you like in this adventure (3-6)?',
    };
  }

  // If feedback provided, acknowledge and regenerate
  if (feedback && previousOutline) {
    const lowerFeedback = feedback.toLowerCase();

    // Parse feedback for specific changes
    if (lowerFeedback.includes('more combat')) {
      dialsSummary.pillarBalance = 'combat-heavy';
    } else if (lowerFeedback.includes('less combat') || lowerFeedback.includes('more exploration')) {
      dialsSummary.pillarBalance = 'exploration-heavy';
    }
  }

  // Get scene type distribution
  const sceneTypes = getSceneTypeDistribution(sceneCount, pillarBalance);
  const frameThemes = frame.themes || [];

  // Generate scene briefs
  const scenes: Omit<SceneBrief, 'id'>[] = [];

  for (let i = 0; i < sceneCount; i++) {
    const sceneNumber = i + 1;
    const sceneType = sceneTypes[i] || 'mixed';
    const isClimactic = i === sceneCount - 1;
    const templates = SCENE_TEMPLATES[sceneType];
    const templateIndex = (i + frame.name.length) % templates.length;

    scenes.push({
      sceneNumber,
      title: generateSceneTitle(sceneNumber, sceneType, frameThemes, isClimactic),
      description: templates[templateIndex],
      keyElements: generateKeyElements(sceneType, themes),
      location: generateLocation(frame, sceneType, i),
      characters: generateCharacters(frame, sceneType),
      sceneType,
    });
  }

  // Generate summary
  const tierDescriptions = {
    1: 'fledgling adventurers',
    2: 'experienced heroes',
    3: 'veteran champions',
    4: 'legendary figures',
  };
  const tierDesc = tierDescriptions[dialsSummary.partyTier] || 'adventurers';

  const summary = `An adventure for ${dialsSummary.partySize} ${tierDesc} set in ${frame.name}. ` +
    `${frame.description.slice(0, 150)}${frame.description.length > 150 ? '...' : ''} ` +
    `The journey spans ${sceneCount} scenes${tone ? `, with a ${tone} tone` : ''}.`;

  const outlineDraft: Omit<Outline, 'id' | 'isConfirmed' | 'createdAt' | 'updatedAt'> = {
    title: generateAdventureTitle(frame),
    summary,
    scenes: scenes as SceneBrief[],
  };

  // Build response message
  const sceneList = scenes
    .map((s, i) => `${i + 1}. **${s.title}** (${s.sceneType}) - ${s.description}`)
    .join('\n');

  const responseMessage = feedback
    ? `I've revised the outline based on your feedback. Here's the updated adventure structure:\n\n**${outlineDraft.title}**\n\n${sceneList}\n\nWould you like to make any other changes, or shall we proceed with this outline?`
    : `Here's your adventure outline based on the **${frame.name}** frame:\n\n**${outlineDraft.title}**\n\n${summary}\n\n${sceneList}\n\nReview the scenes and let me know if you'd like any changes, or confirm to proceed to scene writing.`;

  return {
    assistantMessage: responseMessage,
    outline: outlineDraft,
    isComplete: true,
  };
}
