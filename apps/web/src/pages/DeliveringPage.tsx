/**
 * DeliveringPage -- Sixth and final stage of the Sage Codex Unfolding
 *
 * Renders the 65/35 layout with:
 * - Left: ChatPanel for final Sage conversation and send-off
 * - Right: CelebrationPanel (adventure summary + download button)
 *
 * The Sage delivers the completed adventure. The user sees what was
 * created and downloads a ZIP file with Markdown + PDF.
 *
 * Handles SSE streaming via useSageStream hook. The finalize_adventure
 * tool marks the session as completed on the server.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSageStream } from '@/hooks/useSageStream';
import { useChatStore } from '@/stores/chatStore';
import { useAdventureStore } from '@/stores/adventureStore';
import { AppShell } from '@/components/layout/AppShell';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { CelebrationPanel } from '@/components/panels/CelebrationPanel';
import { generateAdventureMarkdown } from '@/services/export-markdown';
import { buildAdventureZip } from '@/services/export-zip';

// =============================================================================
// Types
// =============================================================================

export interface DeliveringPageProps {
  /** The active session ID */
  sessionId: string;
}

// =============================================================================
// Component
// =============================================================================

export function DeliveringPage({ sessionId }: DeliveringPageProps) {
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
  const adventure = useAdventureStore((s) => s.adventure);

  // Local state
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // SSE streaming
  const { sendMessage, isStreaming: hookIsStreaming } = useSageStream({
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
    onUIReady: () => {
      setIsReady(true);
    },
    onError: (data) => {
      setIsThinking(false);
      setError(data.message);
    },
  });

  // Send message handler
  const handleSendMessage = useCallback(
    (message: string) => {
      addUserMessage(message);
      setIsThinking(true);
      sendMessage(message);
    },
    [addUserMessage, sendMessage]
  );

  // Download handler: generate Markdown, build ZIP, trigger browser download
  const handleDownload = useCallback(async () => {
    setIsDownloading(true);

    try {
      const markdown = generateAdventureMarkdown(adventure);
      const zipBlob = await buildAdventureZip(adventure.adventureName, markdown);
      triggerBlobDownload(zipBlob, buildZipFilename(adventure.adventureName));

      // Mark session as completed on the server (best effort)
      await markSessionCompleted(sessionId, accessToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      setError(message);
    } finally {
      setIsDownloading(false);
    }
  }, [adventure, sessionId, accessToken, setError]);

  // Home navigation
  const handleHomeClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <AppShell
      adventureName={adventure.adventureName}
      onHomeClick={handleHomeClick}
      chatSlot={
        <ChatPanel
          messages={messages}
          isStreaming={chatIsStreaming || hookIsStreaming}
          isThinking={isThinking}
          onSendMessage={handleSendMessage}
          inputPlaceholder="Ask the Sage for final advice, or download your adventure..."
        />
      }
      panelSlot={
        <CelebrationPanel
          adventureName={adventure.adventureName}
          spark={adventure.spark}
          frame={adventure.frame}
          sceneArcs={adventure.sceneArcs}
          isReady={isReady || hasCompletedAdventure(adventure)}
          isDownloading={isDownloading}
          onDownload={handleDownload}
        />
      }
    />
  );
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if the adventure has enough content to be considered complete.
 *
 * A complete adventure has: a name, a spark, a frame, and at least one scene arc.
 */
function hasCompletedAdventure(adventure: {
  adventureName: string | null;
  spark: unknown;
  frame: unknown;
  sceneArcs: unknown[];
}): boolean {
  return (
    adventure.adventureName !== null &&
    adventure.spark !== null &&
    adventure.frame !== null &&
    adventure.sceneArcs.length > 0
  );
}

/**
 * Build a safe filename for the ZIP download.
 */
function buildZipFilename(adventureName: string | null): string {
  const safeName = (adventureName ?? 'adventure')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${safeName}.zip`;
}

/**
 * Trigger a browser download of a Blob.
 */
function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Mark the session as completed on the server.
 *
 * This is a best-effort call; the local download is the primary deliverable.
 */
async function markSessionCompleted(
  sessionId: string,
  accessToken: string
): Promise<void> {
  try {
    await fetch(`/api/session/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    // Best-effort; download succeeded regardless
  }
}
