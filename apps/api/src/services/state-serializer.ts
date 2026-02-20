/**
 * Adventure state serializer for LLM context
 *
 * Converts the AdventureState into compact text for inclusion in the
 * Anthropic API request. Uses a tiered context budget to control token usage:
 *
 *   T0: System prompt (~2-4K tokens) — handled by system-prompt.ts
 *   T1: Spark + Components (~0.5-2K tokens)
 *   T2: Active scene context (~2-8K tokens)
 *   T3: Confirmed/compressed scenes (~0.5-1.5K tokens)
 *   T4: Daggerheart data (on-demand via tools)
 *   T5: Conversation sliding window (handled by conversation-history.ts)
 *
 * This module handles T1, T2, and T3. Text is serialized as compact
 * prose (not raw JSON) for token efficiency.
 */

import type {
  AdventureState,
  InscribedScene,
  SceneArc,
  SerializableComponentsState,
  AdventureSpark,
  BoundFrame,
} from '@sage-codex/shared-types';
import type { Stage } from '@sage-codex/shared-types';

// =============================================================================
// Types
// =============================================================================

/** Options for controlling serialization output */
export interface SerializeOptions {
  /** The scene arc ID currently being worked on (for T2 detail) */
  activeSceneId?: string;
  /** Maximum character budget for the serialized output */
  maxCharacters?: number;
}

