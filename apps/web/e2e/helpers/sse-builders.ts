/**
 * SSE body builders for E2E tests
 *
 * Composes SSE response bodies that match the exact event format
 * defined in packages/shared-types/src/sage-events.ts.
 *
 * Each builder produces a complete chat envelope:
 *   chat:start -> (tool:start -> panel:* -> tool:end)* -> chat:delta -> chat:end
 *
 * Usage:
 *   const body = buildInvokingSSE({ spark: MOCK_SPARK });
 *   await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
 */

import {
  MOCK_SPARK,
  MOCK_COMPONENTS,
  MOCK_FRAMES,
  SELECTED_FRAME_ID,
  MOCK_SCENE_ARCS,
  MOCK_ADVENTURE_NAME,
  MOCK_WAVE1_SECTIONS,
  MOCK_WAVE2_SECTIONS,
  MOCK_WAVE3_SECTIONS,
} from './fixtures';

// =============================================================================
// Low-Level SSE Formatting
// =============================================================================

/** Format a single SSE event block (event + data + trailing newline) */
function sseEvent(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** Generate a unique message ID */
function messageId(): string {
  return `msg_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Generate a unique tool use ID */
function toolUseId(): string {
  return `toolu_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// =============================================================================
// Chat Envelope
// =============================================================================

/** Wrap a series of SSE events in a chat:start / chat:end envelope */
function wrapChatEnvelope(
  innerEvents: string[],
  chatText: string
): string {
  const msgId = messageId();
  const parts: string[] = [
    sseEvent('chat:start', { messageId: msgId }),
    ...innerEvents,
    sseEvent('chat:delta', { messageId: msgId, content: chatText }),
    sseEvent('chat:end', { messageId: msgId, inputTokens: 100, outputTokens: 50 }),
  ];
  return parts.join('');
}

/** Wrap a tool invocation: tool:start -> panel events -> tool:end */
function wrapToolCall(
  toolName: string,
  input: Record<string, unknown>,
  panelEvents: string[],
  result: unknown = { success: true }
): string[] {
  const tuId = toolUseId();
  return [
    sseEvent('tool:start', { toolUseId: tuId, toolName, input }),
    ...panelEvents,
    sseEvent('tool:end', { toolUseId: tuId, toolName, result, isError: false }),
  ];
}

// =============================================================================
// Stage-Specific SSE Builders
// =============================================================================

/**
 * Invoking stage — Sage extracts spark from conversation.
 *
 * Tool flow: set_spark -> panel:spark
 * Then ui:ready to signal stage can advance.
 */
export function buildInvokingSSE(
  options: { spark?: { name: string; vision: string } } = {}
): string {
  const spark = options.spark ?? MOCK_SPARK;

  const toolEvents = wrapToolCall(
    'set_spark',
    { name: spark.name, vision: spark.vision },
    [sseEvent('panel:spark', spark)]
  );

  const readyEvent = sseEvent('ui:ready', {
    stage: 'invoking',
    summary: 'Spark captured. Ready to attune.',
  });

  return wrapChatEnvelope(
    [...toolEvents, readyEvent],
    'I have distilled your vision into a spark. Shall we proceed to Attuning?'
  );
}

/**
 * Invoking stage greeting — Sage's opening message (no tools).
 */
export function buildInvokingGreetSSE(): string {
  return wrapChatEnvelope(
    [],
    'Welcome, storyteller. I am the Sage, keeper of the Codex. ' +
    'Tell me the seed of the adventure you wish to create.'
  );
}

/**
 * Attuning stage — Sage sets a component value.
 *
 * Tool flow: set_component -> panel:component (per component)
 * After all 8 confirmed, ui:ready signals advancement.
 */
export function buildAttuningSSE(
  options: {
    componentId?: string;
    value?: string | number | string[];
    allConfirmed?: boolean;
  } = {}
): string {
  const componentId = options.componentId ?? 'span';
  const value = options.value ?? '3-4 hours';
  const allConfirmed = options.allConfirmed ?? false;

  const toolEvents = wrapToolCall(
    'set_component',
    { componentId, value },
    [
      sseEvent('panel:component', {
        componentId,
        value,
        confirmed: true,
      }),
    ]
  );

  const extraEvents: string[] = [];
  if (allConfirmed) {
    extraEvents.push(
      sseEvent('ui:ready', {
        stage: 'attuning',
        summary: 'All 8 components confirmed.',
      })
    );
  }

  return wrapChatEnvelope(
    [...toolEvents, ...extraEvents],
    allConfirmed
      ? 'All components are set. You may continue to Binding.'
      : `I have set ${componentId}. What shall we tune next?`
  );
}

/**
 * Build an SSE body that sets all 8 components at once (for full-flow).
 */
export function buildAttuningAllComponentsSSE(): string {
  const components: Array<{ id: string; value: string | number | string[] }> = [
    { id: 'span', value: MOCK_COMPONENTS.span },
    { id: 'scenes', value: MOCK_COMPONENTS.scenes },
    { id: 'members', value: MOCK_COMPONENTS.members },
    { id: 'tier', value: MOCK_COMPONENTS.tier },
    { id: 'tenor', value: MOCK_COMPONENTS.tenor },
    { id: 'pillars', value: MOCK_COMPONENTS.pillars },
    { id: 'chorus', value: MOCK_COMPONENTS.chorus },
    { id: 'threads', value: MOCK_COMPONENTS.threads },
  ];

  const allToolEvents: string[] = [];
  for (const comp of components) {
    allToolEvents.push(
      ...wrapToolCall(
        'set_component',
        { componentId: comp.id, value: comp.value },
        [
          sseEvent('panel:component', {
            componentId: comp.id,
            value: comp.value,
            confirmed: true,
          }),
        ]
      )
    );
  }

  allToolEvents.push(
    sseEvent('ui:ready', {
      stage: 'attuning',
      summary: 'All 8 components confirmed.',
    })
  );

  return wrapChatEnvelope(
    allToolEvents,
    'All 8 components are attuned. Continue to Binding when ready.'
  );
}

/**
 * Binding stage — Sage queries frames and populates the gallery.
 *
 * Tool flow: query_frames -> panel:frames
 */
export function buildBindingFramesSSE(): string {
  const toolEvents = wrapToolCall(
    'query_frames',
    {},
    [
      sseEvent('panel:frames', {
        frames: MOCK_FRAMES,
        activeFrameId: null,
      }),
    ]
  );

  return wrapChatEnvelope(
    toolEvents,
    'I have found three frames that match your vision. Explore them and select one.'
  );
}

/**
 * Binding stage — Sage confirms frame selection.
 *
 * Tool flow: select_frame -> panel:frame_selected + ui:ready
 */
export function buildBindingSelectSSE(
  options: { frameId?: string } = {}
): string {
  const frameId = options.frameId ?? SELECTED_FRAME_ID;

  const toolEvents = wrapToolCall(
    'select_frame',
    { frameId },
    [sseEvent('panel:frame_selected', { frameId })]
  );

  const readyEvent = sseEvent('ui:ready', {
    stage: 'binding',
    summary: 'Frame selected. Ready to weave.',
  });

  return wrapChatEnvelope(
    [...toolEvents, readyEvent],
    'The frame is bound. Shall we weave the scenes?'
  );
}

/**
 * Weaving stage — Sage populates all scene arcs at once.
 *
 * Tool flow: set_all_scene_arcs -> panel:scene_arcs
 */
export function buildWeavingSceneArcsSSE(): string {
  const toolEvents = wrapToolCall(
    'set_all_scene_arcs',
    { sceneArcs: MOCK_SCENE_ARCS },
    [
      sseEvent('panel:scene_arcs', {
        sceneArcs: MOCK_SCENE_ARCS,
        activeSceneIndex: 0,
      }),
    ]
  );

  return wrapChatEnvelope(
    toolEvents,
    'I have drafted 4 scene arcs. Review each one and confirm when ready.'
  );
}

/**
 * Weaving stage — Sage suggests adventure name and signals ready.
 *
 * Tool flow: suggest_adventure_name -> panel:name + ui:ready
 */
export function buildWeavingNameSSE(): string {
  const toolEvents = wrapToolCall(
    'suggest_adventure_name',
    { name: MOCK_ADVENTURE_NAME },
    [
      sseEvent('panel:name', {
        name: MOCK_ADVENTURE_NAME,
        reason: 'Reflects the central lighthouse imagery.',
      }),
    ]
  );

  const readyEvent = sseEvent('ui:ready', {
    stage: 'weaving',
    summary: 'All scenes confirmed, name approved.',
  });

  return wrapChatEnvelope(
    [...toolEvents, readyEvent],
    'The tale is named. Ready to inscribe the first scene.'
  );
}

/**
 * Inscribing stage — Sage populates a wave of sections for a scene.
 *
 * Tool flow: set_wave -> panel:sections
 */
export function buildInscribingWaveSSE(
  options: {
    sceneArcId?: string;
    wave?: 1 | 2 | 3;
  } = {}
): string {
  const sceneArcId = options.sceneArcId ?? 'arc-001';
  const wave = options.wave ?? 1;

  const sections =
    wave === 1
      ? MOCK_WAVE1_SECTIONS
      : wave === 2
        ? MOCK_WAVE2_SECTIONS
        : MOCK_WAVE3_SECTIONS;

  const toolEvents = wrapToolCall(
    'set_wave',
    { sceneArcId, wave },
    [
      sseEvent('panel:sections', {
        sceneArcId,
        wave,
        sections,
      }),
    ]
  );

  return wrapChatEnvelope(
    toolEvents,
    `Wave ${wave} is inscribed. Review the sections and let me know if changes are needed.`
  );
}

/**
 * Inscribing stage — Sage confirms a scene (all 9 sections locked).
 *
 * Tool flow: confirm_scene -> panel:scene_confirmed + ui:ready
 */
export function buildInscribingConfirmSSE(
  options: { sceneArcId?: string; isLastScene?: boolean } = {}
): string {
  const sceneArcId = options.sceneArcId ?? 'arc-001';
  const isLastScene = options.isLastScene ?? false;

  const toolEvents = wrapToolCall(
    'confirm_scene',
    { sceneArcId },
    [sseEvent('panel:scene_confirmed', { sceneArcId })]
  );

  const extraEvents: string[] = [];
  if (isLastScene) {
    extraEvents.push(
      sseEvent('ui:ready', {
        stage: 'inscribing',
        summary: 'All scenes inscribed.',
      })
    );
  }

  return wrapChatEnvelope(
    [...toolEvents, ...extraEvents],
    isLastScene
      ? 'All scenes are inscribed. The tale is ready for delivery.'
      : 'This scene is confirmed. Moving to the next scene.'
  );
}

/**
 * Delivering stage greeting — Sage's celebration message.
 */
export function buildDeliveringGreetSSE(): string {
  return wrapChatEnvelope(
    [],
    'Your adventure is complete. The Shattered Beacon awaits its heroes. ' +
    'Download your adventure below and bring this tale to life at your table.'
  );
}

/**
 * Simple chat response with no tool calls.
 * Useful for generic responses during any stage.
 */
export function buildSimpleChatSSE(text: string): string {
  return wrapChatEnvelope([], text);
}
