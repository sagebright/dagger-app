/**
 * WeavingPage -- Fourth stage of the Sage Codex Unfolding
 *
 * Renders the 65/35 layout with:
 * - Left: ChatPanel for conversational scene arc refinement
 * - Right: SceneTabs + SceneArc + AdventureNameBanner + StageFooter
 *
 * Sequential flow: Scene 1 active first. Each confirmation locks
 * the scene and advances to the next. Final scene requires an
 * approved adventure name before advancing to Inscribing.
 *
 * Handles SSE streaming via useSageStream hook and dispatches
 * panel:scene_arcs, panel:scene_arc, and panel:name events.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSageStream } from '@/hooks/useSageStream';
import { useChatStore } from '@/stores/chatStore';
import { useAdventureStore } from '@/stores/adventureStore';
import { AppShell } from '@/components/layout/AppShell';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { StageDropdown } from '@/components/layout/StageDropdown';
import { SceneTabs } from '@/components/panels/SceneTabs';
import { SceneArc } from '@/components/panels/SceneArc';
import { AdventureNameBanner } from '@/components/panels/AdventureNameBanner';
import { StageFooter } from '@/components/layout/StageFooter';
import type { SceneArcData } from '@sage-codex/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface WeavingPageProps {
  /** The active session ID */
  sessionId: string;
}

// =============================================================================
// Component
// =============================================================================

export function WeavingPage({ sessionId }: WeavingPageProps) {
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
  const setSceneArcs = useAdventureStore((s) => s.setSceneArcs);
  const setAdventureName = useAdventureStore((s) => s.setAdventureName);

  // Panel state
  const [sceneArcs, setLocalSceneArcs] = useState<SceneArcData[]>([]);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const [isNameApproved, setIsNameApproved] = useState(false);
  const [isArcStreaming, setIsArcStreaming] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

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
    onPanelSceneArcs: (data) => {
      setLocalSceneArcs(data.sceneArcs);
      setActiveSceneIndex(data.activeSceneIndex);
      // Sync to adventure store
      syncSceneArcsToStore(data.sceneArcs, setSceneArcs);
    },
    onPanelSceneArc: (data) => {
      setLocalSceneArcs((prev) => updateSceneAtIndex(prev, data.sceneIndex, data.sceneArc));
      setIsArcStreaming(data.streaming);
    },
    onPanelName: (data) => {
      setSuggestedName(data.name);
    },
    onUIReady: () => {
      setIsReady(true);
    },
    onError: (data) => {
      setIsThinking(false);
      setError(data.message);
    },
  });

  // Request Sage greeting on mount (if no messages yet)
  const hasGreeted = useRef(false);
  useEffect(() => {
    if (messages.length === 0 && !hasGreeted.current) {
      hasGreeted.current = true;
      setIsThinking(true);
      requestGreeting();
    }
  }, [messages.length, requestGreeting]);

  // Send message handler
  const handleSendMessage = useCallback(
    (message: string) => {
      addUserMessage(message);
      setIsThinking(true);
      sendMessage(message);
    },
    [addUserMessage, sendMessage]
  );

  // Tab click handler (review confirmed scenes)
  const handleTabClick = useCallback((index: number) => {
    setActiveSceneIndex(index);
  }, []);

  // Confirm scene handler
  const handleConfirmScene = useCallback(async () => {
    const currentArc = sceneArcs[activeSceneIndex];
    if (!currentArc) return;

    // Update local state
    const updatedArcs = sceneArcs.map((arc, i) =>
      i === activeSceneIndex ? { ...arc, confirmed: true } : arc
    );
    setLocalSceneArcs(updatedArcs);

    // Advance to next scene if available
    const nextUnconfirmedIndex = findNextUnconfirmedIndex(updatedArcs, activeSceneIndex);
    if (nextUnconfirmedIndex !== -1) {
      setActiveSceneIndex(nextUnconfirmedIndex);
    }

    // Persist to backend (best effort)
    try {
      await persistSceneConfirmation(sessionId, accessToken, currentArc.id);
    } catch {
      // Best-effort persistence; local state is authoritative
    }
  }, [sceneArcs, activeSceneIndex, sessionId, accessToken]);

  // Approve adventure name
  const handleApproveName = useCallback(
    (name: string) => {
      setIsNameApproved(true);
      setSuggestedName(name);
      setAdventureName(name);
    },
    [setAdventureName]
  );

  // Advance to Inscribing
  const handleAdvance = useCallback(async () => {
    if (!canAdvance(sceneArcs, isNameApproved)) return;

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
      useAdventureStore.getState().setStage('inscribing');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to advance';
      setError(errorMessage);
    }
  }, [sceneArcs, isNameApproved, sessionId, accessToken, setError]);

  // Home navigation
  const handleHomeClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Determine footer label and readiness
  const allConfirmed = sceneArcs.length > 0 && sceneArcs.every((a) => a.confirmed);
  const isLastScene = activeSceneIndex === sceneArcs.length - 1;
  const currentSceneConfirmed = sceneArcs[activeSceneIndex]?.confirmed ?? false;
  const footerLabel = determineFooterLabel(isLastScene, allConfirmed);
  const footerReady = determineFooterReady(
    isLastScene,
    allConfirmed,
    isNameApproved,
    isReady,
    currentSceneConfirmed
  );

  const footerAction = allConfirmed ? handleAdvance : handleConfirmScene;

  return (
    <AppShell
      adventureName={adventureName ?? suggestedName}
      onHomeClick={handleHomeClick}
      chatSlot={
        <ChatPanel
          messages={messages}
          isStreaming={chatIsStreaming || hookIsStreaming}
          isThinking={isThinking}
          onSendMessage={handleSendMessage}
          inputPlaceholder="Adjust the scene arc, request changes, or confirm when ready..."
        />
      }
      panelSlot={
        <WeavingPanel
          sceneArcs={sceneArcs}
          activeSceneIndex={activeSceneIndex}
          suggestedName={suggestedName}
          isNameApproved={isNameApproved}
          isArcStreaming={isArcStreaming}
          footerLabel={footerLabel}
          footerReady={footerReady}
          onTabClick={handleTabClick}
          onApproveName={handleApproveName}
          onFooterAction={footerAction}
        />
      }
    />
  );
}

