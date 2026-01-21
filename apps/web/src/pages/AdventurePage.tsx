/**
 * AdventurePage Component
 *
 * Main orchestration page for the adventure creation workflow.
 * Coordinates all Phase 2 (chat/dials) and Phase 3 (content) components
 * with their stores and WebSocket bridge.
 *
 * Phases:
 * - setup: Adventure name input
 * - dial-tuning: ChatContainer + DialSummaryPanel
 * - frame: FramePanel
 * - outline: OutlinePanel
 * - scenes: SceneEditor + SceneList + SceneNavigation
 * - npcs: NPCList
 * - adversaries/items/echoes/complete: Coming soon
 */

import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { DialId, CompiledNPC, PartyTier, SessionLength, ThemeOption } from '@dagger-app/shared-types';
import { THEME_OPTIONS } from '@dagger-app/shared-types';

// Adventure components
import { PhaseProgressBar, PhaseNavigation } from '@/components/adventure';

// Phase 2 components
import { ChatContainer } from '@/components/chat';
import {
  DialSummaryPanel,
  NumberStepper,
  TierSelect,
  SessionLengthSelect,
  SpectrumSlider,
  MultiSelectChips,
} from '@/components/dials';

// Phase 3 components
import {
  FramePanel,
  OutlinePanel,
  SceneEditor,
  SceneList,
  SceneNavigation,
  NPCList,
} from '@/components/content';

// Stores
import {
  useAdventureStore,
  selectHasActiveSession,
  selectCanGoBack,
} from '@/stores/adventureStore';
import {
  useDialsStore,
  selectRequiredDialsComplete,
} from '@/stores/dialsStore';
import type { DialsState } from '@/stores/dialsStore';
import {
  useContentStore,
  selectCanProceedToOutline,
  selectCanProceedToScenes,
  selectCanProceedToNPCs,
  selectAllScenesConfirmed,
  selectNPCs,
  selectConfirmedNPCIds,
  selectCanProceedToAdversaries,
} from '@/stores/contentStore';

// =============================================================================
// Dark Mode Toggle (shared component)
// =============================================================================

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="btn-secondary text-sm"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}

// =============================================================================
// Setup Phase Component
// =============================================================================

interface SetupPhaseProps {
  onStart: (name: string) => void;
}

