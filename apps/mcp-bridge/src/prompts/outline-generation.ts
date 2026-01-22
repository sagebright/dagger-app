/**
 * Outline Generation Prompt Builders
 *
 * Provides system and user prompt construction for Claude CLI outline generation.
 * These prompts include frame context, dial settings, and tier-appropriate guidance.
 */

import type { SelectedFrame, Outline } from '@dagger-app/shared-types';
import { isCustomFrame } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

/**
 * Dial summary for outline generation context
 */
export interface OutlineDialsSummary {
  partySize: number;
  partyTier: 1 | 2 | 3 | 4;
  sceneCount: number;
  sessionLength: string;
  tone: string | null;
  themes: string[];
  pillarBalance: string | null;
  lethality: string | null;
}

/**
 * Options for building the system prompt
 */
export interface SystemPromptOptions {
  frame: SelectedFrame;
  dialsSummary: OutlineDialsSummary;
}

/**
 * Options for building the user prompt
 */
export interface UserPromptOptions {
  dialsSummary: OutlineDialsSummary;
  feedback?: string;
  previousOutline?: Outline;
}

// =============================================================================
// Tier Context Constants
// =============================================================================

/**
 * Tier descriptions with DC ranges and narrative context
 */
const TIER_CONTEXT: Record<1 | 2 | 3 | 4, TierInfo> = {
  1: {
    name: 'Fledgling',
    description: 'fledgling adventurers just beginning their journey',
    dcRange: '10-12',
    challengeGuidance: 'Keep challenges straightforward. Focus on learning moments and early victories that build confidence.',
    narrativeGuidance: 'Establish the party\'s potential and hint at greater challenges ahead.',
  },
  2: {
    name: 'Experienced',
    description: 'experienced heroes who have proven their worth',
    dcRange: '12-15',
    challengeGuidance: 'Introduce complex tactical situations. Allow for meaningful choices with real consequences.',
    narrativeGuidance: 'Explore personal stakes and regional-level threats. Build toward reputation.',
  },
  3: {
    name: 'Veteran',
    description: 'veteran champions recognized across the land',
    dcRange: '15-18',
    challengeGuidance: 'Present multi-layered challenges requiring creativity. Enemies should be cunning and well-prepared.',
    narrativeGuidance: 'Stakes affect kingdoms or major factions. Party decisions shape the world.',
  },
  4: {
    name: 'Legendary',
    description: 'legendary figures whose deeds echo through history',
    dcRange: '18-22',
    challengeGuidance: 'Design encounters at the peak of mortal capability. Challenge legendary abilities.',
    narrativeGuidance: 'World-altering consequences. Confront ancient evils or cosmic threats.',
  },
};

interface TierInfo {
  name: string;
  description: string;
  dcRange: string;
  challengeGuidance: string;
  narrativeGuidance: string;
}

// =============================================================================
// Scene Type Guidance
// =============================================================================

/**
 * Scene type descriptions for the AI
 */
const SCENE_TYPE_DESCRIPTIONS = `
Scene Types (use these values in sceneType field):
- combat: Direct confrontation with enemies. Include tactical elements and meaningful stakes.
- exploration: Discovery and environmental challenges. Focus on curiosity and resource management.
- social: Roleplaying encounters with NPCs. Include persuasion, deception, or negotiation opportunities.
- puzzle: Mental challenges requiring creative problem-solving. Include clues and multiple solution paths.
- revelation: Major plot or character discoveries. High emotional impact moments.
- mixed: Scenes that blend multiple types, often climactic moments combining combat with revelations.
`;

// =============================================================================
// System Prompt Builder
// =============================================================================

/**
 * Build the system prompt for outline generation.
 * Includes frame context, party context, and tone/style guidance.
 */
export function buildOutlineSystemPrompt(options: SystemPromptOptions): string {
  const { frame, dialsSummary } = options;
  const tier = TIER_CONTEXT[dialsSummary.partyTier];

  const frameContext = buildFrameContext(frame);
  const partyContext = buildPartyContext(dialsSummary, tier);
  const toneGuidance = buildToneGuidance(dialsSummary);

  return `You are an expert TTRPG adventure designer creating an adventure outline for Daggerheart.

## Your Role
Generate compelling adventure outlines with 3-6 scene briefs that form a cohesive narrative arc.
Each scene should have clear purpose, appropriate challenge level, and contribute to the overall story.

## Frame Context
${frameContext}

## Party Context
${partyContext}

## Tone & Style Guidance
${toneGuidance}

${SCENE_TYPE_DESCRIPTIONS}

## Output Requirements
Your response MUST be valid JSON matching the provided schema exactly.
- Generate exactly ${dialsSummary.sceneCount} scenes
- Each scene needs: sceneNumber, title, description, sceneType
- Optional but encouraged: keyElements (array of key moments), location, characters
- Ensure narrative flow from scene 1 to the climax
- Final scene should be climactic and meaningful

## Quality Guidelines
- Titles should be evocative but concise (3-8 words)
- Descriptions should set up the scene without spoiling solutions
- keyElements should highlight 2-4 key moments or challenges
- Location suggestions should fit the frame's setting
- Character suggestions should reference frame adversaries when appropriate

Remember: Create scenes that are tier-appropriate and tonally consistent with the frame.`;
}

/**
 * Build frame context section
 */
