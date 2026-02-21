/**
 * AttuningPage — Second stage of the Sage Codex Unfolding
 *
 * Renders the 65/35 layout with:
 * - Left: ChatPanel for conversational component tuning
 * - Right: ComponentSummary / ComponentChoice panels (cross-fade)
 *
 * The panel toggles between summary and choice views when a user
 * clicks a component row. Cross-fade transitions provide continuity.
 *
 * Handles SSE streaming via useSageStream hook and dispatches events
 * to the chatStore, adventureStore, and local component state.
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
import { ComponentSummary } from '@/components/panels/ComponentSummary';
import { ComponentChoice } from '@/components/panels/ComponentChoice';
import type {
  ComponentId,
  PanelComponentEvent,
  SerializableComponentsState,
} from '@sage-codex/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface AttuningPageProps {
  /** The active session ID */
  sessionId: string;
  /** Called when the user navigates to a completed stage via StageDropdown */
  onNavigate?: (stage: import('@sage-codex/shared-types').Stage) => void;
}

type PanelView = 'summary' | 'choice';

// =============================================================================
// Component
// =============================================================================

export function AttuningPage({ sessionId, onNavigate }: AttuningPageProps) {
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
  const components = useAdventureStore((s) => s.adventure.components);
  const setComponents = useAdventureStore((s) => s.setComponents);
  const adventureName = useAdventureStore((s) => s.adventure.adventureName);

  // Panel view state
  const [panelView, setPanelView] = useState<PanelView>('summary');
  const [activeComponentId, setActiveComponentId] = useState<ComponentId | null>(null);
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
    onPanelComponent: (data) => {
      applyComponentUpdate(data);
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

  /** Apply a component update from the set_component tool */
  const applyComponentUpdate = useCallback(
    (data: PanelComponentEvent['data']) => {
      const componentId = data.componentId as ComponentId;
      const updated: SerializableComponentsState = { ...components };

      applyValueToComponents(updated, componentId, data.value);

      if (data.confirmed) {
        const confirmed = new Set(updated.confirmedComponents);
        confirmed.add(componentId);
        updated.confirmedComponents = [...confirmed];
      }

      setComponents(updated);
    },
    [components, setComponents]
  );

  // Send message handler
  const handleSendMessage = useCallback(
    (message: string) => {
      addUserMessage(message);
      setIsThinking(true);
      sendMessage(message);
    },
    [addUserMessage, sendMessage]
  );

  // Panel navigation
  const handleSelectComponent = useCallback((componentId: ComponentId) => {
    setActiveComponentId(componentId);
    setPanelView('choice');
  }, []);

  const handleBackToSummary = useCallback(() => {
    setPanelView('summary');
    setActiveComponentId(null);
  }, []);

  /** Confirm a component selection from the choice panel */
  const handleConfirmComponent = useCallback(
    async (componentId: ComponentId, value: string | number | string[]) => {
      // Optimistic local update
      const updated: SerializableComponentsState = { ...components };
      applyValueToComponents(updated, componentId, value);

      const confirmed = new Set(updated.confirmedComponents);
      confirmed.add(componentId);
      updated.confirmedComponents = [...confirmed];
      setComponents(updated);

      // Return to summary
      setPanelView('summary');
      setActiveComponentId(null);

      // Persist to backend
      try {
        await persistComponentSelection(sessionId, accessToken, componentId, value);
      } catch {
        // Best-effort persistence; local state is authoritative
      }
    },
    [components, setComponents, sessionId, accessToken]
  );

  // Advance to Binding
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

      useChatStore.getState().clearMessages();
      useAdventureStore.getState().setStage('binding');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to advance';
      setError(errorMessage);
    }
  }, [isReady, sessionId, accessToken, setError]);

  // Home navigation
  const handleHomeClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Check if all 8 are confirmed
  const allConfirmed = (components?.confirmedComponents?.length ?? 0) >= 8;

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
        <AttuningPanel
          panelView={panelView}
          activeComponentId={activeComponentId}
          components={components}
          isReady={isReady && allConfirmed}
          onSelectComponent={handleSelectComponent}
          onConfirmComponent={handleConfirmComponent}
          onBack={handleBackToSummary}
          onAdvance={handleAdvance}
          onNavigate={onNavigate}
        />
      }
    />
  );
}

// =============================================================================
// Panel Router (cross-fade between summary and choice)
// =============================================================================

interface AttuningPanelProps {
  panelView: PanelView;
  activeComponentId: ComponentId | null;
  components: SerializableComponentsState;
  isReady: boolean;
  onSelectComponent: (componentId: ComponentId) => void;
  onConfirmComponent: (componentId: ComponentId, value: string | number | string[]) => void;
  onBack: () => void;
  onAdvance: () => void;
  onNavigate?: (stage: import('@sage-codex/shared-types').Stage) => void;
}

function AttuningPanel({
  panelView,
  activeComponentId,
  components,
  isReady,
  onSelectComponent,
  onConfirmComponent,
  onBack,
  onAdvance,
  onNavigate,
}: AttuningPanelProps) {
  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Panel header with stage dropdown */}
      <div
        className="flex-shrink-0 flex items-center gap-3"
        style={{ padding: '12px var(--panel-padding) 4px' }}
      >
        <StageDropdown currentStage="attuning" onNavigate={onNavigate} />
      </div>

      {/* Content area */}
      {panelView === 'choice' && activeComponentId ? (
        <ComponentChoice
          componentId={activeComponentId}
          currentValue={getComponentValue(components, activeComponentId)}
          onConfirm={onConfirmComponent}
          onBack={onBack}
        />
      ) : (
        <ComponentSummary
          components={components}
          onSelectComponent={onSelectComponent}
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

/** Get the current value for a component from serializable state */
function getComponentValue(
  components: SerializableComponentsState,
  componentId: ComponentId
): string | number | string[] | null {
  if (componentId === 'threads') {
    return components.threads;
  }
  return components[componentId];
}

/** Apply a value to the appropriate field in components state */
function applyValueToComponents(
  components: SerializableComponentsState,
  componentId: ComponentId,
  value: string | number | string[]
): void {
  switch (componentId) {
    case 'threads':
      components.threads = value as string[];
      break;
    case 'span':
      components.span = value as string;
      break;
    case 'scenes':
      components.scenes = value as number;
      break;
    case 'members':
      components.members = value as number;
      break;
    case 'tier':
      components.tier = value as number;
      break;
    case 'tenor':
      components.tenor = value as string;
      break;
    case 'pillars':
      components.pillars = value as string;
      break;
    case 'chorus':
      components.chorus = value as string;
      break;
  }
}

/** Persist a component selection to the backend */
async function persistComponentSelection(
  sessionId: string,
  accessToken: string,
  componentId: ComponentId,
  value: string | number | string[]
): Promise<void> {
  await fetch('/api/component/select', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      sessionId,
      componentId,
      value,
      confirmed: true,
    }),
  });
}
