/**
 * Adventure Workflow Integration Tests
 *
 * Issue #31: End-to-end verification of Phase 4.0 adventure workflow functionality
 *
 * Test Scenarios:
 * 1. Phase transitions - Progression from setup through content phases
 * 2. Phase-specific components - Components render correctly with props
 * 3. Navigation - Back navigation and phase history
 * 4. Session persistence - localStorage recovery
 * 5. Component integration - PhaseProgressBar, PhaseNavigation, content panels
 *
 * Note: These tests focus on store logic and individual component rendering
 * rather than full AdventurePage rendering to ensure test stability.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Individual components for targeted testing
import { ChatContainer } from '@/components/chat';
import { DialSummaryPanel } from '@/components/dials';
import { FramePanel, OutlinePanel, EchoGenerator, EchoCard } from '@/components/content';
import { PhaseProgressBar, PhaseNavigation } from '@/components/adventure';

// Stores
import { useAdventureStore } from '@/stores/adventureStore';
import { useDialsStore, selectRequiredDialsComplete, selectConfirmedCount } from '@/stores/dialsStore';
import { useContentStore } from '@/stores/contentStore';
import { resetAllStores } from '@/stores';

// Types
import type { DialsState } from '@/stores/dialsStore';
import type { Phase } from '@dagger-app/shared-types';

// Test utilities
import { storeAction, clearPersistedStorage } from './store-utils';
import { MockWebSocket } from './setup';

// =============================================================================
// Test Setup
// =============================================================================

const ADVENTURE_STORAGE_KEY = 'dagger-adventure-storage';
const DIALS_STORAGE_KEY = 'dagger-dials-storage';
const CONTENT_STORAGE_KEY = 'dagger-content-storage';
const CHAT_STORAGE_KEY = 'dagger-chat-storage';

// Mock dials state for DialSummaryPanel
const createMockDialsState = (overrides?: Partial<DialsState>): DialsState => ({
  partySize: 4,
  partyTier: 2,
  sceneCount: 4,
  sessionLength: '3-4 hours',
  tone: null,
  pillarBalance: null,
  npcDensity: null,
  lethality: null,
  emotionalRegister: null,
  themes: [],
  confirmedDials: new Set(['partySize', 'partyTier', 'sceneCount', 'sessionLength']),
  setDial: vi.fn().mockReturnValue(true),
  confirmDial: vi.fn(),
  unconfirmDial: vi.fn(),
  resetDials: vi.fn(),
  resetDial: vi.fn(),
  addTheme: vi.fn().mockReturnValue(true),
  removeTheme: vi.fn(),
  ...overrides,
});

describe('Adventure Workflow Integration Tests', () => {
  beforeEach(() => {
    // Clear all storage
    clearPersistedStorage(ADVENTURE_STORAGE_KEY);
    clearPersistedStorage(DIALS_STORAGE_KEY);
    clearPersistedStorage(CONTENT_STORAGE_KEY);
    clearPersistedStorage(CHAT_STORAGE_KEY);

    // Reset all stores
    resetAllStores();

    // Reset WebSocket mock
    MockWebSocket.reset();

    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
      setTimeout(cb, 0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    // Mock scrollTo
    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.unstubAllGlobals();
  });

  // ===========================================================================
  // 1. Phase Transitions (Store Logic)
  // ===========================================================================

  describe('1. Phase Transitions', () => {
    it('initializes session and starts at dial-tuning phase', () => {
      storeAction(() => {
        useAdventureStore.getState().initSession('Test Adventure');
      });

      const state = useAdventureStore.getState();
      expect(state.sessionId).not.toBeNull();
      expect(state.adventureName).toBe('Test Adventure');
      expect(state.currentPhase).toBe('dial-tuning');
    });

    it('tracks phase history as phases progress', () => {
      storeAction(() => {
        useAdventureStore.getState().initSession('Test');
        useAdventureStore.getState().setPhase('frame');
        useAdventureStore.getState().setPhase('outline');
      });

      const state = useAdventureStore.getState();
      expect(state.phaseHistory).toContain('dial-tuning');
      expect(state.phaseHistory).toContain('frame');
      expect(state.currentPhase).toBe('outline');
    });

    it('can go back to previous phase', () => {
      storeAction(() => {
        useAdventureStore.getState().initSession('Test');
        useAdventureStore.getState().setPhase('frame');
        useAdventureStore.getState().setPhase('outline');
        useAdventureStore.getState().goToPreviousPhase();
      });

      expect(useAdventureStore.getState().currentPhase).toBe('frame');
    });

    it('goes back to setup from dial-tuning', () => {
      storeAction(() => {
        useAdventureStore.getState().initSession('Test');
        useAdventureStore.getState().goToPreviousPhase();
      });

      // dial-tuning can go back to setup
      expect(useAdventureStore.getState().currentPhase).toBe('setup');
    });

    it('stays at setup when trying to go back from setup', () => {
      storeAction(() => {
        useAdventureStore.getState().initSession('Test');
        useAdventureStore.getState().goToPreviousPhase(); // to setup
        useAdventureStore.getState().goToPreviousPhase(); // still at setup
      });

      expect(useAdventureStore.getState().currentPhase).toBe('setup');
    });

    it('completes required dials to enable frame transition', () => {
      storeAction(() => {
        const dials = useDialsStore.getState();
        dials.setDial('partySize', 4);
        dials.confirmDial('partySize');
        dials.setDial('partyTier', 2);
        dials.confirmDial('partyTier');
        dials.setDial('sceneCount', 4);
        dials.confirmDial('sceneCount');
        dials.setDial('sessionLength', '3-4 hours');
        dials.confirmDial('sessionLength');
      });

      const state = useDialsStore.getState();
      expect(selectRequiredDialsComplete(state)).toBe(true);
    });

    it('transitions from outline to scenes when outline is confirmed', () => {
      storeAction(() => {
        useAdventureStore.getState().initSession('Test');
        useAdventureStore.getState().setPhase('outline');

        useContentStore.getState().setOutline({
          title: 'Test Outline',
          summary: 'A test adventure',
          scenes: [
            { id: 'scene-1', sceneNumber: 1, title: 'Scene 1', description: 'First scene', keyElements: [] },
            { id: 'scene-2', sceneNumber: 2, title: 'Scene 2', description: 'Second scene', keyElements: [] },
          ],
        });
        useContentStore.getState().confirmOutline();
        useContentStore.getState().initializeScenesFromOutline();
        useAdventureStore.getState().setPhase('scenes');
      });

      expect(useAdventureStore.getState().currentPhase).toBe('scenes');
      expect(useContentStore.getState().scenes.length).toBe(2);
    });
  });

  // ===========================================================================
  // 2. PhaseProgressBar Component
  // ===========================================================================

  describe('2. PhaseProgressBar Component', () => {
    it('renders with adventure name', () => {
      render(<PhaseProgressBar currentPhase="dial-tuning" adventureName="My Adventure" />);

      expect(screen.getByText('My Adventure')).toBeInTheDocument();
    });

    it('shows current phase label', () => {
      render(<PhaseProgressBar currentPhase="frame" />);

      // Phase label is "Frame" from PHASES constant
      expect(screen.getByText('Frame')).toBeInTheDocument();
    });

    it('displays progress percentage', () => {
      render(<PhaseProgressBar currentPhase="dial-tuning" />);

      // dial-tuning is order 1 out of 9 (max order) = ~11%
      expect(screen.getByText('11% Complete')).toBeInTheDocument();
    });

    it('updates progress as phase advances', () => {
      const { rerender } = render(<PhaseProgressBar currentPhase="dial-tuning" />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '11');

      rerender(<PhaseProgressBar currentPhase="outline" />);
      // outline is order 3 out of 9 = 33%
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
    });

    it('shows 100% for complete phase', () => {
      render(<PhaseProgressBar currentPhase="complete" />);

      expect(screen.getByText('100% Complete')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 3. PhaseNavigation Component
  // ===========================================================================

  describe('3. PhaseNavigation Component', () => {
    const mockOnBack = vi.fn();
    const mockOnContinue = vi.fn();

    beforeEach(() => {
      mockOnBack.mockClear();
      mockOnContinue.mockClear();
    });

    it('renders back and continue buttons', () => {
      render(
        <PhaseNavigation
          currentPhase="frame"
          canGoBack={true}
          canContinue={true}
          onBack={mockOnBack}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue to outline/i })).toBeInTheDocument();
    });

    it('disables back button when canGoBack is false', () => {
      render(
        <PhaseNavigation
          currentPhase="dial-tuning"
          canGoBack={false}
          canContinue={true}
          onBack={mockOnBack}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
    });

    it('disables continue button when canContinue is false', () => {
      render(
        <PhaseNavigation
          currentPhase="dial-tuning"
          canGoBack={true}
          canContinue={false}
          onBack={mockOnBack}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByRole('button', { name: /continue to frame/i })).toBeDisabled();
    });

    it('calls onBack when back button clicked', async () => {
      const user = userEvent.setup();
      render(
        <PhaseNavigation
          currentPhase="frame"
          canGoBack={true}
          canContinue={true}
          onBack={mockOnBack}
          onContinue={mockOnContinue}
        />
      );

      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('calls onContinue when continue button clicked', async () => {
      const user = userEvent.setup();
      render(
        <PhaseNavigation
          currentPhase="frame"
          canGoBack={true}
          canContinue={true}
          onBack={mockOnBack}
          onContinue={mockOnContinue}
        />
      );

      await user.click(screen.getByRole('button', { name: /continue to outline/i }));
      expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });

    it('shows phase-specific continue label', () => {
      const phases: Array<{ phase: Phase; label: string }> = [
        { phase: 'dial-tuning', label: 'Continue to Frame' },
        { phase: 'frame', label: 'Continue to Outline' },
        { phase: 'outline', label: 'Continue to Scenes' },
        { phase: 'scenes', label: 'Continue to NPCs' },
        { phase: 'npcs', label: 'Continue to Adversaries' },
      ];

      phases.forEach(({ phase, label }) => {
        const { unmount } = render(
          <PhaseNavigation
            currentPhase={phase}
            canGoBack={true}
            canContinue={true}
            onBack={mockOnBack}
            onContinue={mockOnContinue}
          />
        );

        expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument();
        unmount();
      });
    });

    it('shows loading state when isLoading', () => {
      render(
        <PhaseNavigation
          currentPhase="frame"
          canGoBack={true}
          canContinue={true}
          onBack={mockOnBack}
          onContinue={mockOnContinue}
          isLoading={true}
        />
      );

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 4. DialSummaryPanel Integration
  // ===========================================================================

  describe('4. DialSummaryPanel Integration', () => {
    const mockOnEditDial = vi.fn();
    const mockOnConfirmDial = vi.fn();
    const mockOnContinue = vi.fn();

    beforeEach(() => {
      mockOnEditDial.mockClear();
      mockOnConfirmDial.mockClear();
      mockOnContinue.mockClear();
    });

    it('renders with mock dials state', () => {
      render(
        <DialSummaryPanel
          dials={createMockDialsState()}
          onEditDial={mockOnEditDial}
          onConfirmDial={mockOnConfirmDial}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Adventure Dials')).toBeInTheDocument();
      expect(screen.getByText('Party Size')).toBeInTheDocument();
    });

    it('shows confirmation count', () => {
      const dials = createMockDialsState();
      render(
        <DialSummaryPanel
          dials={dials}
          onEditDial={mockOnEditDial}
          onConfirmDial={mockOnConfirmDial}
          onContinue={mockOnContinue}
        />
      );

      // 4 required dials confirmed
      expect(screen.getByText('4 of 10 configured')).toBeInTheDocument();
    });

    it('hides continue button when not all dials are confirmed', () => {
      const dials = createMockDialsState({
        confirmedDials: new Set(['partySize']), // Only 1 confirmed
      });

      render(
        <DialSummaryPanel
          dials={dials}
          onEditDial={mockOnEditDial}
          onConfirmDial={mockOnConfirmDial}
          onContinue={mockOnContinue}
        />
      );

      // DialSummaryPanel only shows continue button when ALL 10 dials are confirmed
      // With only 1 confirmed, the button should not exist
      const continueButton = screen.queryByRole('button', { name: /continue/i });
      expect(continueButton).toBeNull();
    });

    it('shows continue button when all dials are confirmed', () => {
      const allDialIds = [
        'partySize',
        'partyTier',
        'sceneCount',
        'sessionLength',
        'tone',
        'pillarBalance',
        'npcDensity',
        'lethality',
        'emotionalRegister',
        'themes',
      ] as const;

      const dials = createMockDialsState({
        tone: 'balanced',
        pillarBalance: { primary: 'combat', secondary: 'exploration', tertiary: 'social' },
        npcDensity: 'moderate',
        lethality: 'standard',
        emotionalRegister: 'epic',
        themes: ['redemption'],
        confirmedDials: new Set(allDialIds),
      });

      render(
        <DialSummaryPanel
          dials={dials}
          onEditDial={mockOnEditDial}
          onConfirmDial={mockOnConfirmDial}
          onContinue={mockOnContinue}
        />
      );

      // When all dials are confirmed, continue button should be visible and enabled
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeInTheDocument();
      expect(continueButton).not.toBeDisabled();
    });
  });

  // ===========================================================================
  // 5. Session Persistence
  // ===========================================================================

  describe('5. Session Persistence', () => {
    it('persists session to localStorage', () => {
      storeAction(() => {
        useAdventureStore.getState().initSession('Persistent Adventure');
      });

      const stored = localStorage.getItem(ADVENTURE_STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.adventureName).toBe('Persistent Adventure');
    });

    it('persists phase changes', () => {
      storeAction(() => {
        useAdventureStore.getState().initSession('Test');
        useAdventureStore.getState().setPhase('frame');
      });

      const stored = localStorage.getItem(ADVENTURE_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.state.currentPhase).toBe('frame');
    });

    it('persists dial values', () => {
      storeAction(() => {
        useDialsStore.getState().setDial('partySize', 5);
        useDialsStore.getState().confirmDial('partySize');
      });

      const stored = localStorage.getItem(DIALS_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.state.partySize).toBe(5);
      expect(parsed.state.confirmedDials).toContain('partySize');
    });

    it('persists content store state', () => {
      storeAction(() => {
        // Use DaggerheartFrame structure (no isCustom property)
        useContentStore.getState().selectFrame({
          id: 'test-frame',
          name: 'Test Frame',
          description: 'Test',
          themes: [],
          typical_adversaries: null,
          lore: null,
          embedding: null,
          source_book: null,
          created_at: null,
        });
      });

      const stored = localStorage.getItem(CONTENT_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.state.selectedFrame.name).toBe('Test Frame');
    });
  });

  // ===========================================================================
  // 6. ChatContainer Integration
  // ===========================================================================

  describe('6. ChatContainer Integration', () => {
    it('renders chat container with session ID', async () => {
      render(
        <MemoryRouter>
          <ChatContainer sessionId="test-session" />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      expect(screen.getByTestId('chat-container')).toBeInTheDocument();
    });

    it('shows connecting state initially', () => {
      render(
        <MemoryRouter>
          <ChatContainer sessionId="test-session" />
        </MemoryRouter>
      );

      // Before WebSocket opens, should show connecting placeholder
      expect(screen.getByPlaceholderText(/connecting/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 7. Content Panel Rendering
  // ===========================================================================

  describe('7. Content Panel Components', () => {
    // Note: FramePanel, OutlinePanel, and SceneEditor have internal store
    // connections and are tested in their respective component test files.
    // These tests verify the components are exported and can be imported.

    it('exports FramePanel component', () => {
      expect(FramePanel).toBeDefined();
      expect(typeof FramePanel).toBe('function');
    });

    it('exports OutlinePanel component', () => {
      expect(OutlinePanel).toBeDefined();
      expect(typeof OutlinePanel).toBe('function');
    });
  });

  // ===========================================================================
  // 8. Full Workflow Simulation (Store-Level)
  // ===========================================================================

  describe('8. Full Workflow Simulation', () => {
    it('simulates complete phase progression through stores', () => {
      // Phase 1: Setup - Initialize session
      storeAction(() => {
        useAdventureStore.getState().initSession('Epic Quest');
      });
      expect(useAdventureStore.getState().currentPhase).toBe('dial-tuning');

      // Phase 2: Dial tuning - Configure all required dials
      storeAction(() => {
        const dials = useDialsStore.getState();
        dials.setDial('partySize', 4);
        dials.confirmDial('partySize');
        dials.setDial('partyTier', 2);
        dials.confirmDial('partyTier');
        dials.setDial('sceneCount', 4);
        dials.confirmDial('sceneCount');
        dials.setDial('sessionLength', '3-4 hours');
        dials.confirmDial('sessionLength');
      });
      expect(selectConfirmedCount(useDialsStore.getState())).toBe(4);
      expect(selectRequiredDialsComplete(useDialsStore.getState())).toBe(true);

      // Phase 3: Frame selection
      storeAction(() => {
        useAdventureStore.getState().setPhase('frame');
        // Use DaggerheartFrame structure (no isCustom property)
        useContentStore.getState().selectFrame({
          id: 'haunted-manor',
          name: 'The Haunted Manor',
          description: 'A mysterious old house',
          themes: ['trust-betrayal', 'survival'],
          typical_adversaries: null,
          lore: null,
          embedding: null,
          source_book: null,
          created_at: null,
        });
        useContentStore.getState().confirmFrame();
      });
      expect(useAdventureStore.getState().currentPhase).toBe('frame');
      expect(useContentStore.getState().frameConfirmed).toBe(true);

      // Phase 4: Outline generation
      storeAction(() => {
        useAdventureStore.getState().setPhase('outline');
        useContentStore.getState().setOutline({
          title: 'The Hollow Vigil',
          summary: 'Heroes investigate a haunted manor',
          scenes: [
            { id: 's1', sceneNumber: 1, title: 'Arrival', description: 'The party arrives', keyElements: ['manor gate'] },
            { id: 's2', sceneNumber: 2, title: 'Investigation', description: 'Explore the manor', keyElements: ['hidden room'] },
            { id: 's3', sceneNumber: 3, title: 'Confrontation', description: 'Face the spirit', keyElements: ['ghost'] },
          ],
        });
        useContentStore.getState().confirmOutline();
      });
      expect(useContentStore.getState().outlineConfirmed).toBe(true);

      // Phase 5: Scene editing
      storeAction(() => {
        useContentStore.getState().initializeScenesFromOutline();
        useAdventureStore.getState().setPhase('scenes');
      });
      expect(useAdventureStore.getState().currentPhase).toBe('scenes');
      expect(useContentStore.getState().scenes.length).toBe(3);

      // Verify phase history
      const state = useAdventureStore.getState();
      expect(state.phaseHistory).toContain('dial-tuning');
      expect(state.phaseHistory).toContain('frame');
      expect(state.phaseHistory).toContain('outline');
    });
  });

  // ===========================================================================
  // 9. Echo Generator Integration (Phase 4.3)
  // ===========================================================================

  describe('9. Echo Generator Integration', () => {
    const mockEchoes = [
      {
        id: 'echo-1',
        category: 'complications' as const,
        title: 'Bridge Collapse',
        content: 'The ancient bridge crumbles.',
        isConfirmed: false,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'echo-2',
        category: 'rumors' as const,
        title: 'Treasure Whispers',
        content: 'Locals speak of hidden gold.',
        isConfirmed: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    it('exports EchoGenerator component', () => {
      expect(EchoGenerator).toBeDefined();
      expect(typeof EchoGenerator).toBe('function');
    });

    it('exports EchoCard component', () => {
      expect(EchoCard).toBeDefined();
      expect(typeof EchoCard).toBe('function');
    });

    it('renders EchoGenerator with echoes', () => {
      const mockHandlers = {
        onCategoryChange: vi.fn(),
        onGenerate: vi.fn(),
        onConfirm: vi.fn(),
        onConfirmAll: vi.fn(),
        onEdit: vi.fn(),
        onRegenerate: vi.fn(),
      };

      render(
        <EchoGenerator
          echoes={mockEchoes}
          activeCategory="complications"
          isLoading={false}
          streamingContent={null}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('GM Creativity Echoes')).toBeInTheDocument();
      expect(screen.getByText('Bridge Collapse')).toBeInTheDocument();
    });

    it('renders EchoCard with echo data', () => {
      const mockHandlers = {
        onConfirm: vi.fn(),
        onEdit: vi.fn(),
        onRegenerate: vi.fn(),
      };

      render(<EchoCard echo={mockEchoes[0]} {...mockHandlers} />);

      expect(screen.getByText('Bridge Collapse')).toBeInTheDocument();
      expect(screen.getByText(/ancient bridge crumbles/)).toBeInTheDocument();
      expect(screen.getByText('complications')).toBeInTheDocument();
    });

    it('manages echo state in content store', () => {
      storeAction(() => {
        useContentStore.getState().setEchoes(mockEchoes);
      });

      const state = useContentStore.getState();
      expect(state.echoes.length).toBe(2);
      expect(state.echoes[0].title).toBe('Bridge Collapse');
    });

    it('confirms individual echoes via store', () => {
      storeAction(() => {
        useContentStore.getState().setEchoes(mockEchoes);
        useContentStore.getState().confirmEcho('echo-1');
      });

      const state = useContentStore.getState();
      const confirmedEcho = state.echoes.find(e => e.id === 'echo-1');
      expect(confirmedEcho?.isConfirmed).toBe(true);
    });

    it('confirms all echoes via store', () => {
      storeAction(() => {
        useContentStore.getState().setEchoes(mockEchoes);
        useContentStore.getState().confirmAllEchoes();
      });

      const state = useContentStore.getState();
      expect(state.echoes.every(e => e.isConfirmed)).toBe(true);
    });

    it('tracks active echo category', () => {
      storeAction(() => {
        useContentStore.getState().setActiveEchoCategory('rumors');
      });

      expect(useContentStore.getState().activeEchoCategory).toBe('rumors');
    });

    it('handles echo loading state', () => {
      storeAction(() => {
        useContentStore.getState().setEchoLoading(true);
      });

      expect(useContentStore.getState().echoLoading).toBe(true);
    });

    it('handles echo streaming content', () => {
      storeAction(() => {
        useContentStore.getState().setEchoStreamingContent('Generating...');
        useContentStore.getState().appendEchoStreamingContent(' More content');
      });

      expect(useContentStore.getState().echoStreamingContent).toBe('Generating... More content');
    });

    it('clears echoes via store', () => {
      storeAction(() => {
        useContentStore.getState().setEchoes(mockEchoes);
        useContentStore.getState().clearEchoes();
      });

      expect(useContentStore.getState().echoes.length).toBe(0);
    });

    it('transitions to echoes phase from items', () => {
      storeAction(() => {
        useAdventureStore.getState().initSession('Test');
        useAdventureStore.getState().setPhase('items');
        useAdventureStore.getState().setPhase('echoes');
      });

      expect(useAdventureStore.getState().currentPhase).toBe('echoes');
    });

    it('persists echo state to localStorage', () => {
      storeAction(() => {
        useContentStore.getState().setEchoes(mockEchoes);
      });

      const stored = localStorage.getItem(CONTENT_STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.state.echoes.length).toBe(2);
    });
  });
});