function buildFrameContext(frame: SelectedFrame): string {
  const name = frame.name;
  const description = frame.description;
  const themes = frame.themes?.join(', ') || 'Not specified';

  // Handle different frame types (custom vs database)
  let adversaries: string;
  if (isCustomFrame(frame)) {
    adversaries = frame.typicalAdversaries?.join(', ') || 'Not specified';
  } else {
    const dbFrame = frame as { typical_adversaries?: string[] };
    adversaries = dbFrame.typical_adversaries?.join(', ') || 'Not specified';
  }

  return `**Frame Name:** ${name}
**Description:** ${description}
**Themes:** ${themes}
**Typical Adversaries:** ${adversaries}`;
}

/**
 * Build party context section
 */
function buildPartyContext(dialsSummary: OutlineDialsSummary, tier: TierInfo): string {
  return `**Party Size:** ${dialsSummary.partySize} adventurers
**Party Tier:** ${tier.name} (Tier ${dialsSummary.partyTier}) - ${tier.description}
**Difficulty Class Range:** DC ${tier.dcRange}
**Session Length:** ${dialsSummary.sessionLength}

**Challenge Guidance:** ${tier.challengeGuidance}
**Narrative Guidance:** ${tier.narrativeGuidance}`;
}

/**
 * Build tone and style guidance section
 */
function buildToneGuidance(dialsSummary: OutlineDialsSummary): string {
  const parts: string[] = [];

  if (dialsSummary.tone) {
    parts.push(`**Tone:** ${dialsSummary.tone}`);
  }

  if (dialsSummary.themes.length > 0) {
    parts.push(`**Themes to Explore:** ${dialsSummary.themes.join(', ')}`);
  }

  if (dialsSummary.pillarBalance) {
    parts.push(`**Gameplay Balance:** ${dialsSummary.pillarBalance}`);
  }

  if (dialsSummary.lethality) {
    parts.push(`**Lethality Level:** ${dialsSummary.lethality}`);
  }

  if (parts.length === 0) {
    return 'Use your judgment to create a balanced, engaging adventure.';
  }

  return parts.join('\n');
}

// =============================================================================
// User Prompt Builder
// =============================================================================

/**
 * Build the user prompt for outline generation.
 * Handles both initial generation and feedback-based revision.
 */
export function buildOutlineUserPrompt(options: UserPromptOptions): string {
  const { dialsSummary, feedback, previousOutline } = options;

  // Revision flow: user provided feedback on previous outline
  if (feedback && previousOutline) {
    return buildRevisionPrompt(feedback, previousOutline, dialsSummary);
  }

  // Initial generation flow
  return buildInitialPrompt(dialsSummary);
}

/**
 * Build prompt for initial outline generation
 */
function buildInitialPrompt(dialsSummary: OutlineDialsSummary): string {
  const sceneDistribution = getSceneDistributionGuidance(dialsSummary);

  return `Generate an adventure outline with exactly ${dialsSummary.sceneCount} scenes.

${sceneDistribution}

Create a compelling narrative arc that:
1. Opens with an engaging hook that draws the party in
2. Builds tension through escalating challenges
3. Includes moments for roleplay, exploration, and combat as appropriate
4. Culminates in a satisfying climax that feels earned
5. Matches the tier ${dialsSummary.partyTier} power level throughout

Output your response as valid JSON matching the schema.`;
}

/**
 * Build prompt for revision based on user feedback
 */
function buildRevisionPrompt(
  feedback: string,
  previousOutline: Outline,
  dialsSummary: OutlineDialsSummary
): string {
  const previousScenesDescription = previousOutline.scenes
    .map((s) => `${s.sceneNumber}. "${s.title}" (${s.sceneType})`)
    .join('\n');

  return `The user has provided feedback on the previous outline. Please revise accordingly.

## Previous Outline
Title: ${previousOutline.title}
Summary: ${previousOutline.summary}

Scenes:
${previousScenesDescription}

## User Feedback
${feedback}

## Instructions
Revise the outline based on the feedback while maintaining:
- Exactly ${dialsSummary.sceneCount} scenes
- Tier ${dialsSummary.partyTier} appropriate challenges
- Narrative coherence and flow
- Consistency with the frame's themes and adversaries

If the feedback requests more combat, shift scene types toward combat.
If the feedback requests more roleplay, shift toward social and exploration.
If the feedback references specific scenes, focus changes on those scenes.

Output your revised outline as valid JSON matching the schema.`;
}

/**
 * Get scene distribution guidance based on pillar balance
 */
function getSceneDistributionGuidance(dialsSummary: OutlineDialsSummary): string {
  const balance = dialsSummary.pillarBalance?.toLowerCase() || 'balanced';

  if (balance.includes('combat') || balance.includes('action')) {
    return `Scene distribution should favor combat:
- Include 2-3 combat scenes
- 1-2 exploration or puzzle scenes
- 1 social scene for narrative depth
- Climactic scene should be combat-focused`;
  }

  if (balance.includes('exploration') || balance.includes('story') || balance.includes('roleplay')) {
    return `Scene distribution should favor exploration and roleplay:
- Include 2-3 exploration or social scenes
- 1-2 combat scenes for tension
- 1 puzzle or revelation scene
- Climactic scene can blend types`;
  }

  // Balanced default
  return `Scene distribution should be balanced:
- Mix of combat, exploration, social, and puzzle scenes
- No more than 2 consecutive scenes of the same type
- Climactic scene should incorporate multiple elements
- Ensure variety in challenge types`;
}

// =============================================================================
// Exports
// =============================================================================

export {
  TIER_CONTEXT,
  SCENE_TYPE_DESCRIPTIONS,
  buildFrameContext,
  buildPartyContext,
  buildToneGuidance,
  getSceneDistributionGuidance,
};