function SetupPhase({ onStart }: SetupPhaseProps) {
  const [adventureName, setAdventureName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adventureName.trim();
    if (!trimmed) {
      setError('Please enter an adventure name');
      return;
    }
    if (trimmed.length < 3) {
      setError('Adventure name must be at least 3 characters');
      return;
    }
    onStart(trimmed);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-ink-800 dark:text-parchment-100 mb-2">
            Create Your Adventure
          </h1>
          <p className="text-ink-600 dark:text-parchment-400">
            Give your Daggerheart adventure a name to begin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <label
            htmlFor="adventure-name"
            className="block text-sm font-medium text-ink-700 dark:text-parchment-300 mb-2"
          >
            Adventure Name
          </label>
          <input
            id="adventure-name"
            type="text"
            value={adventureName}
            onChange={(e) => {
              setAdventureName(e.target.value);
              setError(null);
            }}
            placeholder="e.g., The Hollow Vigil"
            autoFocus
            className="
              w-full px-4 py-3 rounded-fantasy border
              bg-parchment-50 dark:bg-shadow-800
              border-ink-300 dark:border-shadow-500
              text-ink-900 dark:text-parchment-100
              placeholder-ink-400 dark:placeholder-parchment-600
              focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400
              transition-all
            "
          />
          {error && (
            <p className="mt-2 text-sm text-blood-600 dark:text-blood-400">{error}</p>
          )}
          <button
            type="submit"
            className="
              w-full mt-4 py-3 px-4 rounded-fantasy border-2
              bg-gold-500 border-gold-600 text-ink-900
              font-serif font-semibold text-base
              hover:bg-gold-400 hover:border-gold-500
              dark:bg-gold-600 dark:border-gold-500
              dark:hover:bg-gold-500 dark:hover:border-gold-400
              shadow-gold-glow
              transition-all duration-200
            "
          >
            Begin Adventure
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-ink-500 hover:text-ink-700 dark:text-parchment-500 dark:hover:text-parchment-300 underline"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Coming Soon Phase Component
// =============================================================================

interface ComingSoonPhaseProps {
  phaseName: string;
}

function ComingSoonPhase({ phaseName }: ComingSoonPhaseProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-100 dark:bg-gold-900/40 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gold-600 dark:text-gold-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h3 className="text-lg font-serif font-semibold text-ink-800 dark:text-parchment-100 mb-2">
          {phaseName}
        </h3>
        <p className="text-sm text-ink-600 dark:text-parchment-400">
          This phase is coming soon
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Main AdventurePage Component
// =============================================================================

export function AdventurePage() {
  // Adventure store state
  const sessionId = useAdventureStore((state) => state.sessionId);
  const adventureName = useAdventureStore((state) => state.adventureName);
  const currentPhase = useAdventureStore((state) => state.currentPhase);
  const hasActiveSession = useAdventureStore(selectHasActiveSession);
  const canGoBack = useAdventureStore(selectCanGoBack);

  // Adventure store actions
  const initSession = useAdventureStore((state) => state.initSession);
  const setPhase = useAdventureStore((state) => state.setPhase);
  const goToPreviousPhase = useAdventureStore((state) => state.goToPreviousPhase);

  // Dials store state - use individual selectors to avoid infinite loops
  const partySize = useDialsStore((state) => state.partySize);
  const partyTier = useDialsStore((state) => state.partyTier);
  const sceneCount = useDialsStore((state) => state.sceneCount);
  const sessionLength = useDialsStore((state) => state.sessionLength);
  const tone = useDialsStore((state) => state.tone);
  const combatExplorationBalance = useDialsStore((state) => state.combatExplorationBalance);
  const npcDensity = useDialsStore((state) => state.npcDensity);
  const lethality = useDialsStore((state) => state.lethality);
  const emotionalRegister = useDialsStore((state) => state.emotionalRegister);
  const themes = useDialsStore((state) => state.themes);
  const confirmedDials = useDialsStore((state) => state.confirmedDials);
  const setDial = useDialsStore((state) => state.setDial);
  const confirmDial = useDialsStore((state) => state.confirmDial);
  const unconfirmDial = useDialsStore((state) => state.unconfirmDial);
  const resetDials = useDialsStore((state) => state.resetDials);
  const resetDial = useDialsStore((state) => state.resetDial);
  const addTheme = useDialsStore((state) => state.addTheme);
  const removeTheme = useDialsStore((state) => state.removeTheme);
  const requiredDialsComplete = useDialsStore(selectRequiredDialsComplete);

  // Assemble dials state for DialSummaryPanel - memoize to prevent infinite loops
  const dialsState: DialsState = useMemo(() => ({
    partySize,
    partyTier,
    sceneCount,
    sessionLength,
    tone,
    combatExplorationBalance,
    npcDensity,
    lethality,
    emotionalRegister,
    themes,
    confirmedDials,
    setDial,
    confirmDial,
    unconfirmDial,
    resetDials,
    resetDial,
    addTheme,
    removeTheme,
  }), [
    partySize,
    partyTier,
    sceneCount,
    sessionLength,
    tone,
    combatExplorationBalance,
    npcDensity,
    lethality,
    emotionalRegister,
    themes,
    confirmedDials,
    setDial,
    confirmDial,
    unconfirmDial,
    resetDials,
    resetDial,
    addTheme,
    removeTheme,
  ]);

  // Content store state
  const canProceedToOutline = useContentStore(selectCanProceedToOutline);
  const canProceedToScenes = useContentStore(selectCanProceedToScenes);
  const canProceedToNPCs = useContentStore(selectCanProceedToNPCs);
  const canProceedToAdversaries = useContentStore(selectCanProceedToAdversaries);

  // Scene-specific state
  const scenes = useContentStore((state) => state.scenes);
  const currentSceneId = useContentStore((state) => state.currentSceneId);
  // Derive currentScene in component to avoid selector returning new object
  const currentScene = useMemo(() => {
    return scenes.find((s) => s.brief.id === currentSceneId) ?? null;
  }, [scenes, currentSceneId]);
  // Derive scene navigation in component to avoid selector returning new object
  const sceneNavState = useMemo(() => {
    const currentIndex = scenes.findIndex((s) => s.brief.id === currentSceneId);
    if (currentIndex === -1) {
      return { canGoPrevious: false, canGoNext: false, currentIndex: -1 };
    }
    const canGoPrevious = currentIndex > 0;
    const canGoNext =
      currentIndex < scenes.length - 1 &&
      (scenes[currentIndex].status === 'confirmed' ||
        scenes[currentIndex].status === 'draft');
    return { canGoPrevious, canGoNext, currentIndex };
  }, [scenes, currentSceneId]);
  const allScenesConfirmed = useContentStore(selectAllScenesConfirmed);
  const sceneLoading = useContentStore((state) => state.sceneLoading);
  const sceneError = useContentStore((state) => state.sceneError);
  const sceneStreamingContent = useContentStore((state) => state.sceneStreamingContent);

  // Scene actions
  const setCurrentScene = useContentStore((state) => state.setCurrentScene);
  const navigateToNextScene = useContentStore((state) => state.navigateToNextScene);
  const navigateToPreviousScene = useContentStore((state) => state.navigateToPreviousScene);
  const confirmScene = useContentStore((state) => state.confirmScene);
  const initializeScenesFromOutline = useContentStore((state) => state.initializeScenesFromOutline);

  // NPC-specific state
  const npcs = useContentStore(selectNPCs);
  const confirmedNPCIds = useContentStore(selectConfirmedNPCIds);
  // Select individual primitives to avoid infinite re-renders from object selectors
  const npcLoading = useContentStore((state) => state.npcLoading);
  const npcError = useContentStore((state) => state.npcError);
  const npcStreamingContent = useContentStore((state) => state.npcStreamingContent);
  const refiningNPCId = useContentStore((state) => state.refiningNPCId);

  // NPC actions
  const confirmNPC = useContentStore((state) => state.confirmNPC);
  const confirmAllNPCs = useContentStore((state) => state.confirmAllNPCs);
  const setRefiningNPCId = useContentStore((state) => state.setRefiningNPCId);

  // Frame name for outline context
  const selectedFrame = useContentStore((state) => state.selectedFrame);

  // Local state for editing dial in chat
  const [editingDialId, setEditingDialId] = useState<DialId | undefined>();

  // =============================================================================
  // Phase Transition Handlers
  // =============================================================================

  const handleStartAdventure = useCallback((name: string) => {
    initSession(name);
  }, [initSession]);

  const handleGoBack = useCallback(() => {
    goToPreviousPhase();
  }, [goToPreviousPhase]);

  const handleContinue = useCallback(() => {
    switch (currentPhase) {
      case 'setup':
        // Handled by SetupPhase component
        break;
      case 'dial-tuning':
        if (requiredDialsComplete) {
          setPhase('frame');
        }
        break;
      case 'frame':
        if (canProceedToOutline) {
          setPhase('outline');
        }
        break;
      case 'outline':
        if (canProceedToScenes) {
          initializeScenesFromOutline();
          setPhase('scenes');
        }
        break;
      case 'scenes':
        if (canProceedToNPCs) {
          setPhase('npcs');
        }
        break;
      case 'npcs':
        if (canProceedToAdversaries) {
          setPhase('adversaries');
        }
        break;
      case 'adversaries':
        setPhase('items');
        break;
      case 'items':
        setPhase('echoes');
        break;
      case 'echoes':
        setPhase('complete');
        break;
      default:
        break;
    }
  }, [
    currentPhase,
    requiredDialsComplete,
    canProceedToOutline,
    canProceedToScenes,
    canProceedToNPCs,
    canProceedToAdversaries,
    setPhase,
    initializeScenesFromOutline,
  ]);

  // =============================================================================
  // Dial Handlers
  // =============================================================================

  const handleEditDial = useCallback((dialId: DialId) => {
    setEditingDialId(dialId);
  }, []);

  const handleConfirmDial = useCallback((dialId: DialId) => {
    dialsState.confirmDial(dialId);
    setEditingDialId(undefined);
  }, [dialsState]);

  // =============================================================================
  // Dial Edit Widget Renderer
  // =============================================================================

  const renderEditWidget = useCallback((dialId: DialId): ReactNode => {
    switch (dialId) {
      case 'partySize':
        return (
          <NumberStepper
            value={partySize}
            min={2}
            max={6}
            onChange={(v) => setDial('partySize', v)}
          />
        );
      case 'partyTier':
        return (
          <TierSelect
            value={partyTier as PartyTier}
            onChange={(v) => setDial('partyTier', v)}
          />
        );
      case 'sceneCount':
        return (
          <NumberStepper
            value={sceneCount}
            min={3}
            max={6}
            onChange={(v) => setDial('sceneCount', v)}
          />
        );
      case 'sessionLength':
        return (
          <SessionLengthSelect
            value={sessionLength as SessionLength}
            onChange={(v) => setDial('sessionLength', v)}
          />
        );
      case 'tone':
        return (
          <SpectrumSlider
            value={tone}
            endpoints={{ low: 'Grim', high: 'Whimsical' }}
            onChange={(v) => setDial('tone', v)}
          />
        );
      case 'combatExplorationBalance':
        return (
          <SpectrumSlider
            value={combatExplorationBalance}
            endpoints={{ low: 'Combat', high: 'Exploration' }}
            onChange={(v) => setDial('combatExplorationBalance', v)}
          />
        );
      case 'npcDensity':
        return (
          <SpectrumSlider
            value={npcDensity}
            endpoints={{ low: 'Sparse', high: 'Rich' }}
            onChange={(v) => setDial('npcDensity', v)}
          />
        );
      case 'lethality':
        return (
          <SpectrumSlider
            value={lethality}
            endpoints={{ low: 'Forgiving', high: 'Deadly' }}
            onChange={(v) => setDial('lethality', v)}
          />
        );
      case 'emotionalRegister':
        return (
          <SpectrumSlider
            value={emotionalRegister}
            endpoints={{ low: 'Light', high: 'Heavy' }}
            onChange={(v) => setDial('emotionalRegister', v)}
          />
        );
      case 'themes':
        return (
          <MultiSelectChips
            options={THEME_OPTIONS.map((t) => ({ id: t.id, label: t.label }))}
            selected={themes}
            maxSelections={3}
            onChange={(selected: string[]) => {
              // Handle theme changes - compare with current and add/remove
              const currentSet = new Set<string>(themes);
              const newSet = new Set<string>(selected);

              // Remove themes that are no longer selected
              themes.forEach((theme) => {
                if (!newSet.has(theme)) {
                  removeTheme(theme);
                }
              });

              // Add new themes (cast is safe because options come from THEME_OPTIONS)
              selected.forEach((theme) => {
                if (!currentSet.has(theme)) {
                  addTheme(theme as ThemeOption);
                }
              });
            }}
          />
        );
      default:
        return null;
    }
  }, [
    partySize,
    partyTier,
    sceneCount,
    sessionLength,
    tone,
    combatExplorationBalance,
    npcDensity,
    lethality,
    emotionalRegister,
    themes,
    setDial,
    addTheme,
    removeTheme,
  ]);

  // =============================================================================
  // Content Phase Handlers
  // =============================================================================

  const handleCreateCustomFrame = useCallback(() => {
    // Switch back to dial-tuning to use chat for custom frame creation
    // In a full implementation, this would trigger specific chat prompts
    console.log('[AdventurePage] Create custom frame requested');
  }, []);

  const handleGenerateOutline = useCallback((_feedback?: string) => {
    // In full implementation, this would trigger MCP tool invocation
    console.log('[AdventurePage] Generate outline with feedback:', _feedback);
  }, []);

  const handleSceneFeedback = useCallback((_feedback: string) => {
    // In full implementation, this would trigger MCP tool for scene revision
    console.log('[AdventurePage] Scene feedback:', _feedback);
  }, []);

  const handleConfirmScene = useCallback(() => {
    if (currentSceneId) {
      confirmScene(currentSceneId);
    }
  }, [currentSceneId, confirmScene]);

  const handleSceneRetry = useCallback(() => {
    // In full implementation, this would retry scene generation
    console.log('[AdventurePage] Retry scene generation');
  }, []);

  const handleNPCRefine = useCallback((npcId: string) => {
    setRefiningNPCId(npcId);
  }, [setRefiningNPCId]);

  const handleNPCConfirm = useCallback((npcId: string) => {
    confirmNPC(npcId);
  }, [confirmNPC]);

  const handleNPCConfirmAll = useCallback(() => {
    confirmAllNPCs();
  }, [confirmAllNPCs]);

  const handleNPCRetry = useCallback(() => {
    // In full implementation, this would retry NPC compilation
    console.log('[AdventurePage] Retry NPC compilation');
  }, []);

  // =============================================================================
  // Determine if continue is allowed
  // =============================================================================

  const canContinue = (() => {
    switch (currentPhase) {
      case 'setup':
        return false; // Setup uses its own button
      case 'dial-tuning':
        return requiredDialsComplete;
      case 'frame':
        return canProceedToOutline;
      case 'outline':
        return canProceedToScenes;
      case 'scenes':
        return canProceedToNPCs;
      case 'npcs':
        return canProceedToAdversaries;
      case 'adversaries':
      case 'items':
      case 'echoes':
        return true; // Placeholder - actual validation needed
      case 'complete':
        return false;
      default:
        return false;
    }
  })();

  // =============================================================================
  // Render Phase-Specific Content
  // =============================================================================

  const renderPhaseContent = () => {
    // If no session and not in setup, show setup
    if (!hasActiveSession && currentPhase !== 'setup') {
      return <SetupPhase onStart={handleStartAdventure} />;
    }

    switch (currentPhase) {
      case 'setup':
        return <SetupPhase onStart={handleStartAdventure} />;

      case 'dial-tuning':
        return (
          <div className="flex-1 flex min-h-0">
            {/* Chat panel - 60% */}
            <div className="w-[60%] border-r border-ink-200 dark:border-shadow-600">
              <ChatContainer
                sessionId={sessionId ?? 'default'}
                className="h-full"
              />
            </div>
            {/* Dial summary - 40% */}
            <div className="w-[40%] overflow-y-auto">
              <DialSummaryPanel
                dials={dialsState}
                onEditDial={handleEditDial}
                onConfirmDial={handleConfirmDial}
                onContinue={handleContinue}
                editingDialId={editingDialId}
                renderEditWidget={renderEditWidget}
              />
            </div>
          </div>
        );

      case 'frame':
        return (
          <FramePanel
            onCreateCustom={handleCreateCustomFrame}
            onContinueToOutline={handleContinue}
            className="flex-1"
          />
        );

      case 'outline':
        return (
          <OutlinePanel
            onGenerateOutline={handleGenerateOutline}
            onContinueToScenes={handleContinue}
            onBackToFrame={handleGoBack}
            frameName={selectedFrame?.name}
            expectedSceneCount={sceneCount}
            className="flex-1"
          />
        );

      case 'scenes':
        if (!currentScene) {
          return (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-ink-500 dark:text-parchment-500">
                No scenes available. Please generate an outline first.
              </p>
            </div>
          );
        }
        return (
          <div className="flex-1 flex min-h-0">
            {/* Scene list sidebar */}
            <div className="w-64 border-r border-ink-200 dark:border-shadow-600 overflow-y-auto">
              <SceneList
                scenes={scenes}
                currentSceneId={currentSceneId ?? ''}
                onSelectScene={setCurrentScene}
                className="p-4"
              />
            </div>
            {/* Scene editor */}
            <div className="flex-1 flex flex-col min-h-0">
              <SceneEditor
                sceneBrief={currentScene.brief}
                sceneDraft={currentScene.draft}
                isLoading={sceneLoading}
                streamingContent={sceneStreamingContent}
                onSubmitFeedback={handleSceneFeedback}
                onConfirmScene={handleConfirmScene}
                isConfirmed={currentScene.status === 'confirmed'}
                error={sceneError ?? undefined}
                onRetry={handleSceneRetry}
                className="flex-1 overflow-y-auto"
              />
              <SceneNavigation
                currentSceneNumber={sceneNavState.currentIndex + 1}
                totalScenes={scenes.length}
                canGoPrevious={sceneNavState.canGoPrevious}
                canGoNext={sceneNavState.canGoNext}
                onPrevious={navigateToPreviousScene}
                onNext={navigateToNextScene}
                isLoading={sceneLoading}
                allScenesConfirmed={allScenesConfirmed}
                onContinueToNPCs={handleContinue}
              />
            </div>
          </div>
        );

      case 'npcs':
        return (
          <NPCList
            npcs={npcs as CompiledNPC[]}
            onRefine={handleNPCRefine}
            onConfirm={handleNPCConfirm}
            onConfirmAll={handleNPCConfirmAll}
            onProceed={handleContinue}
            confirmedNPCIds={confirmedNPCIds}
            isLoading={npcLoading}
            streamingContent={npcStreamingContent}
            refiningNPCId={refiningNPCId}
            error={npcError}
            onRetry={handleNPCRetry}
            className="flex-1"
          />
        );

      case 'adversaries':
        return <ComingSoonPhase phaseName="Adversaries" />;

      case 'items':
        return <ComingSoonPhase phaseName="Items & Rewards" />;

      case 'echoes':
        return <ComingSoonPhase phaseName="Echoes & GM Tools" />;

      case 'complete':
        return <ComingSoonPhase phaseName="Export Adventure" />;

      default:
        return <ComingSoonPhase phaseName="Unknown Phase" />;
    }
  };

  // =============================================================================
  // Render
  // =============================================================================

  // Determine if we should show the phase navigation (not for setup or scenes which have their own)
  const showPhaseNavigation =
    hasActiveSession &&
    currentPhase !== 'setup' &&
    currentPhase !== 'scenes' && // Scenes have their own SceneNavigation
    currentPhase !== 'dial-tuning'; // Dial tuning uses DialSummaryPanel continue button

  return (
    <div className="min-h-screen flex flex-col bg-parchment-100 dark:bg-shadow-900 transition-colors duration-200">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-parchment-50 dark:bg-shadow-800 border-b border-ink-200 dark:border-shadow-600">
        <Link to="/" className="font-serif text-xl font-bold text-ink-800 dark:text-parchment-100">
          Dagger-Gen
        </Link>
        <DarkModeToggle />
      </header>

      {/* Progress bar (show when session is active) */}
      {hasActiveSession && (
        <PhaseProgressBar
          currentPhase={currentPhase}
          adventureName={adventureName}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0">
        {renderPhaseContent()}
      </main>

      {/* Phase navigation (conditional) */}
      {showPhaseNavigation && (
        <PhaseNavigation
          currentPhase={currentPhase}
          canGoBack={canGoBack}
          canContinue={canContinue}
          onBack={handleGoBack}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
