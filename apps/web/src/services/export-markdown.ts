/**
 * Markdown generation from adventure state
 *
 * Converts the full AdventureState into a well-structured Markdown document
 * suitable for use at the gaming table. The document follows a clear hierarchy:
 *
 *   1. Adventure header (name, spark, components summary)
 *   2. Frame overview (setting, themes, lore)
 *   3. Scene-by-scene breakdown (arcs + inscribed content)
 *   4. Entity appendices (NPCs, adversaries, items across all scenes)
 *
 * Pure function with no side effects. Works entirely client-side.
 */

import type {
  AdventureState,
  AdventureSpark,
  BoundFrame,
  SceneArc,
  InscribedScene,
  SerializableComponentsState,
} from '@dagger-app/shared-types';

// =============================================================================
// Public API
// =============================================================================

/**
 * Generate the complete adventure Markdown from the current state.
 */
export function generateAdventureMarkdown(state: AdventureState): string {
  const sections: string[] = [];

  sections.push(buildHeader(state.adventureName, state.spark));
  sections.push(buildComponentsSummary(state.components));

  if (state.frame) {
    sections.push(buildFrameSection(state.frame));
  }

  sections.push(buildScenesSection(state.sceneArcs, state.inscribedScenes));

  return sections.join('\n\n---\n\n');
}

// =============================================================================
// Section Builders
// =============================================================================

function buildHeader(
  adventureName: string | null,
  spark: AdventureSpark | null
): string {
  const title = adventureName ?? 'Untitled Adventure';
  const lines: string[] = [`# ${title}`];

  if (spark) {
    lines.push('');
    lines.push(`> *"${spark.vision}"*`);
    lines.push('');
    lines.push(`**Working Title:** ${spark.name}`);
  }

  return lines.join('\n');
}

function buildComponentsSummary(
  components: SerializableComponentsState
): string {
  const lines: string[] = ['## Adventure Components'];

  const entries = [
    ['Span', components.span],
    ['Scenes', components.scenes],
    ['Members', components.members],
    ['Tier', components.tier],
    ['Tenor', components.tenor],
    ['Pillars', components.pillars],
    ['Chorus', components.chorus],
    ['Threads', formatThreads(components.threads)],
  ];

  for (const [label, value] of entries) {
    if (value !== null && value !== undefined) {
      lines.push(`- **${label}:** ${value}`);
    }
  }

  return lines.join('\n');
}

function buildFrameSection(frame: BoundFrame): string {
  const lines: string[] = ['## The Frame'];

  lines.push('');
  lines.push(`### ${frame.name}`);
  lines.push('');
  lines.push(frame.description);

  if (frame.themes.length > 0) {
    lines.push('');
    lines.push(`**Themes:** ${frame.themes.join(', ')}`);
  }

  if (frame.typicalAdversaries.length > 0) {
    lines.push('');
    lines.push(
      `**Typical Adversaries:** ${frame.typicalAdversaries.join(', ')}`
    );
  }

  if (frame.lore) {
    lines.push('');
    lines.push('#### Lore');
    lines.push('');
    lines.push(frame.lore);
  }

  return lines.join('\n');
}

function buildScenesSection(
  arcs: SceneArc[],
  inscribed: InscribedScene[]
): string {
  if (arcs.length === 0) return '## Scenes\n\n*No scenes created.*';

  const lines: string[] = ['## Scenes'];

  for (const arc of arcs) {
    lines.push('');
    lines.push(buildSceneArc(arc, inscribed));
  }

  return lines.join('\n');
}

function buildSceneArc(arc: SceneArc, inscribed: InscribedScene[]): string {
  const lines: string[] = [];
  const sceneLabel = `Scene ${arc.sceneNumber}`;

  lines.push(`### ${sceneLabel}: ${arc.title}`);
  lines.push('');
  lines.push(`*${arc.description}*`);

  if (arc.location) {
    lines.push('');
    lines.push(`**Location:** ${arc.location}`);
  }

  if (arc.sceneType !== 'mixed') {
    lines.push(`**Type:** ${arc.sceneType}`);
  }

  // Find the inscribed scene matching this arc
  const scene = inscribed.find((s) => s.arcId === arc.id);
  if (scene) {
    lines.push('');
    lines.push(buildInscribedSceneContent(scene));
  }

  return lines.join('\n');
}

function buildInscribedSceneContent(scene: InscribedScene): string {
  const lines: string[] = [];

  if (scene.introduction) {
    lines.push('#### Introduction');
    lines.push('');
    lines.push(scene.introduction);
  }

  if (scene.keyMoments.length > 0) {
    lines.push('');
    lines.push('#### Key Moments');
    for (const moment of scene.keyMoments) {
      lines.push('');
      lines.push(`**${moment.title}**`);
      lines.push(moment.description);
    }
  }

  if (scene.resolution) {
    lines.push('');
    lines.push('#### Resolution');
    lines.push('');
    lines.push(scene.resolution);
  }

  if (scene.npcs.length > 0) {
    lines.push('');
    lines.push('#### NPCs');
    for (const npc of scene.npcs) {
      lines.push(`- **${npc.name}** (${npc.role}): ${npc.description}`);
    }
  }

  if (scene.adversaries.length > 0) {
    lines.push('');
    lines.push('#### Adversaries');
    for (const adv of scene.adversaries) {
      const tierLabel = `Tier ${adv.tier}`;
      lines.push(`- **${adv.name}** (${adv.type}, ${tierLabel}): ${adv.notes}`);
    }
  }

  if (scene.items.length > 0) {
    lines.push('');
    lines.push('#### Items & Rewards');
    for (const item of scene.items) {
      lines.push(`- **${item.name}**: ${item.description}`);
    }
  }

  if (scene.portents.length > 0) {
    lines.push('');
    lines.push('#### Portents');
    for (const cat of scene.portents) {
      lines.push(`- **${cat.category}**: ${cat.entries.join('; ')}`);
    }
  }

  if (scene.tierGuidance) {
    lines.push('');
    lines.push('#### Tier Guidance');
    lines.push('');
    lines.push(scene.tierGuidance);
  }

  if (scene.toneNotes) {
    lines.push('');
    lines.push('#### GM Notes');
    lines.push('');
    lines.push(scene.toneNotes);
  }

  return lines.join('\n');
}

// =============================================================================
// Helpers
// =============================================================================

function formatThreads(threads: string[]): string | null {
  if (threads.length === 0) return null;
  return threads
    .map((t) =>
      t
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' & ')
    )
    .join(', ');
}
