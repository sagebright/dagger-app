/**
 * InscribingPage -- Fifth stage of the Sage Codex Unfolding
 *
 * Renders the 65/35 layout with:
 * - Left: ChatPanel for conversational scene drafting
 * - Right: InscribingPanel (SceneTabs + SectionAccordion/NarrativeDetail + StageFooter)
 *
 * Wave lifecycle:
 *   Wave 1 populates first (Overview, Setup, Developments)
 *   Wave 2 fills after Wave 1 (NPCs Present, Adversaries, Items)
 *   Wave 3 is dimmed (0.4 opacity) until Waves 1-2 settle
 *   Wave 1-2 modifications invalidate Wave 3
 *
 * Scene-level confirmation locks all 9 sections at once.
 *
 * Handles SSE streaming via useSageStream hook and dispatches
 * panel:sections, panel:section, panel:wave3_invalidated,
 * panel:balance_warning, and panel:scene_confirmed events.
 */

import { useState, useCallback } from 'react';
import { useSageGreeting } from '@/hooks/useSageGreeting';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSageStream } from '@/hooks/useSageStream';
import { useChatStore } from '@/stores/chatStore';
import { useAdventureStore } from '@/stores/adventureStore';
import { AppShell } from '@/components/layout/AppShell';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { InscribingPanel } from '@/components/panels/InscribingPanel';
import type { SceneInscriptionState, PanelView } from '@/components/panels/InscribingPanel';
import type {
  SceneArcData,
  InscribingSectionData,
  InscribingSectionId,
  WaveNumber,
} from '@sage-codex/shared-types';
import { WAVE_SECTIONS, SECTION_LABELS } from '@sage-codex/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface InscribingPageProps {
  /** The active session ID */
  sessionId: string;
  /** Called when the user navigates to a completed stage via StageDropdown */
  onNavigate?: (stage: import('@sage-codex/shared-types').Stage) => void;
}

// =============================================================================
// Helpers
// =============================================================================

/** Create empty sections for a new scene */
function createEmptySections(): InscribingSectionData[] {
  const sections: InscribingSectionData[] = [];

  for (const [waveStr, sectionIds] of Object.entries(WAVE_SECTIONS)) {
    const wave = Number(waveStr) as WaveNumber;
    for (const sectionId of sectionIds) {
      sections.push({
        id: sectionId,
        label: SECTION_LABELS[sectionId],
        content: '',
        wave,
        hasDetail: ['setup', 'developments', 'transitions'].includes(sectionId),
      });
    }
  }

  return sections;
}

/** Determine which waves have content */
function getPopulatedWaves(sections: InscribingSectionData[]): Set<WaveNumber> {
  const populated = new Set<WaveNumber>();

  for (const section of sections) {
    if (section.content.length > 0) {
      populated.add(section.wave);
    }
  }

  return populated;
}

/** Check if Waves 1 and 2 are fully settled (all sections have content) */
function areWaves1And2Settled(sections: InscribingSectionData[]): boolean {
  return sections
    .filter((s) => s.wave === 1 || s.wave === 2)
    .every((s) => s.content.length > 0);
}

/** Update a single section within the sections array */
function updateSectionContent(
  sections: InscribingSectionData[],
  sectionId: InscribingSectionId,
  content: string
): InscribingSectionData[] {
  return sections.map((s) =>
    s.id === sectionId ? { ...s, content } : s
  );
}

/** Replace all sections for a given wave */
function replaceWaveSections(
  existing: InscribingSectionData[],
  incoming: InscribingSectionData[]
): InscribingSectionData[] {
  return existing.map((s) => {
    const replacement = incoming.find((inc) => inc.id === s.id);
    return replacement ?? s;
  });
}

/** Determine the footer button label */
function determineFooterLabel(
  allScenesConfirmed: boolean,
  currentSceneConfirmed: boolean
): string {
  if (allScenesConfirmed) return 'Continue to Delivering';
  if (currentSceneConfirmed) return 'Scene Confirmed';
  return 'Confirm Scene';
}

/** Determine if the footer should be enabled */
function determineFooterReady(
  allScenesConfirmed: boolean,
  currentSceneConfirmed: boolean,
  isReady: boolean,
  allSectionsPopulated: boolean
): boolean {
  if (allScenesConfirmed) return isReady;
  if (currentSceneConfirmed) return false;
  return allSectionsPopulated;
}

/** Find the next unconfirmed scene index after the given index */
function findNextUnconfirmedScene(
  arcs: Array<{ id: string }>,
  states: Map<string, SceneInscriptionState>,
  afterIndex: number
): number {
  for (let i = afterIndex + 1; i < arcs.length; i++) {
    const state = states.get(arcs[i].id);
    if (!state?.confirmed) return i;
  }
  return -1;
}

/** Create a default empty scene inscription state */
function createEmptySceneState(): SceneInscriptionState {
  return {
    sections: createEmptySections(),
    confirmed: false,
    wave3Invalidated: false,
    invalidationReason: null,
    balanceWarning: null,
  };
}

