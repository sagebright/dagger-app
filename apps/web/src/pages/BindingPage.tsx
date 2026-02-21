/**
 * BindingPage -- Third stage of the Sage Codex Unfolding
 *
 * Renders the 65/35 layout with:
 * - Left: ChatPanel for conversational frame exploration
 * - Right: FrameGallery / FrameDetail panels (cross-fade between views)
 *
 * The panel toggles between gallery and detail views when a user
 * clicks a frame card. The StageDropdown provides 6-stage navigation.
 *
 * Handles SSE streaming via useSageStream hook and dispatches frame
 * gallery events to the local panel state.
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
import { FrameGallery } from '@/components/panels/FrameGallery';
import { FrameDetail } from '@/components/panels/FrameDetail';
import type { FrameCardData, BoundFrame } from '@sage-codex/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface BindingPageProps {
  /** The active session ID */
  sessionId: string;
}

type PanelView = 'gallery' | 'detail';

// =============================================================================
// Component
// =============================================================================

export function BindingPage({ sessionId }: BindingPageProps) {
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
  const setFrame = useAdventureStore((s) => s.setFrame);

  // Panel state
  const [panelView, setPanelView] = useState<PanelView>('gallery');
  const [frames, setFrames] = useState<FrameCardData[]>([]);
  const [exploringFrameId, setExploringFrameId] = useState<string | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
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
    onPanelFrames: (data) => {
      setFrames(data.frames);
      if (data.activeFrameId) {
        setActiveFrameId(data.activeFrameId);
      }
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
      requestGreeting().finally(() => setIsThinking(false));
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

  // Frame exploration -- open detail view
  const handleExploreFrame = useCallback((frameId: string) => {
    setExploringFrameId(frameId);
    setPanelView('detail');
  }, []);

  // Back to gallery -- no frame selection
  const handleBackToGallery = useCallback(() => {
    setExploringFrameId(null);
    setPanelView('gallery');
  }, []);

  // Select frame -- confirm and return to gallery
  const handleSelectFrame = useCallback(
    async (frameId: string) => {
      setActiveFrameId(frameId);
      setExploringFrameId(null);
      setPanelView('gallery');

      // Find the full frame data for the adventure store
      const selectedFrame = frames.find((f) => f.id === frameId);
      if (selectedFrame) {
        const boundFrame: BoundFrame = {
          id: selectedFrame.id,
          name: selectedFrame.name,
          description: selectedFrame.pitch,
          themes: selectedFrame.themes,
          typicalAdversaries: [],
          lore: '',
          isCustom: false,
        };
        setFrame(boundFrame);
      }

      // Persist selection to the backend
      try {
        await persistFrameSelection(sessionId, accessToken, frameId);
      } catch {
        // Best-effort persistence; local state is authoritative
      }
    },
    [frames, setFrame, sessionId, accessToken]
  );

  // Advance to Weaving
  const handleAdvance = useCallback(async () => {
    if (!isReady || !activeFrameId) return;

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
      useAdventureStore.getState().setStage('weaving');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to advance';
      setError(errorMessage);
    }
  }, [isReady, activeFrameId, sessionId, accessToken, setError]);

  // Home navigation
  const handleHomeClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

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
          inputPlaceholder="What path shall we take?"
        />
      }
      panelSlot={
        <BindingPanel
          panelView={panelView}
          frames={frames}
          exploringFrameId={exploringFrameId}
          activeFrameId={activeFrameId}
          isReady={isReady && activeFrameId !== null}
          onExploreFrame={handleExploreFrame}
          onBackToGallery={handleBackToGallery}
          onSelectFrame={handleSelectFrame}
          onAdvance={handleAdvance}
          currentStage="binding"
        />
      }
    />
  );
}

// =============================================================================
// Panel Router (cross-fade between gallery and detail)
// =============================================================================

interface BindingPanelProps {
  panelView: PanelView;
  frames: FrameCardData[];
  exploringFrameId: string | null;
  activeFrameId: string | null;
  isReady: boolean;
  onExploreFrame: (frameId: string) => void;
  onBackToGallery: () => void;
  onSelectFrame: (frameId: string) => void;
  onAdvance: () => void;
  currentStage: 'binding';
}

function BindingPanel({
  panelView,
  frames,
  exploringFrameId,
  activeFrameId,
  isReady,
  onExploreFrame,
  onBackToGallery,
  onSelectFrame,
  onAdvance,
  currentStage,
}: BindingPanelProps) {
  const exploringFrame = frames.find((f) => f.id === exploringFrameId);

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Panel header with stage dropdown */}
      <div
        className="flex-shrink-0 flex items-center gap-3"
        style={{ padding: '12px var(--panel-padding) 4px' }}
      >
        <StageDropdown currentStage={currentStage} />
      </div>

      {/* Content area -- gallery or detail */}
      {panelView === 'detail' && exploringFrame ? (
        <FrameDetail
          frame={exploringFrame}
          onBack={onBackToGallery}
          onSelectFrame={onSelectFrame}
        />
      ) : (
        <FrameGallery
          frames={frames}
          exploringFrameId={exploringFrameId}
          activeFrameId={activeFrameId}
          onExploreFrame={onExploreFrame}
          onAdvance={onAdvance}
          isReady={isReady}
        />
      )}
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

/** Persist the frame selection to the backend */
async function persistFrameSelection(
  sessionId: string,
  accessToken: string,
  frameId: string
): Promise<void> {
  await fetch('/api/frame/select', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ sessionId, frameId }),
  });
}
