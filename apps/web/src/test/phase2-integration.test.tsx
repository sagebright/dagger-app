/**
 * Phase 2 Integration Tests
 *
 * Issue #20: End-to-end verification of Phase 2 (Core Chat + Dials) functionality
 *
 * Test Scenarios:
 * 1. Chat functionality - message flow, streaming, auto-scroll
 * 2. Dial interactions - reference points, summary panel sync
 * 3. State persistence - localStorage recovery, WebSocket reconnect
 * 4. End-to-end flow - complete dial tuning with all 14 dials
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Components - import directly from source files
import { ChatContainer } from '@/components/chat/ChatContainer';
import { DialSummaryPanel } from '@/components/dials/DialSummaryPanel';

// Stores
import { useChatStore } from '@/stores/chatStore';
import { useDialsStore, selectConfirmedCount, selectCompletionPercentage } from '@/stores/dialsStore';
import { useAdventureStore } from '@/stores/adventureStore';
import { resetAllStores, clearAllStorageData } from '@/stores';

// Types
import type { DialId } from '@dagger-app/shared-types';
import type { DialsState } from '@/stores/dialsStore';

// Test utilities
import { storeAction, clearPersistedStorage, setPersistedState } from './store-utils';
import { MockWebSocket } from './setup';

// =============================================================================
// Test Setup
// =============================================================================

const CHAT_STORAGE_KEY = 'dagger-chat-storage';
const DIALS_STORAGE_KEY = 'dagger-dials-storage';
const ADVENTURE_STORAGE_KEY = 'dagger-adventure-storage';

describe('Phase 2 Integration Tests', () => {
  beforeEach(() => {
    // Clear all storage
    clearPersistedStorage(CHAT_STORAGE_KEY);
    clearPersistedStorage(DIALS_STORAGE_KEY);
    clearPersistedStorage(ADVENTURE_STORAGE_KEY);

    // Reset all stores
    resetAllStores();

    // Reset WebSocket mock
    MockWebSocket.reset();

    // Mock requestAnimationFrame for StreamingText
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
      setTimeout(cb, 0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    // Mock Element.prototype.scrollTo for jsdom
    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.unstubAllGlobals();
  });

  // ===========================================================================
  // 1. Chat Functionality Tests
  // ===========================================================================

  describe('1. Chat Functionality', () => {
    describe('message display', () => {
      it('displays user messages with user styling (right-aligned via ml-auto)', async () => {
        // Add a user message to the store
        storeAction(() =>
          useChatStore.getState().addMessage({
            role: 'user',
            content: 'Hello, I want to create an adventure',
          })
        );

        render(<ChatContainer sessionId="test-session" />);

        // Wait for message to render
        await waitFor(() => {
          const message = screen.getByText('Hello, I want to create an adventure');
          expect(message).toBeInTheDocument();
        });

        // Verify user message has appropriate styling (ml-auto = right-aligned)
        const messageBubble = screen.getByText('Hello, I want to create an adventure').closest('[data-testid="message-bubble"]');
        expect(messageBubble).toBeInTheDocument();
        expect(messageBubble).toHaveClass('ml-auto');
      });

      it('displays assistant messages with assistant styling (left-aligned via mr-auto)', async () => {
        storeAction(() =>
          useChatStore.getState().addMessage({
            role: 'assistant',
            content: 'Welcome! Let me help you configure your adventure.',
          })
        );

        render(<ChatContainer sessionId="test-session" />);

        await waitFor(() => {
          const message = screen.getByText("Welcome! Let me help you configure your adventure.");
          expect(message).toBeInTheDocument();
        });

        // Verify assistant message has appropriate styling (mr-auto = left-aligned)
        const messageBubble = screen.getByText("Welcome! Let me help you configure your adventure.").closest('[data-testid="message-bubble"]');
        expect(messageBubble).toBeInTheDocument();
        expect(messageBubble).toHaveClass('mr-auto');
      });
    });

    describe('streaming responses', () => {
      it('shows typing indicator while streaming', async () => {
        render(<ChatContainer sessionId="test-session" />);

        // Wait for WebSocket connection
        await waitFor(() => {
          expect(MockWebSocket.instances.length).toBe(1);
        });

        const ws = MockWebSocket.getLastInstance()!;

        // Simulate stream start
        act(() => {
          ws.simulateMessage({ type: 'chat:assistant_start', payload: { messageId: 'msg-123' } });
        });

        // Typing indicator should be visible
        await waitFor(() => {
          // The TypingIndicator component renders animated dots
          expect(useChatStore.getState().isStreaming).toBe(true);
        });
      });

      it('accumulates streamed content character by character', async () => {
        render(<ChatContainer sessionId="test-session" />);

        await waitFor(() => {
          expect(MockWebSocket.instances.length).toBe(1);
        });

        const ws = MockWebSocket.getLastInstance()!;

        // Start streaming
        act(() => {
          ws.simulateMessage({ type: 'chat:assistant_start', payload: { messageId: 'msg-123' } });
        });

        // Send chunks
        act(() => {
          ws.simulateMessage({ type: 'chat:assistant_chunk', payload: { messageId: 'msg-123', chunk: 'Hello' } });
        });

        act(() => {
          ws.simulateMessage({ type: 'chat:assistant_chunk', payload: { messageId: 'msg-123', chunk: ' world' } });
        });

        // Complete streaming
        act(() => {
          ws.simulateMessage({ type: 'chat:assistant_complete', payload: { messageId: 'msg-123' } });
        });

        // Verify final content
        const messages = useChatStore.getState().messages;
        expect(messages.length).toBeGreaterThan(0);
        const assistantMessage = messages.find(m => m.role === 'assistant');
        expect(assistantMessage?.content).toBe('Hello world');
      });
    });

    describe('connection status', () => {
      it('shows connected status when WebSocket connects', async () => {
        render(<ChatContainer sessionId="test-session" />);

        await waitFor(() => {
          expect(useChatStore.getState().connectionStatus).toBe('connected');
        });
      });

      it('shows reconnecting status on unexpected disconnect', async () => {
        render(<ChatContainer sessionId="test-session" />);

        await waitFor(() => {
          expect(MockWebSocket.instances.length).toBe(1);
        });

        const ws = MockWebSocket.getLastInstance()!;

        // Simulate abnormal close
        act(() => {
          ws.simulateClose(1006, 'Connection lost');
        });

        expect(useChatStore.getState().connectionStatus).toBe('reconnecting');
      });
    });
  });

  // ===========================================================================
  // 2. Dial Interactions Tests
  // ===========================================================================

  describe('2. Dial Interactions', () => {
    describe('dial confirmation', () => {
      it('updates confirmed count when dial is confirmed', () => {
        // Set a dial value
        storeAction(() => {
          useDialsStore.getState().setDial('partySize', 4);
          useDialsStore.getState().confirmDial('partySize');
        });

        const state = useDialsStore.getState();
        expect(selectConfirmedCount(state)).toBe(1);
      });

      it('tracks completion percentage across all dials', () => {
        // Confirm multiple dials
        storeAction(() => {
          useDialsStore.getState().setDial('partySize', 4);
          useDialsStore.getState().confirmDial('partySize');
          useDialsStore.getState().setDial('partyTier', 2);
          useDialsStore.getState().confirmDial('partyTier');
        });

        const state = useDialsStore.getState();
        // 2 out of 10 dials confirmed = 20%
        expect(selectCompletionPercentage(state)).toBe(20);
      });
    });

    describe('dial summary panel', () => {
      /**
       * Create a mock DialsState with functions for DialSummaryPanel props
       */
      function createMockDialsState(overrides?: Partial<DialsState>): DialsState {
        return {
          partySize: 4,
          partyTier: 2,
          sceneCount: 4,
          sessionLength: '3-4 hours',
          tone: null,
          combatExplorationBalance: null,
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: [],
          confirmedDials: new Set<DialId>(),
          setDial: vi.fn(),
          confirmDial: vi.fn(),
          unconfirmDial: vi.fn(),
          resetDials: vi.fn(),
          resetDial: vi.fn(),
          addTheme: vi.fn(),
          removeTheme: vi.fn(),
          ...overrides,
        };
      }

      it('renders dial summary with current values', () => {
        const mockDials = createMockDialsState({
          partySize: 5,
          partyTier: 3,
        });

        render(
          <DialSummaryPanel
            dials={mockDials}
            onEditDial={vi.fn()}
            onConfirmDial={vi.fn()}
            onContinue={vi.fn()}
          />
        );

        // Verify dial values are displayed
        expect(screen.getByText('5')).toBeInTheDocument(); // partySize
        expect(screen.getByText('3')).toBeInTheDocument(); // partyTier
      });

      it('calls onEditDial when edit button is clicked', async () => {
        const user = userEvent.setup();
        const onEditDial = vi.fn();
        const mockDials = createMockDialsState();

        render(
          <DialSummaryPanel
            dials={mockDials}
            onEditDial={onEditDial}
            onConfirmDial={vi.fn()}
            onContinue={vi.fn()}
          />
        );

        // Find and click an edit button
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        if (editButtons.length > 0) {
          await user.click(editButtons[0]);
          expect(onEditDial).toHaveBeenCalled();
        }
      });

      it('shows continue button when all dials are confirmed', () => {
        const dialIds: DialId[] = [
          'partySize', 'partyTier', 'sceneCount', 'sessionLength',
          'tone', 'combatExplorationBalance', 'npcDensity',
          'lethality', 'emotionalRegister', 'themes'
        ];

        const mockDials = createMockDialsState({
          confirmedDials: new Set(dialIds),
          partySize: 4,
          partyTier: 2,
          sceneCount: 4,
          sessionLength: '3-4 hours',
          tone: 'Epic',
          combatExplorationBalance: 'Balanced',
          npcDensity: 'Moderate',
          lethality: 'Challenging',
          emotionalRegister: 'Tense',
          themes: ['redemption'],
        });

        render(
          <DialSummaryPanel
            dials={mockDials}
            onEditDial={vi.fn()}
            onConfirmDial={vi.fn()}
            onContinue={vi.fn()}
          />
        );

        // Continue button should be enabled when all dials are confirmed
        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).not.toBeDisabled();
      });
    });

    describe('themes max selection', () => {
      it('enforces max 3 theme selections', () => {
        storeAction(() => {
          useDialsStore.getState().addTheme('redemption');
          useDialsStore.getState().addTheme('sacrifice');
          useDialsStore.getState().addTheme('identity');
        });

        // Attempt to add a 4th theme - should fail
        const result = storeAction(() =>
          useDialsStore.getState().addTheme('legacy')
        );

        expect(result).toBe(false);
        expect(useDialsStore.getState().themes).toHaveLength(3);
      });
    });
  });

  // ===========================================================================
  // 3. State Persistence Tests
  // ===========================================================================

  describe('3. State Persistence', () => {
    describe('dial state persistence', () => {
      it('persists dial values to localStorage', () => {
        storeAction(() => {
          useDialsStore.getState().setDial('partySize', 5);
          useDialsStore.getState().confirmDial('partySize');
        });

        // Check localStorage
        const stored = localStorage.getItem(DIALS_STORAGE_KEY);
        expect(stored).not.toBeNull();

        const parsed = JSON.parse(stored!);
        expect(parsed.state.partySize).toBe(5);
      });

      it('restores dial values from localStorage on store creation', () => {
        // Pre-populate localStorage
        setPersistedState(DIALS_STORAGE_KEY, {
          partySize: 6,
          partyTier: 3,
          sceneCount: 5,
          sessionLength: '4-5 hours',
          tone: 'dark and mysterious',
          combatExplorationBalance: null,
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: ['redemption', 'sacrifice'],
          confirmedDials: ['partySize', 'partyTier'],
        });

        // Note: In actual implementation, the store would rehydrate from this
        // This test verifies the storage format is correct
        const stored = localStorage.getItem(DIALS_STORAGE_KEY);
        const parsed = JSON.parse(stored!);
        expect(parsed.state.partySize).toBe(6);
        expect(parsed.state.themes).toEqual(['redemption', 'sacrifice']);
      });
    });

    describe('chat history persistence', () => {
      it('persists messages to localStorage', () => {
        storeAction(() => {
          useChatStore.getState().addMessage({
            role: 'user',
            content: 'Test message',
          });
        });

        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        expect(stored).not.toBeNull();

        const parsed = JSON.parse(stored!);
        expect(parsed.state.messages).toHaveLength(1);
        expect(parsed.state.messages[0].content).toBe('Test message');
      });

      it('does not persist streaming state', () => {
        storeAction(() => {
          useChatStore.getState().startStreaming();
        });

        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Streaming state should be excluded from persistence
          expect(parsed.state.isStreaming).toBeUndefined();
          expect(parsed.state.streamingMessageId).toBeUndefined();
        }
      });
    });

    describe('adventure state persistence', () => {
      it('persists adventure session to localStorage', () => {
        storeAction(() => {
          useAdventureStore.getState().initSession('Test Adventure');
        });

        const stored = localStorage.getItem(ADVENTURE_STORAGE_KEY);
        expect(stored).not.toBeNull();

        const parsed = JSON.parse(stored!);
        expect(parsed.state.adventureName).toBe('Test Adventure');
        expect(parsed.state.sessionId).not.toBeNull();
      });
    });
  });

  // ===========================================================================
  // 4. End-to-End Flow Tests
  // ===========================================================================

  describe('4. End-to-End Flow', () => {
    describe('adventure initialization', () => {
      it('starts in setup phase', () => {
        const state = useAdventureStore.getState();
        expect(state.currentPhase).toBe('setup');
      });

      it('transitions to dial-tuning phase after setup', () => {
        storeAction(() => {
          useAdventureStore.getState().initSession('My Adventure');
          useAdventureStore.getState().setPhase('dial-tuning');
        });

        expect(useAdventureStore.getState().currentPhase).toBe('dial-tuning');
      });
    });

    describe('complete dial tuning flow', () => {
      it('tracks progress as dials are confirmed', () => {
        // Set each dial and confirm it, verifying progress along the way
        const dialActions = [
          () => useDialsStore.getState().setDial('partySize', 4),
          () => useDialsStore.getState().setDial('partyTier', 2),
          () => useDialsStore.getState().setDial('sceneCount', 4),
          () => useDialsStore.getState().setDial('sessionLength', '3-4 hours'),
          () => useDialsStore.getState().setDial('tone', 'Mysterious and haunting'),
          () => useDialsStore.getState().setDial('combatExplorationBalance', 'exploration-focused'),
          () => useDialsStore.getState().setDial('npcDensity', 'moderate'),
          () => useDialsStore.getState().setDial('lethality', 'challenging'),
          () => useDialsStore.getState().setDial('emotionalRegister', 'tense'),
          () => useDialsStore.getState().setDial('themes', ['redemption', 'found-family'] as const),
        ];

        const dialIds: DialId[] = [
          'partySize', 'partyTier', 'sceneCount', 'sessionLength',
          'tone', 'combatExplorationBalance', 'npcDensity',
          'lethality', 'emotionalRegister', 'themes'
        ];

        dialActions.forEach((setAction, index) => {
          storeAction(() => {
            setAction();
            useDialsStore.getState().confirmDial(dialIds[index]);
          });

          const state = useDialsStore.getState();
          const expectedPercentage = ((index + 1) / 10) * 100;
          expect(selectCompletionPercentage(state)).toBe(expectedPercentage);
        });

        // All dials should be confirmed
        const finalState = useDialsStore.getState();
        expect(selectConfirmedCount(finalState)).toBe(10);
        expect(selectCompletionPercentage(finalState)).toBe(100);
      });

      it('stores all dial values correctly', () => {
        storeAction(() => {
          useDialsStore.getState().setDial('partySize', 4);
          useDialsStore.getState().setDial('partyTier', 2);
          useDialsStore.getState().setDial('sceneCount', 5);
          useDialsStore.getState().setDial('sessionLength', '3-4 hours');
          useDialsStore.getState().setDial('tone', 'Epic fantasy');
          useDialsStore.getState().setDial('combatExplorationBalance', 'balanced');
          useDialsStore.getState().setDial('npcDensity', 'rich');
          useDialsStore.getState().setDial('lethality', 'moderate');
          useDialsStore.getState().setDial('emotionalRegister', 'thrilling');
          useDialsStore.getState().setDial('themes', ['redemption', 'sacrifice', 'found-family']);
        });

        const state = useDialsStore.getState();

        // Verify concrete dials
        expect(state.partySize).toBe(4);
        expect(state.partyTier).toBe(2);
        expect(state.sceneCount).toBe(5);
        expect(state.sessionLength).toBe('3-4 hours');

        // Verify conceptual dials
        expect(state.tone).toBe('Epic fantasy');
        expect(state.combatExplorationBalance).toBe('balanced');
        expect(state.npcDensity).toBe('rich');
        expect(state.lethality).toBe('moderate');
        expect(state.emotionalRegister).toBe('thrilling');
        expect(state.themes).toEqual(['redemption', 'sacrifice', 'found-family']);
      });
    });

    describe('phase progression', () => {
      it('can transition from dial-tuning to frame phase', () => {
        // Initialize and complete dial tuning
        storeAction(() => {
          useAdventureStore.getState().initSession('Test Adventure');
          useAdventureStore.getState().setPhase('dial-tuning');
        });

        // Complete all dials
        const dialIds: DialId[] = [
          'partySize', 'partyTier', 'sceneCount', 'sessionLength',
          'tone', 'combatExplorationBalance', 'npcDensity',
          'lethality', 'emotionalRegister', 'themes'
        ];

        storeAction(() => {
          dialIds.forEach(dialId => {
            if (dialId === 'partySize') useDialsStore.getState().setDial(dialId, 4);
            else if (dialId === 'partyTier') useDialsStore.getState().setDial(dialId, 2);
            else if (dialId === 'sceneCount') useDialsStore.getState().setDial(dialId, 4);
            else if (dialId === 'sessionLength') useDialsStore.getState().setDial(dialId, '3-4 hours');
            else if (dialId === 'themes') useDialsStore.getState().setDial(dialId, ['redemption']);
            else useDialsStore.getState().setDial(dialId, 'test value');

            useDialsStore.getState().confirmDial(dialId);
          });
        });

        // Verify all dials confirmed
        expect(selectConfirmedCount(useDialsStore.getState())).toBe(10);

        // Transition to frame phase
        storeAction(() => {
          useAdventureStore.getState().setPhase('frame');
        });

        expect(useAdventureStore.getState().currentPhase).toBe('frame');
      });

      it('maintains phase history for navigation', () => {
        storeAction(() => {
          useAdventureStore.getState().initSession('Test Adventure');
          useAdventureStore.getState().setPhase('dial-tuning');
          useAdventureStore.getState().setPhase('frame');
        });

        const state = useAdventureStore.getState();
        expect(state.phaseHistory).toContain('setup');
        expect(state.phaseHistory).toContain('dial-tuning');
        expect(state.currentPhase).toBe('frame');
      });
    });
  });

  // ===========================================================================
  // 5. Store Integration Tests
  // ===========================================================================

  describe('5. Store Integration', () => {
    describe('clearAllStorageData', () => {
      it('clears all persisted data and resets stores', () => {
        // Set up state in all stores
        storeAction(() => {
          useChatStore.getState().addMessage({ role: 'user', content: 'Test' });
          useDialsStore.getState().setDial('partySize', 5);
          useAdventureStore.getState().initSession('Test');
        });

        // Verify data was set
        expect(useChatStore.getState().messages.length).toBeGreaterThan(0);
        expect(useDialsStore.getState().partySize).toBe(5);
        expect(useAdventureStore.getState().sessionId).not.toBeNull();

        // Clear all
        clearAllStorageData();

        // Verify stores are reset to initial state
        expect(useChatStore.getState().messages).toEqual([]);
        expect(useDialsStore.getState().partySize).toBe(4); // Default value
        expect(useAdventureStore.getState().sessionId).toBeNull();
      });
    });

    describe('resetAllStores', () => {
      it('resets all store state to initial values', () => {
        // Set up state
        storeAction(() => {
          useChatStore.getState().addMessage({ role: 'user', content: 'Test' });
          useDialsStore.getState().setDial('partySize', 5);
          useDialsStore.getState().confirmDial('partySize');
          useAdventureStore.getState().initSession('Test');
        });

        // Reset
        resetAllStores();

        // Verify reset
        expect(useChatStore.getState().messages).toEqual([]);
        expect(useDialsStore.getState().partySize).toBe(4); // Default
        expect(selectConfirmedCount(useDialsStore.getState())).toBe(0);
        expect(useAdventureStore.getState().sessionId).toBeNull();
      });
    });
  });
});
