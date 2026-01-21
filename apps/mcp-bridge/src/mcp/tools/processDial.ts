/**
 * process_dial_input MCP Tool
 *
 * Processes user input during dial tuning and returns structured dial suggestions.
 * This tool interprets natural language input and maps it to dial values.
 */

import type {
  ProcessDialInput,
  ProcessDialOutput,
  DialUpdate,
  InlineWidget,
  DialId,
  DialConfidence,
  ThemeOption,
} from '@dagger-app/shared-types';
import {
  TONE_REFERENCES,
  COMBAT_BALANCE_REFERENCES,
  LETHALITY_REFERENCES,
  isValidPartySize,
  isValidPartyTier,
  isValidSceneCount,
} from '@dagger-app/shared-types';
import type { ToolSchema } from '../mcpServer.js';

// =============================================================================
// Tool Schema
// =============================================================================

export const PROCESS_DIAL_INPUT_SCHEMA: ToolSchema = {
  description: 'Process user input for dial tuning and return structured dial suggestions',
  inputSchema: {
    type: 'object',
    properties: {
      userMessage: {
        type: 'string',
        description: 'The user\'s natural language message',
      },
      currentDials: {
        type: 'object',
        description: 'Current state of all dials',
      },
      conversationHistory: {
        type: 'array',
        description: 'Conversation history for context',
      },
      currentDialFocus: {
        type: 'string',
        description: 'Which dial is currently being discussed',
      },
    },
    required: ['userMessage', 'currentDials', 'conversationHistory'],
  },
};

// =============================================================================
// Dial Focus Order
// =============================================================================

const DIAL_ORDER: DialId[] = [
  'partySize',
  'partyTier',
  'sceneCount',
  'sessionLength',
  'tone',
  'pillarBalance',
  'npcDensity',
  'lethality',
  'emotionalRegister',
  'themes',
];

// =============================================================================
// Number Words Mapping
// =============================================================================

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Determine the next dial to focus on
 */
export function determineNextDialFocus(
  currentDials: ProcessDialInput['currentDials'],
  suggestedFocus?: DialId
): DialId | undefined {
  const confirmedSet = new Set(currentDials.confirmedDials);

  // If suggested focus is valid and not confirmed, use it
  if (suggestedFocus && !confirmedSet.has(suggestedFocus)) {
    return suggestedFocus;
  }

  // Find first unconfirmed dial in order
  for (const dialId of DIAL_ORDER) {
    if (!confirmedSet.has(dialId)) {
      return dialId;
    }
  }

  return undefined;
}

/**
 * Extract a number from text (digits or words)
 */
function extractNumber(text: string): number | null {
  const lower = text.toLowerCase();

  // Try word numbers first
  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    if (lower.includes(word)) {
      return num;
    }
  }

  // Try digit extraction
  const match = text.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }

  return null;
}

/**
 * Interpret user message as a dial value
 */