// =============================================================================
// Panel Component
// =============================================================================

interface WeavingPanelProps {
  sceneArcs: SceneArcData[];
  activeSceneIndex: number;
  suggestedName: string | null;
  isNameApproved: boolean;
  isArcStreaming: boolean;
  footerLabel: string;
  footerReady: boolean;
  onTabClick: (index: number) => void;
  onApproveName: (name: string) => void;
  onFooterAction: () => void;
}

function WeavingPanel({
  sceneArcs,
  activeSceneIndex,
  suggestedName,
  isNameApproved,
  isArcStreaming,
  footerLabel,
  footerReady,
  onTabClick,
  onApproveName,
  onFooterAction,
}: WeavingPanelProps) {
  const activeArc = sceneArcs[activeSceneIndex] ?? null;

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Panel header with stage dropdown */}
      <div
        className="flex-shrink-0 flex items-center gap-3"
        style={{ padding: '12px var(--panel-padding) 4px' }}
      >
        <StageDropdown currentStage="weaving" />
      </div>

      {/* Scene tabs */}
      {sceneArcs.length > 0 && (
        <SceneTabs
          sceneArcs={sceneArcs}
          activeSceneIndex={activeSceneIndex}
          onTabClick={onTabClick}
        />
      )}

      {/* Adventure name banner */}
      <AdventureNameBanner
        suggestedName={suggestedName}
        isApproved={isNameApproved}
        onApproveName={onApproveName}
      />

      {/* Scene arc content */}
      <SceneArc sceneArc={activeArc} isStreaming={isArcStreaming} />

      {/* Fixed footer */}
      <StageFooter
        label={footerLabel}
        isReady={footerReady}
        onAdvance={onFooterAction}
      />
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

/** Sync local scene arc data to the adventure store */
function syncSceneArcsToStore(
  arcs: SceneArcData[],
  setSceneArcs: (arcs: import('@sage-codex/shared-types').SceneArc[]) => void
): void {
  const storeArcs = arcs.map((arc) => ({
    id: arc.id,
    sceneNumber: arc.sceneNumber,
    title: arc.title,
    description: arc.description,
    keyElements: [],
    location: '',
    sceneType: 'mixed' as const,
  }));
  setSceneArcs(storeArcs);
}

/** Update a scene arc at a specific index */
function updateSceneAtIndex(
  arcs: SceneArcData[],
  index: number,
  updatedArc: SceneArcData
): SceneArcData[] {
  return arcs.map((arc, i) => (i === index ? updatedArc : arc));
}

/** Find the next unconfirmed scene index after the given index */
function findNextUnconfirmedIndex(arcs: SceneArcData[], afterIndex: number): number {
  for (let i = afterIndex + 1; i < arcs.length; i++) {
    if (!arcs[i].confirmed) return i;
  }
  return -1;
}

/** Determine the footer button label */
function determineFooterLabel(isLastScene: boolean, allConfirmed: boolean): string {
  if (allConfirmed) return 'Continue to Inscribing';
  if (isLastScene) return 'Confirm Final Scene';
  return 'Confirm Scene Summary';
}

/** Determine whether the footer button should be enabled */
function determineFooterReady(
  isLastScene: boolean,
  allConfirmed: boolean,
  isNameApproved: boolean,
  isReady: boolean,
  currentSceneConfirmed: boolean
): boolean {
  if (allConfirmed) {
    // Final advance requires name approval
    return isNameApproved && isReady;
  }
  // Don't allow confirming an already-confirmed scene
  if (currentSceneConfirmed) return false;
  // Last scene requires name to be approved
  if (isLastScene) return isNameApproved;
  return true;
}

/** Check if the user can advance to Inscribing */
function canAdvance(arcs: SceneArcData[], isNameApproved: boolean): boolean {
  return arcs.length > 0 && arcs.every((a) => a.confirmed) && isNameApproved;
}

/** Persist a scene confirmation to the backend */
async function persistSceneConfirmation(
  sessionId: string,
  accessToken: string,
  sceneArcId: string
): Promise<void> {
  await fetch('/api/scene/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ sessionId, sceneArcId }),
  });
}