/** The serialized context result */
export interface SerializedContext {
  /** The compact text representation */
  text: string;
  /** Approximate character count */
  characterCount: number;
  /** Which tiers were included */
  tiersIncluded: string[];
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MAX_CHARACTERS = 12000;
const SECTION_SEPARATOR = '\n---\n';

// =============================================================================
// T1: Spark + Components
// =============================================================================

function serializeSpark(spark: AdventureSpark | null): string {
  if (!spark) return '';
  return `Adventure: "${spark.name}"\nVision: ${spark.vision}`;
}

function serializeComponents(
  components: SerializableComponentsState
): string {
  const lines: string[] = [];

  if (components.span) lines.push(`Span: ${components.span}`);
  if (components.scenes) lines.push(`Scenes: ${components.scenes}`);
  if (components.members) lines.push(`Members: ${components.members} players`);
  if (components.tier) lines.push(`Tier: ${components.tier}`);
  if (components.tenor) lines.push(`Tenor: ${components.tenor}`);
  if (components.pillars) lines.push(`Pillars: ${components.pillars}`);
  if (components.chorus) lines.push(`Chorus: ${components.chorus}`);
  if (components.threads.length > 0) {
    lines.push(`Threads: ${components.threads.join(', ')}`);
  }

  const confirmed = components.confirmedComponents;
  if (confirmed.length > 0) {
    lines.push(`Confirmed: ${confirmed.join(', ')}`);
  }

  return lines.length > 0 ? `Components:\n${lines.join('\n')}` : '';
}

function serializeFrame(frame: BoundFrame | null): string {
  if (!frame) return '';
  const parts = [`Frame: "${frame.name}"`, frame.description];
  if (frame.themes.length > 0) {
    parts.push(`Themes: ${frame.themes.join(', ')}`);
  }
  return parts.join('\n');
}

/**
 * Serialize T1 context: spark, components, and frame.
 */
function serializeTier1(state: AdventureState): string {
  const sections = [
    serializeSpark(state.spark),
    serializeComponents(state.components),
    serializeFrame(state.frame),
  ].filter(Boolean);

  return sections.join('\n\n');
}

// =============================================================================
// T2: Active Scene Detail
// =============================================================================

function serializeInscribedScene(scene: InscribedScene): string {
  const lines: string[] = [];
  lines.push(`Scene ${scene.sceneNumber}: "${scene.title}" [${scene.status}]`);

  if (scene.introduction) {
    lines.push(`\nIntroduction:\n${scene.introduction}`);
  }

  if (scene.keyMoments.length > 0) {
    lines.push('\nKey Moments:');
    for (const moment of scene.keyMoments) {
      lines.push(`  - ${moment.title}: ${moment.description}`);
    }
  }

  if (scene.resolution) {
    lines.push(`\nResolution:\n${scene.resolution}`);
  }

  if (scene.npcs.length > 0) {
    lines.push('\nNPCs:');
    for (const npc of scene.npcs) {
      lines.push(`  - ${npc.name} (${npc.role}): ${npc.description}`);
    }
  }

  if (scene.adversaries.length > 0) {
    lines.push('\nAdversaries:');
    for (const adv of scene.adversaries) {
      lines.push(`  - ${adv.name} [${adv.type}, T${adv.tier}]: ${adv.notes}`);
    }
  }

  if (scene.items.length > 0) {
    lines.push('\nItems:');
    for (const item of scene.items) {
      lines.push(`  - ${item.name} (T${item.suggestedTier}): ${item.description}`);
    }
  }

  if (scene.portents.length > 0) {
    lines.push('\nPortents:');
    for (const cat of scene.portents) {
      lines.push(`  ${cat.category}: ${cat.entries.join('; ')}`);
    }
  }

  if (scene.tierGuidance) {
    lines.push(`\nTier Guidance: ${scene.tierGuidance}`);
  }

  if (scene.toneNotes) {
    lines.push(`\nTone: ${scene.toneNotes}`);
  }

  return lines.join('\n');
}

/**
 * Serialize T2 context: full detail for the active scene.
 */
function serializeTier2(
  state: AdventureState,
  activeSceneId?: string
): string {
  if (!activeSceneId) return '';

  const scene = state.inscribedScenes.find((s) => s.arcId === activeSceneId);
  if (!scene) return '';

  return serializeInscribedScene(scene);
}

// =============================================================================
// T3: Confirmed/Compressed Scenes
// =============================================================================

function serializeSceneArcBrief(arc: SceneArc): string {
  return `  ${arc.sceneNumber}. "${arc.title}" (${arc.sceneType}) — ${arc.description}`;
}

function serializeConfirmedSceneBrief(scene: InscribedScene): string {
  const npcNames = scene.npcs.map((n) => n.name).join(', ');
  const advNames = scene.adversaries.map((a) => a.name).join(', ');
  const parts = [`  ${scene.sceneNumber}. "${scene.title}" [confirmed]`];
  if (npcNames) parts.push(`NPCs: ${npcNames}`);
  if (advNames) parts.push(`Adversaries: ${advNames}`);
  return parts.join(' | ');
}

/**
 * Serialize T3 context: compressed outline and confirmed scene summaries.
 *
 * Excludes the active scene (already in T2) to avoid duplication.
 */
function serializeTier3(
  state: AdventureState,
  activeSceneId?: string
): string {
  const lines: string[] = [];

  if (state.sceneArcs.length > 0) {
    lines.push('Outline:');
    for (const arc of state.sceneArcs) {
      lines.push(serializeSceneArcBrief(arc));
    }
  }

  const confirmedScenes = state.inscribedScenes.filter(
    (s) => s.status === 'confirmed' && s.arcId !== activeSceneId
  );

  if (confirmedScenes.length > 0) {
    lines.push('\nConfirmed Scenes:');
    for (const scene of confirmedScenes) {
      lines.push(serializeConfirmedSceneBrief(scene));
    }
  }

  return lines.join('\n');
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Serialize adventure state for LLM context injection.
 *
 * Produces compact text from the state, respecting the tiered context budget.
 * The output is injected into the system prompt or as a prefixed user message.
 *
 * Tiers included vary by stage:
 * - invoking/attuning: T1 only
 * - binding: T1
 * - weaving: T1 + T3 (outline)
 * - inscribing: T1 + T2 (active scene) + T3 (other scenes)
 * - delivering: T1 + T3 (all scenes compressed)
 */
export function serializeForLLM(
  state: AdventureState,
  stage: Stage,
  options: SerializeOptions = {}
): SerializedContext {
  const {
    activeSceneId,
    maxCharacters = DEFAULT_MAX_CHARACTERS,
  } = options;

  const sections: string[] = [];
  const tiersIncluded: string[] = [];

  // T1: Always included (spark, components, frame)
  const t1 = serializeTier1(state);
  if (t1) {
    sections.push(t1);
    tiersIncluded.push('T1');
  }

  // T2: Active scene detail (inscribing stage only)
  if (stage === 'inscribing' && activeSceneId) {
    const t2 = serializeTier2(state, activeSceneId);
    if (t2) {
      sections.push(t2);
      tiersIncluded.push('T2');
    }
  }

  // T3: Outline and confirmed scenes
  const includeT3 = ['weaving', 'inscribing', 'delivering'].includes(stage);
  if (includeT3) {
    const t3 = serializeTier3(state, activeSceneId);
    if (t3) {
      sections.push(t3);
      tiersIncluded.push('T3');
    }
  }

  let text = sections.join(SECTION_SEPARATOR);

  // Truncate if over budget (preserve beginning for most important context)
  if (text.length > maxCharacters) {
    text = text.slice(0, maxCharacters - 3) + '...';
  }

  return {
    text,
    characterCount: text.length,
    tiersIncluded,
  };
}