export function interpretDialValue(
  dialId: DialId,
  message: string
): unknown {
  const lower = message.toLowerCase();

  switch (dialId) {
    case 'partySize': {
      const num = extractNumber(message);
      if (num !== null && isValidPartySize(num)) {
        return num;
      }
      return null;
    }

    case 'partyTier': {
      // Look for "tier X" or "level X"
      const tierMatch = lower.match(/(?:tier|level)\s*(\d)/);
      if (tierMatch) {
        const tier = parseInt(tierMatch[1], 10);
        if (isValidPartyTier(tier)) {
          return tier;
        }
      }
      // Try plain number
      const num = extractNumber(message);
      if (num !== null && isValidPartyTier(num)) {
        return num;
      }
      return null;
    }

    case 'sceneCount': {
      const num = extractNumber(message);
      if (num !== null && isValidSceneCount(num)) {
        return num;
      }
      return null;
    }

    case 'sessionLength': {
      if (lower.includes('2-3') || lower.includes('2 to 3')) {
        return '2-3 hours';
      }
      if (lower.includes('3-4') || lower.includes('3 to 4')) {
        return '3-4 hours';
      }
      if (lower.includes('4-5') || lower.includes('4 to 5')) {
        return '4-5 hours';
      }
      return null;
    }

    case 'tone': {
      // Check for reference points
      for (const ref of TONE_REFERENCES) {
        if (lower.includes(ref.name.toLowerCase())) {
          return `${ref.description} (like ${ref.name})`;
        }
      }
      // Use the message as-is for custom descriptions
      if (message.length > 3) {
        return message.trim();
      }
      return null;
    }

    case 'pillarBalance': {
      // Check for reference points
      for (const ref of COMBAT_BALANCE_REFERENCES) {
        if (lower.includes(ref.name.toLowerCase())) {
          return `${ref.description} (like ${ref.name})`;
        }
      }
      // Check for keywords
      if (lower.includes('combat') && lower.includes('heavy')) {
        return 'Combat-heavy with tactical encounters';
      }
      if (lower.includes('exploration') || lower.includes('roleplay')) {
        return 'Exploration and roleplay focused';
      }
      if (lower.includes('balanced') || lower.includes('mix')) {
        return 'Balanced mix of combat and exploration';
      }
      if (message.length > 3) {
        return message.trim();
      }
      return null;
    }

    case 'npcDensity': {
      if (lower.includes('sparse') || lower.includes('few')) {
        return 'Sparse - few key NPCs';
      }
      if (lower.includes('moderate') || lower.includes('some')) {
        return 'Moderate - meaningful cast';
      }
      if (lower.includes('rich') || lower.includes('many') || lower.includes('lots')) {
        return 'Rich - bustling world';
      }
      if (message.length > 3) {
        return message.trim();
      }
      return null;
    }

    case 'lethality': {
      // Check for reference points
      for (const ref of LETHALITY_REFERENCES) {
        if (lower.includes(ref.name.toLowerCase())) {
          return `${ref.description} (like ${ref.name})`;
        }
      }
      // Check for keywords
      if (lower.includes('heroic') || lower.includes('safe')) {
        return 'Heroic - death is rare';
      }
      if (lower.includes('brutal') || lower.includes('deadly') || lower.includes('lethal')) {
        return 'Brutal - expect casualties';
      }
      if (lower.includes('tactical') || lower.includes('moderate')) {
        return 'Tactical - death is possible';
      }
      if (message.length > 3) {
        return message.trim();
      }
      return null;
    }

    case 'emotionalRegister': {
      const registers = ['thrilling', 'tense', 'heartfelt', 'whimsical', 'melancholic', 'triumphant'];
      for (const reg of registers) {
        if (lower.includes(reg)) {
          return reg;
        }
      }
      if (message.length > 3) {
        return message.trim();
      }
      return null;
    }

    case 'themes': {
      const themes: ThemeOption[] = [];
      const themeKeywords: Record<ThemeOption, string[]> = {
        'redemption': ['redemption', 'redeem'],
        'sacrifice': ['sacrifice', 'sacrific'],
        'identity': ['identity', 'who am i'],
        'power-corruption': ['power', 'corruption', 'corrupt'],
        'nature-civilization': ['nature', 'civilization', 'wild'],
        'trust-betrayal': ['trust', 'betrayal', 'betray'],
        'found-family': ['found family', 'chosen family', 'found-family'],
        'legacy': ['legacy', 'inheritance', 'heir'],
        'survival': ['survival', 'survive'],
        'justice-mercy': ['justice', 'mercy'],
      };

      for (const [theme, keywords] of Object.entries(themeKeywords)) {
        for (const keyword of keywords) {
          if (lower.includes(keyword)) {
            themes.push(theme as ThemeOption);
            break;
          }
        }
      }

      // Limit to 3 themes
      if (themes.length > 0) {
        return themes.slice(0, 3);
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Determine confidence level based on value extraction
 */
function determineConfidence(dialId: DialId, value: unknown, message: string): DialConfidence {
  const lower = message.toLowerCase();

  // High confidence indicators
  if (
    lower.includes('exactly') ||
    lower.includes('specifically') ||
    lower.includes('set to') ||
    lower.includes('make it')
  ) {
    return 'high';
  }

  // Concrete dials with exact matches are high confidence
  if (['partySize', 'partyTier', 'sceneCount', 'sessionLength'].includes(dialId)) {
    if (value !== null) {
      return 'high';
    }
  }

  // Reference point matches are high confidence
  if (dialId === 'tone' && typeof value === 'string' && value.includes('like')) {
    return 'high';
  }

  // Theme matches are medium confidence
  if (dialId === 'themes' && Array.isArray(value)) {
    return value.length > 0 ? 'medium' : 'low';
  }

  // Default to medium for conceptual dials
  return 'medium';
}

/**
 * Generate inline widget for a dial
 */
function generateInlineWidget(dialId: DialId): InlineWidget | null {
  switch (dialId) {
    case 'partySize':
      return {
        type: 'number_stepper',
        dialId: 'partySize',
        min: 2,
        max: 6,
      };

    case 'partyTier':
      return {
        type: 'tier_select',
        dialId: 'partyTier',
      };

    case 'sceneCount':
      return {
        type: 'number_stepper',
        dialId: 'sceneCount',
        min: 3,
        max: 6,
      };

    case 'sessionLength':
      return {
        type: 'session_length',
        dialId: 'sessionLength',
      };

    case 'tone':
      return {
        type: 'reference_cards',
        dialId: 'tone',
        references: TONE_REFERENCES,
      };

    case 'pillarBalance':
      return {
        type: 'reference_cards',
        dialId: 'pillarBalance',
        references: COMBAT_BALANCE_REFERENCES,
      };

    case 'lethality':
      return {
        type: 'reference_cards',
        dialId: 'lethality',
        references: LETHALITY_REFERENCES,
      };

    case 'themes':
      return {
        type: 'theme_chips',
        dialId: 'themes',
      };

    default:
      return null;
  }
}

/**
 * Generate a response message for the current dial focus
 */
export function generateDialResponse(
  dialFocus: DialId | undefined,
  _currentDials: ProcessDialInput['currentDials']
): string {
  if (!dialFocus) {
    return "All dials are configured! You're ready to proceed to the next phase.";
  }

  const prompts: Record<DialId, string> = {
    partySize: "How many players will be at your table? (2-6 players)",
    partyTier: "What tier are the characters? (1-4, where 1 is starting adventurers)",
    sceneCount: "How many scenes would you like in this adventure? (3-6 scenes)",
    sessionLength: "How long is your target session? (2-3 hours, 3-4 hours, or 4-5 hours)",
    tone: "What tone resonates with your adventure? You can reference media like 'like The Witcher' or describe it directly.",
    pillarBalance: "What's the balance between combat and exploration? Heavy combat, balanced, or roleplay-focused?",
    npcDensity: "How many NPCs should populate your adventure? Sparse, moderate, or rich?",
    lethality: "How lethal should encounters be? Heroic (safe), tactical (moderate danger), or brutal?",
    emotionalRegister: "What emotional register should dominate? Thrilling, tense, heartfelt, whimsical?",
    themes: "What themes should run through your adventure? (Choose up to 3: redemption, sacrifice, identity, etc.)",
  };

  return prompts[dialFocus] || `Let's configure ${dialFocus}.`;
}

// =============================================================================
// Main Handler
// =============================================================================

/**
 * Process dial input and return structured output
 */
export async function processDialInputHandler(
  input: ProcessDialInput
): Promise<ProcessDialOutput> {
  const { userMessage, currentDials, currentDialFocus } = input;

  const dialUpdates: DialUpdate[] = [];
  let nextDialFocus = currentDialFocus;

  // Try to interpret the message for the current dial focus
  if (currentDialFocus) {
    const value = interpretDialValue(currentDialFocus, userMessage);

    if (value !== null) {
      const confidence = determineConfidence(currentDialFocus, value, userMessage);
      dialUpdates.push({
        dialId: currentDialFocus,
        value,
        confidence,
        reason: `Interpreted from: "${userMessage}"`,
      });

      // Move to next dial
      const updatedConfirmed = [...currentDials.confirmedDials, currentDialFocus];
      nextDialFocus = determineNextDialFocus(
        { ...currentDials, confirmedDials: updatedConfirmed },
        undefined
      );
    }
  }

  // If no value extracted from current focus, try all dials
  if (dialUpdates.length === 0) {
    for (const dialId of DIAL_ORDER) {
      if (!currentDials.confirmedDials.includes(dialId)) {
        const value = interpretDialValue(dialId, userMessage);
        if (value !== null) {
          const confidence = determineConfidence(dialId, value, userMessage);
          dialUpdates.push({
            dialId,
            value,
            confidence,
            reason: `Detected from: "${userMessage}"`,
          });
        }
      }
    }
  }

  // Update next dial focus based on any updates
  if (dialUpdates.length > 0) {
    const newlyConfirmed = dialUpdates.map((u) => u.dialId);
    const updatedConfirmed = [...new Set([...currentDials.confirmedDials, ...newlyConfirmed])];
    nextDialFocus = determineNextDialFocus(
      { ...currentDials, confirmedDials: updatedConfirmed as DialId[] },
      undefined
    );
  } else {
    // No values extracted, keep or reset focus
    nextDialFocus = determineNextDialFocus(currentDials, currentDialFocus);
  }

  // Generate response
  let assistantMessage: string;
  if (dialUpdates.length > 0) {
    const updateDescriptions = dialUpdates.map(
      (u) => `${formatDialName(u.dialId)}: ${formatValue(u.value)}`
    );
    assistantMessage = `Got it! ${updateDescriptions.join(', ')}. `;
    if (nextDialFocus) {
      assistantMessage += generateDialResponse(nextDialFocus, currentDials);
    } else {
      assistantMessage += "All dials are configured!";
    }
  } else {
    assistantMessage = `I didn't catch a clear value from that. ${generateDialResponse(nextDialFocus, currentDials)}`;
  }

  // Generate inline widgets for next focus
  const inlineWidgets: InlineWidget[] = [];
  if (nextDialFocus) {
    const widget = generateInlineWidget(nextDialFocus);
    if (widget) {
      inlineWidgets.push(widget);
    }
  }

  return {
    assistantMessage,
    dialUpdates: dialUpdates.length > 0 ? dialUpdates : undefined,
    nextDialFocus,
    inlineWidgets: inlineWidgets.length > 0 ? inlineWidgets : undefined,
  };
}

// =============================================================================
// Formatting Helpers
// =============================================================================

function formatDialName(dialId: DialId): string {
  const names: Record<DialId, string> = {
    partySize: 'Party size',
    partyTier: 'Party tier',
    sceneCount: 'Scene count',
    sessionLength: 'Session length',
    tone: 'Tone',
    pillarBalance: 'Combat/exploration',
    npcDensity: 'NPC density',
    lethality: 'Lethality',
    emotionalRegister: 'Emotional register',
    themes: 'Themes',
  };
  return names[dialId] || dialId;
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
}
