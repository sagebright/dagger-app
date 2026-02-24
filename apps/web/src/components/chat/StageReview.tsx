/**
 * StageReview -- Read-only view of a past stage's chat history
 *
 * Fetches messages for a completed stage via the session messages API
 * and renders them in a read-only ChatPanel. A "Return to [current stage]"
 * button at the top lets the user navigate back to the active stage.
 *
 * When a `panelSlot` is provided, renders via AppShell with the 65/35
 * layout (chat on left, panel on right). When no panelSlot is given,
 * falls back to full-width chat-only layout (e.g., Invoking has no panel).
 *
 * Used by AdventurePage when `viewingStage` is set.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { ChatPanel } from './ChatPanel';
import { STAGES } from '@sage-codex/shared-types';
import type { Stage } from '@sage-codex/shared-types';
import type { ChatMessage } from '@/stores/chatStore';

// =============================================================================
// Types
// =============================================================================

export interface StageReviewProps {
  /** The active session ID */
  sessionId: string;
  /** The past stage to review */
  stage: Stage;
  /** The current active stage (for the return button label) */
  currentStage: Stage;
  /** Called when the user clicks "Return to [current stage]" */
  onReturn: () => void;
  /** Optional right-side panel content for 65/35 layout */
  panelSlot?: ReactNode;
  /** Adventure name for the AppShell header */
  adventureName?: string | null;
  /** Called when the home button is clicked */
  onHomeClick?: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

/** Look up the human-readable label for a stage */
function getStageName(stage: Stage): string {
  return STAGES.find((s) => s.id === stage)?.label ?? stage;
}

/** Convert API messages to ChatMessage format for the ChatPanel */
function toDisplayMessages(
  apiMessages: ApiMessage[]
): ChatMessage[] {
  return apiMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: msg.created_at,
    isStreaming: false,
    toolCalls: [],
  }));
}

// =============================================================================
// API Types
// =============================================================================

interface ApiMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  stage: string;
  metadata: unknown;
  created_at: string;
}

interface MessagesResponse {
  messages: ApiMessage[];
}

// =============================================================================
// Component
// =============================================================================

export function StageReview({
  sessionId,
  stage,
  currentStage,
  onReturn,
  panelSlot,
  adventureName,
  onHomeClick,
}: StageReviewProps) {
  const { session: authSession } = useAuth();
  const accessToken = authSession?.access_token ?? '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stageLabel = getStageName(stage);
  const currentStageLabel = getStageName(currentStage);

  /** Fetch messages for the reviewed stage */
  const fetchStageMessages = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/session/${sessionId}/messages?stage=${stage}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? 'Failed to load messages'
        );
      }

      const data = (await response.json()) as MessagesResponse;
      setMessages(toDisplayMessages(data.messages));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load stage messages';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, stage, accessToken]);

  useEffect(() => {
    fetchStageMessages();
  }, [fetchStageMessages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="sage-speaking">
          <span className="sage-label">Loading {stageLabel}...</span>
          <div className="thinking-dots">
            <div className="thinking-dot" />
            <div className="thinking-dot" />
            <div className="thinking-dot" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p style={{ color: '#db7e7e' }}>{error}</p>
        <button
          className="footer-button"
          style={{ width: 'auto', padding: '8px 24px' }}
          onClick={onReturn}
          type="button"
        >
          Return to {currentStageLabel}
        </button>
      </div>
    );
  }

  // Build the chat column content (ReturnBanner + read-only ChatPanel)
  const chatContent = (
    <div className="flex flex-col h-full">
      <ReturnBanner
        currentStageLabel={currentStageLabel}
        stageLabel={stageLabel}
        onReturn={onReturn}
      />
      <div className="flex-1 min-h-0">
        <ChatPanel
          messages={messages}
          isStreaming={false}
          isThinking={false}
          onSendMessage={() => {}}
          isReadOnly
          readOnlyStageLabel={stageLabel}
        />
      </div>
    </div>
  );

  // When panelSlot is provided, use AppShell for 65/35 layout
  if (panelSlot) {
    return (
      <AppShell
        chatSlot={chatContent}
        panelSlot={panelSlot}
        adventureName={adventureName}
        onHomeClick={onHomeClick}
      />
    );
  }

  // No panel: full-width chat-only layout (e.g., Invoking)
  return chatContent;
}

// =============================================================================
// Sub-components
// =============================================================================

interface ReturnBannerProps {
  currentStageLabel: string;
  stageLabel: string;
  onReturn: () => void;
}

function ReturnBanner({
  currentStageLabel,
  stageLabel,
  onReturn,
}: ReturnBannerProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2 flex-shrink-0"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <span
        className="text-[13px] font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        Reviewing: {stageLabel}
      </span>
      <button
        className="text-[13px] font-medium px-3 py-1 rounded transition-colors"
        style={{
          color: 'var(--accent-gold)',
          background: 'transparent',
          border: '1px solid var(--accent-gold)',
        }}
        onClick={onReturn}
        type="button"
      >
        Return to {currentStageLabel}
      </button>
    </div>
  );
}
