/**
 * InvokingPage — First stage of the Sage Codex Unfolding
 *
 * Renders the 65/35 layout with:
 * - Left: ChatPanel for conversational vision sharing
 * - Right: SparkPanel showing the distilled adventure spark
 *
 * Handles SSE streaming via useSageStream hook and dispatches events
 * to the chatStore and adventureStore.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSageStream } from '@/hooks/useSageStream';
import { useChatStore } from '@/stores/chatStore';
import { useAdventureStore } from '@/stores/adventureStore';
import { AppShell } from '@/components/layout/AppShell';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { SparkPanel } from '@/components/panels/SparkPanel';
import type { AdventureSpark } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface InvokingPageProps {
  /** The active session ID */
  sessionId: string;
}

// =============================================================================
// Component
// =============================================================================

export function InvokingPage({ sessionId }: InvokingPageProps) {
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
  const spark = useAdventureStore((s) => s.adventure.spark);
  const setSpark = useAdventureStore((s) => s.setSpark);
  const adventureName = useAdventureStore((s) => s.adventure.adventureName);

  // Stage readiness
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
    onPanelSpark: (data) => {
      const sparkData: AdventureSpark = {
        name: data.name,
        vision: data.vision,
      };
      setSpark(sparkData);
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

  // Advance to Attuning
  const handleAdvance = useCallback(async () => {
    if (!isReady) return;

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

      // Navigate to the next stage (Attuning) — placeholder for now
      useAdventureStore.getState().setStage('attuning');
      navigate('/adventure');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to advance';
      setError(errorMessage);
    }
  }, [isReady, sessionId, accessToken, navigate, setError]);

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
        <SparkPanel
          spark={spark}
          isReady={isReady}
          onAdvance={handleAdvance}
        />
      }
    />
  );
}