// =============================================================================
// Component
// =============================================================================

export function InscribingPage({ sessionId, onNavigate }: InscribingPageProps) {
  const navigate = useNavigate();
  const { session: authSession } = useAuth();
  const accessToken = authSession?.access_token ?? '';

  // Chat state
  const messages = useChatStore((s) => s.messages);
  const chatIsStreaming = useChatStore((s) => s.isStreaming);
  const activeMessageId = useChatStore((s) => s.activeMessageId);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const startAssistantMessage = useChatStore((s) => s.startAssistantMessage);
  const appendDelta = useChatStore((s) => s.appendDelta);
  const endAssistantMessage = useChatStore((s) => s.endAssistantMessage);
  const addToolCall = useChatStore((s) => s.addToolCall);
  const completeToolCall = useChatStore((s) => s.completeToolCall);
  const setError = useChatStore((s) => s.setError);

  // Adventure state
  const adventureName = useAdventureStore((s) => s.adventure.adventureName);
  const sceneArcs = useAdventureStore((s) => s.adventure.sceneArcs);

  // Panel state
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [sceneStates, setSceneStates] = useState<Map<string, SceneInscriptionState>>(
    new Map()
  );
  const [panelView, setPanelView] = useState<PanelView>('accordion');
  const [detailSectionId, setDetailSectionId] = useState<InscribingSectionId | null>(
    null
  );
  const [isSectionStreaming, setIsSectionStreaming] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Get or initialize scene state
  const getSceneState = useCallback(
    (sceneArcId: string): SceneInscriptionState => {
      return sceneStates.get(sceneArcId) ?? createEmptySceneState();
    },
    [sceneStates]
  );

  // Update a scene's state
  const updateSceneState = useCallback(
    (sceneArcId: string, updater: (prev: SceneInscriptionState) => SceneInscriptionState) => {
      setSceneStates((prev) => {
        const next = new Map(prev);
        const current = next.get(sceneArcId) ?? createEmptySceneState();
        next.set(sceneArcId, updater(current));
        return next;
      });
    },
    []
  );

  // SSE streaming
  const { sendMessage, requestGreeting, isStreaming: hookIsStreaming } = useSageStream({
    sessionId,
    accessToken,
    onChatStart: (data) => {
      setIsThinking(false);
      startAssistantMessage(data.messageId);
    },
    onChatDelta: (data) => {
      appendDelta(data.messageId, data.content);
    },
    onChatEnd: (data) => {
      endAssistantMessage(data.messageId);
    },
    onToolStart: (data) => {
      addToolCall(activeMessageId ?? '', {
        toolUseId: data.toolUseId,
        toolName: data.toolName,
        input: data.input,
      });
    },
    onToolEnd: (data) => {
      completeToolCall(data.toolUseId, data.isError);
    },
    onPanelSections: (data) => {
      updateSceneState(data.sceneArcId, (prev) => ({
        ...prev,
        sections: replaceWaveSections(prev.sections, data.sections),
      }));
    },
    onPanelSection: (data) => {
      updateSceneState(data.sceneArcId, (prev) => ({
        ...prev,
        sections: updateSectionContent(prev.sections, data.sectionId, data.content),
      }));
      setIsSectionStreaming(data.streaming);
    },
    onPanelWave3Invalidated: (data) => {
      updateSceneState(data.sceneArcId, (prev) => ({
        ...prev,
        wave3Invalidated: true,
        invalidationReason: data.reason,
        // Clear wave 3 section content
        sections: prev.sections.map((s) =>
          s.wave === 3 ? { ...s, content: '' } : s
        ),
      }));
    },
    onPanelBalanceWarning: (data) => {
      updateSceneState(data.sceneArcId, (prev) => ({
        ...prev,
        balanceWarning: data.message,
      }));
    },
    onPanelSceneConfirmed: (data) => {
      updateSceneState(data.sceneArcId, (prev) => ({
        ...prev,
        confirmed: true,
      }));
    },
    onPanelEntityNPCs: (data) => {
      updateSceneState(data.sceneArcId, (prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === 'npcs_present'
            ? { ...s, entityNPCs: data.npcs, content: s.content || `${data.npcs.length} NPC(s)` }
            : s
        ),
      }));
    },
    onPanelEntityAdversaries: (data) => {
      updateSceneState(data.sceneArcId, (prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === 'adversaries'
            ? { ...s, entityAdversaries: data.adversaries, content: s.content || `${data.adversaries.length} adversary(ies)` }
            : s
        ),
      }));
    },
    onPanelEntityItems: (data) => {
      updateSceneState(data.sceneArcId, (prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === 'items'
            ? { ...s, entityItems: data.items, content: s.content || `${data.items.length} item(s)` }
            : s
        ),
      }));
    },
    onPanelEntityPortents: (data) => {
      updateSceneState(data.sceneArcId, (prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === 'portents'
            ? { ...s, entityPortents: data.categories, content: s.content || `${data.categories.length} category(ies)` }
            : s
        ),
      }));
    },
    onUIReady: () => {
      setIsReady(true);
    },
    onError: (data) => {
      setIsThinking(false);
      setError(data.message);
    },
  });

  useSageGreeting(messages.length, requestGreeting, setIsThinking);

  // Send message handler
  const handleSendMessage = useCallback(
    (message: string) => {
      addUserMessage(message);
      setIsThinking(true);
      sendMessage(message);
    },
    [addUserMessage, sendMessage]
  );

  // Tab click handler
  const handleTabClick = useCallback((index: number) => {
    setActiveSceneIndex(index);
    setPanelView('accordion');
    setDetailSectionId(null);
  }, []);

  // Drill-in handler
  const handleDrillIn = useCallback((sectionId: InscribingSectionId) => {
    setDetailSectionId(sectionId);
    setPanelView('detail');
  }, []);

  // Back from detail view
  const handleBackToScene = useCallback(() => {
    setPanelView('accordion');
    setDetailSectionId(null);
  }, []);

  // Confirm scene handler
  const handleConfirmScene = useCallback(async () => {
    const activeArc = sceneArcs[activeSceneIndex];
    if (!activeArc) return;

    updateSceneState(activeArc.id, (prev) => ({
      ...prev,
      confirmed: true,
    }));

    // Advance to next unconfirmed scene
    const nextIndex = findNextUnconfirmedScene(sceneArcs, sceneStates, activeSceneIndex);
    if (nextIndex !== -1) {
      setActiveSceneIndex(nextIndex);
    }

    // Persist confirmation to backend
    try {
      await fetch('/api/scene/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ sessionId, sceneArcId: activeArc.id }),
      });
    } catch {
      // Best-effort; local state is authoritative
    }
  }, [sceneArcs, activeSceneIndex, sceneStates, sessionId, accessToken, updateSceneState]);

  // Advance to Delivering
  const handleAdvance = useCallback(async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}/advance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? 'Failed to advance stage'
        );
      }

      useChatStore.getState().clearMessages();
      useAdventureStore.getState().setStage('delivering');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to advance';
      setError(errorMessage);
    }
  }, [sessionId, accessToken, setError]);

  // Home navigation
  const handleHomeClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Derive panel state from current scene
  const activeArc = sceneArcs[activeSceneIndex];
  const activeSceneId = activeArc?.id ?? '';
  const currentSceneState = getSceneState(activeSceneId);
  const populatedWaves = getPopulatedWaves(currentSceneState.sections);
  const isWave3Dimmed = !areWaves1And2Settled(currentSceneState.sections);
  const allSectionsPopulated = currentSceneState.sections.every(
    (s) => s.content.length > 0
  );
  const allScenesConfirmed = (sceneArcs?.length ?? 0) > 0 &&
    (sceneArcs ?? []).every((arc) => {
      const state = sceneStates.get(arc.id);
      return state?.confirmed ?? false;
    });

  const footerLabel = determineFooterLabel(allScenesConfirmed, currentSceneState.confirmed);
  const footerReady = determineFooterReady(
    allScenesConfirmed,
    currentSceneState.confirmed,
    isReady,
    allSectionsPopulated
  );
  const footerAction = allScenesConfirmed ? handleAdvance : handleConfirmScene;

  // Build scene arc data for tabs (with inscribing-level confirmed state)
  const sceneArcTabData: SceneArcData[] = (sceneArcs ?? []).map((arc) => ({
    id: arc.id,
    sceneNumber: arc.sceneNumber,
    title: arc.title,
    description: arc.description,
    confirmed: sceneStates.get(arc.id)?.confirmed ?? false,
  }));

  return (
    <AppShell
      adventureName={adventureName}
      onHomeClick={handleHomeClick}
      chatSlot={
        <ChatPanel
          messages={messages}
          isStreaming={chatIsStreaming || hookIsStreaming}
          isThinking={isThinking}
          onSendMessage={handleSendMessage}
          inputPlaceholder="Draft scene content, request changes, or confirm when ready..."
        />
      }
      panelSlot={
        <InscribingPanel
          sceneArcs={sceneArcTabData}
          activeSceneIndex={activeSceneIndex}
          panelView={panelView}
          detailSectionId={detailSectionId}
          sceneState={currentSceneState}
          populatedWaves={populatedWaves}
          isWave3Dimmed={isWave3Dimmed}
          isSectionStreaming={isSectionStreaming}
          sceneTitle={activeArc?.title ?? ''}
          footerLabel={footerLabel}
          footerReady={footerReady}
          onTabClick={handleTabClick}
          onDrillIn={handleDrillIn}
          onBackToScene={handleBackToScene}
          onFooterAction={footerAction}
          onNavigate={onNavigate}
        />
      }
    />
  );
}
