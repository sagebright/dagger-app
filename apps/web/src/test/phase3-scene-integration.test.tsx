/**
 * Phase 3.3 Scene Editor Integration Tests
 *
 * Issue #26: End-to-end verification of scene generation and revision functionality
 *
 * Test Scenarios:
 * 1. Scene editor - draft display, streaming, feedback submission
 * 2. Scene list - progress tracking, navigation between scenes
 * 3. Scene navigation - previous/next controls, continue to NPCs
 * 4. Content store scene state - actions and selectors
 * 5. Draft-revise workflow - feedback loop, confirmation flow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Components
import { SceneEditor } from '@/components/content/SceneEditor';
import { SceneList } from '@/components/content/SceneList';
import { SceneNavigation } from '@/components/content/SceneNavigation';

// Stores
import {
  useContentStore,
  selectCurrentScene,
  selectAllScenesConfirmed,
  selectCanProceedToNPCs,
  selectSceneNavigation,
  selectConfirmedSceneCount,
} from '@/stores/contentStore';
import { resetAllStores } from '@/stores';

// Types
import type { Scene, SceneBrief, SceneDraft, Outline } from '@dagger-app/shared-types';

// Test utilities
import { storeAction, clearPersistedStorage } from './store-utils';

// =============================================================================
// Test Data
// =============================================================================

const createTestSceneBrief = (overrides: Partial<SceneBrief> = {}): SceneBrief => ({
  id: 'scene-1',
  sceneNumber: 1,
  title: 'The Approaching Darkness',
  description: 'The party discovers a mysterious location.',
  keyElements: ['Perception checks', 'Environmental hazards'],
  location: 'Ancient ruins entrance',
  characters: ['Local guide'],
  sceneType: 'exploration',
  ...overrides,
});

const createTestSceneDraft = (overrides: Partial<SceneDraft> = {}): SceneDraft => ({
  sceneId: 'scene-1',
  sceneNumber: 1,
  title: 'The Approaching Darkness',
  introduction:
    'Mist swirls around the crumbling entrance to what was once a great temple. The air carries whispers of ages past.',
  keyMoments: [
    {
      title: 'The Threshold',
      description: 'As the party steps through the entrance, ancient wards flicker to life.',
    },
    {
      title: 'The Guide Speaks',
      description: 'The local guide shares the legend of the temple.',
    },
  ],
  resolution: 'The party must decide whether to press on or seek more information.',
  tierGuidance: 'For tier 2 parties, include moderate skill checks (DC 12-15).',
  environmentDetails: 'Crumbling stone, overgrown vegetation, faded carvings.',
  discoveryOpportunities: ['Hidden chamber behind vines', 'Ancient inscription'],
  extractedEntities: {
    npcs: [{ name: 'Orik the Guide', role: 'Local historian', sceneId: 'scene-1' }],
    adversaries: [],
    items: [{ name: 'Ancient Coin', suggestedTier: 1, sceneId: 'scene-1' }],
  },
  ...overrides,
});

const createTestScene = (overrides: Partial<Scene> = {}): Scene => ({
  brief: createTestSceneBrief(),
  draft: null,
  status: 'pending',
  ...overrides,
});

const createTestOutline = (): Outline => ({
  id: 'outline-1',
  title: 'The Hollow Vigil',
  summary: 'An adventure for 4 experienced heroes exploring a haunted keep.',
  scenes: [
    createTestSceneBrief({ id: 'scene-1', sceneNumber: 1 }),
    createTestSceneBrief({
      id: 'scene-2',
      sceneNumber: 2,
      title: 'The Confrontation',
      sceneType: 'combat',
    }),
    createTestSceneBrief({
      id: 'scene-3',
      sceneNumber: 3,
      title: 'The Revelation',
      sceneType: 'revelation',
    }),
    createTestSceneBrief({
      id: 'scene-4',
      sceneNumber: 4,
      title: 'The Final Reckoning',
      sceneType: 'mixed',
    }),
  ],
  isConfirmed: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

// =============================================================================
// Test Setup
// =============================================================================

const CONTENT_STORAGE_KEY = 'dagger-content-storage';

describe('Phase 3.3 Scene Integration Tests', () => {
  beforeEach(() => {
    clearPersistedStorage(CONTENT_STORAGE_KEY);
    resetAllStores();

    // Mock requestAnimationFrame for streaming content
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
  // 1. Scene Editor Tests
  // ===========================================================================

  describe('1. Scene Editor', () => {
    describe('draft display', () => {
      it('displays scene title and type from brief', () => {
        const sceneBrief = createTestSceneBrief();
        render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={null}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={vi.fn()}
            onConfirmScene={vi.fn()}
          />
        );

        expect(screen.getByText('The Approaching Darkness')).toBeInTheDocument();
        expect(screen.getByText(/exploration/i)).toBeInTheDocument();
      });

      it('displays full draft content when available', () => {
        const sceneBrief = createTestSceneBrief();
        const sceneDraft = createTestSceneDraft();

        render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={sceneDraft}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={vi.fn()}
            onConfirmScene={vi.fn()}
          />
        );

        // Check introduction
        expect(screen.getByText(/Mist swirls around/)).toBeInTheDocument();

        // Check key moments
        expect(screen.getByText('The Threshold')).toBeInTheDocument();
        expect(screen.getByText('The Guide Speaks')).toBeInTheDocument();

        // Check resolution
        expect(screen.getByText(/The party must decide/)).toBeInTheDocument();

        // Check extracted NPCs
        expect(screen.getByText('Orik the Guide')).toBeInTheDocument();
      });

      it('displays streaming content during generation', () => {
        const sceneBrief = createTestSceneBrief();

        render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={null}
            isLoading={true}
            streamingContent="The ancient temple stands before you..."
            onSubmitFeedback={vi.fn()}
            onConfirmScene={vi.fn()}
          />
        );

        expect(screen.getByText(/The ancient temple stands before you/)).toBeInTheDocument();
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });

    describe('feedback submission', () => {
      it('submits feedback for revision', async () => {
        const user = userEvent.setup();
        const mockSubmit = vi.fn();
        const sceneBrief = createTestSceneBrief();
        const sceneDraft = createTestSceneDraft();

        render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={sceneDraft}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={mockSubmit}
            onConfirmScene={vi.fn()}
          />
        );

        const input = screen.getByPlaceholderText(/feedback/i);
        await user.type(input, 'Add more tension to the introduction');
        await user.click(screen.getByRole('button', { name: /revise/i }));

        expect(mockSubmit).toHaveBeenCalledWith('Add more tension to the introduction');
      });

      it('clears input after successful submission', async () => {
        const user = userEvent.setup();
        const sceneBrief = createTestSceneBrief();
        const sceneDraft = createTestSceneDraft();

        render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={sceneDraft}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={vi.fn()}
            onConfirmScene={vi.fn()}
          />
        );

        const input = screen.getByPlaceholderText(/feedback/i);
        await user.type(input, 'Test feedback');
        await user.click(screen.getByRole('button', { name: /revise/i }));

        expect(input).toHaveValue('');
      });

      it('submits feedback on Enter key', async () => {
        const user = userEvent.setup();
        const mockSubmit = vi.fn();
        const sceneBrief = createTestSceneBrief();
        const sceneDraft = createTestSceneDraft();

        render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={sceneDraft}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={mockSubmit}
            onConfirmScene={vi.fn()}
          />
        );

        const input = screen.getByPlaceholderText(/feedback/i);
        await user.type(input, 'Add more detail{Enter}');

        expect(mockSubmit).toHaveBeenCalledWith('Add more detail');
      });
    });

    describe('scene confirmation', () => {
      it('calls onConfirmScene when confirm button clicked', async () => {
        const user = userEvent.setup();
        const mockConfirm = vi.fn();
        const sceneBrief = createTestSceneBrief();
        const sceneDraft = createTestSceneDraft();

        render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={sceneDraft}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={vi.fn()}
            onConfirmScene={mockConfirm}
          />
        );

        await user.click(screen.getByRole('button', { name: /confirm/i }));

        expect(mockConfirm).toHaveBeenCalled();
      });

      it('shows confirmed state after confirmation', () => {
        const sceneBrief = createTestSceneBrief();
        const sceneDraft = createTestSceneDraft();

        render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={sceneDraft}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={vi.fn()}
            onConfirmScene={vi.fn()}
            isConfirmed={true}
          />
        );

        expect(screen.getByText('Scene Confirmed')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/feedback/i)).not.toBeInTheDocument();
      });
    });

    describe('error handling', () => {
      it('displays error message and retry button', async () => {
        const user = userEvent.setup();
        const mockRetry = vi.fn();
        const sceneBrief = createTestSceneBrief();

        render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={null}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={vi.fn()}
            onConfirmScene={vi.fn()}
            error="Failed to generate scene"
            onRetry={mockRetry}
          />
        );

        expect(screen.getByText(/failed to generate/i)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /retry/i }));
        expect(mockRetry).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // 2. Scene List Tests
  // ===========================================================================

  describe('2. Scene List', () => {
    describe('progress tracking', () => {
      it('displays all scenes with their status', () => {
        const scenes: Scene[] = [
          createTestScene({
            brief: createTestSceneBrief({ id: 'scene-1', sceneNumber: 1 }),
            status: 'confirmed',
          }),
          createTestScene({
            brief: createTestSceneBrief({
              id: 'scene-2',
              sceneNumber: 2,
              title: 'The Confrontation',
            }),
            status: 'generating',
          }),
          createTestScene({
            brief: createTestSceneBrief({
              id: 'scene-3',
              sceneNumber: 3,
              title: 'The Revelation',
            }),
            status: 'pending',
          }),
        ];

        render(
          <SceneList scenes={scenes} currentSceneId="scene-2" onSelectScene={vi.fn()} />
        );

        expect(screen.getByText('The Approaching Darkness')).toBeInTheDocument();
        expect(screen.getByText('The Confrontation')).toBeInTheDocument();
        expect(screen.getByText('The Revelation')).toBeInTheDocument();
        expect(screen.getByText(/1.*of.*3/)).toBeInTheDocument();
      });

      it('shows progress percentage', () => {
        const scenes: Scene[] = [
          createTestScene({ status: 'confirmed' }),
          createTestScene({
            brief: createTestSceneBrief({ id: 'scene-2', sceneNumber: 2 }),
            status: 'confirmed',
          }),
          createTestScene({
            brief: createTestSceneBrief({ id: 'scene-3', sceneNumber: 3 }),
            status: 'pending',
          }),
          createTestScene({
            brief: createTestSceneBrief({ id: 'scene-4', sceneNumber: 4 }),
            status: 'pending',
          }),
        ];

        render(
          <SceneList scenes={scenes} currentSceneId="scene-3" onSelectScene={vi.fn()} />
        );

        // 2 of 4 = 50%
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      });
    });

    describe('navigation', () => {
      it('allows clicking on confirmed scenes', async () => {
        const user = userEvent.setup();
        const mockSelect = vi.fn();
        const scenes: Scene[] = [
          createTestScene({
            brief: createTestSceneBrief({ id: 'scene-1', sceneNumber: 1 }),
            status: 'confirmed',
          }),
          createTestScene({
            brief: createTestSceneBrief({
              id: 'scene-2',
              sceneNumber: 2,
              title: 'The Confrontation',
            }),
            status: 'draft',
          }),
        ];

        render(<SceneList scenes={scenes} currentSceneId="scene-2" onSelectScene={mockSelect} />);

        await user.click(screen.getByText('The Approaching Darkness'));
        expect(mockSelect).toHaveBeenCalledWith('scene-1');
      });

      it('disables pending scenes ahead of current', () => {
        const scenes: Scene[] = [
          createTestScene({
            brief: createTestSceneBrief({ id: 'scene-1', sceneNumber: 1 }),
            status: 'draft',
          }),
          createTestScene({
            brief: createTestSceneBrief({
              id: 'scene-2',
              sceneNumber: 2,
              title: 'The Confrontation',
            }),
            status: 'pending',
          }),
        ];

        render(<SceneList scenes={scenes} currentSceneId="scene-1" onSelectScene={vi.fn()} />);

        const pendingButton = screen.getByText('The Confrontation').closest('button');
        expect(pendingButton).toBeDisabled();
      });
    });
  });

  // ===========================================================================
  // 3. Scene Navigation Tests
  // ===========================================================================

  describe('3. Scene Navigation', () => {
    describe('previous/next controls', () => {
      it('navigates to previous scene', async () => {
        const user = userEvent.setup();
        const mockPrevious = vi.fn();

        render(
          <SceneNavigation
            currentSceneNumber={2}
            totalScenes={4}
            canGoPrevious={true}
            canGoNext={true}
            onPrevious={mockPrevious}
            onNext={vi.fn()}
          />
        );

        await user.click(screen.getByRole('button', { name: /previous/i }));
        expect(mockPrevious).toHaveBeenCalled();
      });

      it('navigates to next scene', async () => {
        const user = userEvent.setup();
        const mockNext = vi.fn();

        render(
          <SceneNavigation
            currentSceneNumber={2}
            totalScenes={4}
            canGoPrevious={true}
            canGoNext={true}
            onPrevious={vi.fn()}
            onNext={mockNext}
          />
        );

        await user.click(screen.getByRole('button', { name: /next/i }));
        expect(mockNext).toHaveBeenCalled();
      });

      it('disables previous on first scene', () => {
        render(
          <SceneNavigation
            currentSceneNumber={1}
            totalScenes={4}
            canGoPrevious={false}
            canGoNext={true}
            onPrevious={vi.fn()}
            onNext={vi.fn()}
          />
        );

        expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
      });
    });

    describe('continue to NPCs', () => {
      it('shows continue button when all scenes confirmed', () => {
        render(
          <SceneNavigation
            currentSceneNumber={4}
            totalScenes={4}
            canGoPrevious={true}
            canGoNext={false}
            onPrevious={vi.fn()}
            onNext={vi.fn()}
            allScenesConfirmed={true}
            onContinueToNPCs={vi.fn()}
          />
        );

        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
      });

      it('calls onContinueToNPCs when clicked', async () => {
        const user = userEvent.setup();
        const mockContinue = vi.fn();

        render(
          <SceneNavigation
            currentSceneNumber={4}
            totalScenes={4}
            canGoPrevious={true}
            canGoNext={false}
            onPrevious={vi.fn()}
            onNext={vi.fn()}
            allScenesConfirmed={true}
            onContinueToNPCs={mockContinue}
          />
        );

        await user.click(screen.getByRole('button', { name: /continue/i }));
        expect(mockContinue).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // 4. Content Store Scene State Tests
  // ===========================================================================

  describe('4. Content Store Scene State', () => {
    describe('scene initialization', () => {
      it('initializes scenes from confirmed outline', () => {
        const outline = createTestOutline();

        // Set up outline first
        storeAction(() => {
          useContentStore.getState().setOutline(outline);
          useContentStore.getState().confirmOutline();
        });

        // Initialize scenes
        storeAction(() => {
          useContentStore.getState().initializeScenesFromOutline();
        });

        const state = useContentStore.getState();
        expect(state.scenes).toHaveLength(4);
        expect(state.currentSceneId).toBe(state.scenes[0].brief.id);
        expect(state.scenes[0].status).toBe('pending');
      });
    });

    describe('scene status management', () => {
      it('updates scene status to generating', () => {
        const outline = createTestOutline();

        storeAction(() => {
          useContentStore.getState().setOutline(outline);
          useContentStore.getState().confirmOutline();
          useContentStore.getState().initializeScenesFromOutline();
        });

        const scenes = useContentStore.getState().scenes;
        const sceneId = scenes[0].brief.id;

        storeAction(() => {
          useContentStore.getState().setSceneStatus(sceneId, 'generating');
        });

        const updatedScenes = useContentStore.getState().scenes;
        expect(updatedScenes[0].status).toBe('generating');
      });

      it('sets scene draft and updates status to draft', () => {
        const outline = createTestOutline();
        const draft = createTestSceneDraft();

        storeAction(() => {
          useContentStore.getState().setOutline(outline);
          useContentStore.getState().confirmOutline();
          useContentStore.getState().initializeScenesFromOutline();
        });

        const scenes = useContentStore.getState().scenes;
        const sceneId = scenes[0].brief.id;

        storeAction(() => {
          useContentStore.getState().setSceneDraft(sceneId, draft);
        });

        const updatedScenes = useContentStore.getState().scenes;
        expect(updatedScenes[0].status).toBe('draft');
        expect(updatedScenes[0].draft).toEqual(draft);
      });

      it('confirms scene and sets confirmedAt timestamp', () => {
        const outline = createTestOutline();
        const draft = createTestSceneDraft();

        storeAction(() => {
          useContentStore.getState().setOutline(outline);
          useContentStore.getState().confirmOutline();
          useContentStore.getState().initializeScenesFromOutline();
        });

        const scenes = useContentStore.getState().scenes;
        const sceneId = scenes[0].brief.id;

        storeAction(() => {
          useContentStore.getState().setSceneDraft(sceneId, draft);
          useContentStore.getState().confirmScene(sceneId);
        });

        const updatedScenes = useContentStore.getState().scenes;
        expect(updatedScenes[0].status).toBe('confirmed');
        expect(updatedScenes[0].confirmedAt).toBeDefined();
      });
    });

    describe('scene navigation in store', () => {
      it('navigates to next scene', () => {
        const outline = createTestOutline();

        storeAction(() => {
          useContentStore.getState().setOutline(outline);
          useContentStore.getState().confirmOutline();
          useContentStore.getState().initializeScenesFromOutline();
        });

        const initialSceneId = useContentStore.getState().currentSceneId;

        storeAction(() => {
          useContentStore.getState().navigateToNextScene();
        });

        const newSceneId = useContentStore.getState().currentSceneId;
        expect(newSceneId).not.toBe(initialSceneId);
      });

      it('navigates to previous scene', () => {
        const outline = createTestOutline();

        storeAction(() => {
          useContentStore.getState().setOutline(outline);
          useContentStore.getState().confirmOutline();
          useContentStore.getState().initializeScenesFromOutline();
          useContentStore.getState().navigateToNextScene();
        });

        const currentSceneId = useContentStore.getState().currentSceneId;

        storeAction(() => {
          useContentStore.getState().navigateToPreviousScene();
        });

        const newSceneId = useContentStore.getState().currentSceneId;
        expect(newSceneId).not.toBe(currentSceneId);
      });
    });

    describe('selectors', () => {
      it('selectCurrentScene returns the current scene', () => {
        const outline = createTestOutline();

        storeAction(() => {
          useContentStore.getState().setOutline(outline);
          useContentStore.getState().confirmOutline();
          useContentStore.getState().initializeScenesFromOutline();
        });

        const state = useContentStore.getState();
        const currentScene = selectCurrentScene(state);

        expect(currentScene).toBeDefined();
        expect(currentScene?.brief.sceneNumber).toBe(1);
      });

      it('selectConfirmedSceneCount tracks confirmed scenes', () => {
        const outline = createTestOutline();
        const draft = createTestSceneDraft();

        storeAction(() => {
          useContentStore.getState().setOutline(outline);
          useContentStore.getState().confirmOutline();
          useContentStore.getState().initializeScenesFromOutline();
        });

        let state = useContentStore.getState();
        expect(selectConfirmedSceneCount(state)).toBe(0);

        const scenes = state.scenes;
        const sceneId = scenes[0].brief.id;

        storeAction(() => {
          useContentStore.getState().setSceneDraft(sceneId, draft);
          useContentStore.getState().confirmScene(sceneId);
        });

        state = useContentStore.getState();
        expect(selectConfirmedSceneCount(state)).toBe(1);
      });

      it('selectAllScenesConfirmed returns true when all confirmed', () => {
        const outline = createTestOutline();
        const draft = createTestSceneDraft();

        storeAction(() => {
          useContentStore.getState().setOutline(outline);
          useContentStore.getState().confirmOutline();
          useContentStore.getState().initializeScenesFromOutline();
        });

        let state = useContentStore.getState();
        expect(selectAllScenesConfirmed(state)).toBe(false);

        // Confirm all scenes
        const scenes = state.scenes;
        scenes.forEach((scene) => {
          storeAction(() => {
            useContentStore
              .getState()
              .setSceneDraft(scene.brief.id, { ...draft, sceneId: scene.brief.id });
            useContentStore.getState().confirmScene(scene.brief.id);
          });
        });

        state = useContentStore.getState();
        expect(selectAllScenesConfirmed(state)).toBe(true);
      });

      it('selectCanProceedToNPCs returns true when all scenes confirmed', () => {
        const outline = createTestOutline();
        const draft = createTestSceneDraft();

        storeAction(() => {
          useContentStore.getState().setOutline(outline);
          useContentStore.getState().confirmOutline();
          useContentStore.getState().initializeScenesFromOutline();
        });

        let state = useContentStore.getState();
        expect(selectCanProceedToNPCs(state)).toBe(false);

        // Confirm all scenes
        const scenes = state.scenes;
        scenes.forEach((scene) => {
          storeAction(() => {
            useContentStore
              .getState()
              .setSceneDraft(scene.brief.id, { ...draft, sceneId: scene.brief.id });
            useContentStore.getState().confirmScene(scene.brief.id);
          });
        });

        state = useContentStore.getState();
        expect(selectCanProceedToNPCs(state)).toBe(true);
      });

      it('selectSceneNavigation returns correct navigation state', () => {
        const outline = createTestOutline();

        storeAction(() => {
          useContentStore.getState().setOutline(outline);
          useContentStore.getState().confirmOutline();
          useContentStore.getState().initializeScenesFromOutline();
        });

        const state = useContentStore.getState();
        const nav = selectSceneNavigation(state);

        expect(nav.currentIndex).toBe(0);
        expect(nav.canGoPrevious).toBe(false);
        expect(nav.canGoNext).toBe(false); // First scene is pending
      });
    });
  });

  // ===========================================================================
  // 5. Draft-Revise Workflow Tests
  // ===========================================================================

  describe('5. Draft-Revise Workflow', () => {
    describe('complete workflow', () => {
      it('supports multiple revision cycles', async () => {
        const user = userEvent.setup();
        const mockSubmit = vi.fn();
        const sceneBrief = createTestSceneBrief();
        let currentDraft = createTestSceneDraft();

        const { rerender } = render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={currentDraft}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={mockSubmit}
            onConfirmScene={vi.fn()}
          />
        );

        // First revision
        const input = screen.getByPlaceholderText(/feedback/i);
        await user.type(input, 'Add more tension');
        await user.click(screen.getByRole('button', { name: /revise/i }));

        expect(mockSubmit).toHaveBeenCalledWith('Add more tension');

        // Simulate receiving revised draft
        currentDraft = {
          ...currentDraft,
          introduction: 'Updated introduction with more tension...',
        };

        rerender(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={currentDraft}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={mockSubmit}
            onConfirmScene={vi.fn()}
          />
        );

        // Second revision
        await user.type(screen.getByPlaceholderText(/feedback/i), 'Even darker atmosphere');
        await user.click(screen.getByRole('button', { name: /revise/i }));

        expect(mockSubmit).toHaveBeenCalledWith('Even darker atmosphere');
      });

      it('tracks streaming content during generation', () => {
        const sceneBrief = createTestSceneBrief();

        const { rerender } = render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={null}
            isLoading={true}
            streamingContent="The ancient"
            onSubmitFeedback={vi.fn()}
            onConfirmScene={vi.fn()}
          />
        );

        expect(screen.getByText(/The ancient/)).toBeInTheDocument();

        rerender(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={null}
            isLoading={true}
            streamingContent="The ancient temple looms before you"
            onSubmitFeedback={vi.fn()}
            onConfirmScene={vi.fn()}
          />
        );

        expect(screen.getByText(/The ancient temple looms before you/)).toBeInTheDocument();
      });
    });

    describe('entity extraction display', () => {
      it('displays extracted NPCs for later compilation', () => {
        const sceneBrief = createTestSceneBrief();
        const sceneDraft = createTestSceneDraft({
          extractedEntities: {
            npcs: [
              { name: 'Village Elder', role: 'quest-giver', sceneId: 'scene-1' },
              { name: 'Mysterious Stranger', role: 'informant', sceneId: 'scene-1' },
            ],
            adversaries: [],
            items: [],
          },
        });

        render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={sceneDraft}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={vi.fn()}
            onConfirmScene={vi.fn()}
          />
        );

        expect(screen.getByText('Village Elder')).toBeInTheDocument();
        expect(screen.getByText('Mysterious Stranger')).toBeInTheDocument();
      });

      it('displays extracted adversaries for combat scenes', () => {
        const sceneBrief = createTestSceneBrief({ sceneType: 'combat' });
        const sceneDraft = createTestSceneDraft({
          combatNotes: 'Initiative and tactics',
          extractedEntities: {
            npcs: [],
            adversaries: [
              { name: 'Shadow Knight', type: 'standard', tier: 2, sceneId: 'scene-1' },
              { name: 'Skeleton Minion', type: 'minion', tier: 2, sceneId: 'scene-1' },
            ],
            items: [],
          },
        });

        render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={sceneDraft}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={vi.fn()}
            onConfirmScene={vi.fn()}
          />
        );

        expect(screen.getByText('Shadow Knight')).toBeInTheDocument();
        expect(screen.getByText('Skeleton Minion')).toBeInTheDocument();
      });

      it('displays extracted items for later reward selection', () => {
        const sceneBrief = createTestSceneBrief();
        const sceneDraft = createTestSceneDraft({
          extractedEntities: {
            npcs: [],
            adversaries: [],
            items: [
              { name: 'Ancient Sword', suggestedTier: 2, sceneId: 'scene-1' },
              { name: 'Healing Potion', suggestedTier: 1, sceneId: 'scene-1' },
            ],
          },
        });

        render(
          <SceneEditor
            sceneBrief={sceneBrief}
            sceneDraft={sceneDraft}
            isLoading={false}
            streamingContent={null}
            onSubmitFeedback={vi.fn()}
            onConfirmScene={vi.fn()}
          />
        );

        expect(screen.getByText('Ancient Sword')).toBeInTheDocument();
        expect(screen.getByText('Healing Potion')).toBeInTheDocument();
      });
    });
  });
});
