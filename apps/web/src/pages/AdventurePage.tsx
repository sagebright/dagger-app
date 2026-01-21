/**
 * AdventurePage Component
 *
 * Main orchestration page for the adventure creation workflow.
 * Coordinates all Phase 2 (chat/dials) and Phase 3 (content) components
 * with their stores and WebSocket bridge.
 *
 * Phases:
 * - setup: Adventure name input
 * - dial-tuning: DialTuningPanel (full-page dial selection)
 * - frame: FramePanel
 * - outline: OutlinePanel
 * - scenes: SceneEditor + SceneList + SceneNavigation
 * - npcs: NPCList
 * - adversaries/items/echoes/complete: Coming soon
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { CompiledNPC } from '@dagger-app/shared-types';

// Adventure components
import { PhaseProgressBar, PhaseNavigation, SessionRecoveryModal } from '@/components/adventure';

// Services and persistence
import { loadAdventure, deleteAdventure } from '@/services/adventureService';
import { restoreFromSnapshot } from '@/stores/persistence';

// Phase 2 components
import { DialTuningPanel } from '@/components/dials';

// Phase 3 components
import {
  FramePanel,
  OutlinePanel,
  SceneEditor,
  SceneList,
  SceneNavigation,
  NPCList,
  ExportPanel,
} from '@/components/content';

// Services
import { exportAdventure, type ExportData } from '@/services/adventureService';

// Stores
import {
  useAdventureStore,
  selectHasActiveSession,
  selectCanGoBack,
} from '@/stores/adventureStore';
import { useChatStore } from '@/stores/chatStore';
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
  onSkip: () => void;
}

function SetupPhase({ onStart, onSkip }: SetupPhaseProps) {
  const [adventureName, setAdventureName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adventureName.trim();
    onStart(trimmed);
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-ink-800 dark:text-parchment-100 mb-2">
            Create Your Adventure
          </h1>
          <p className="text-ink-600 dark:text-parchment-400">
            Give your Daggerheart adventure a name to begin, or skip to name it later
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <label
            htmlFor="adventure-name"
            className="block text-sm font-medium text-ink-700 dark:text-parchment-300 mb-2"
          >
            Adventure Name
            <span className="text-ink-400 dark:text-parchment-500 font-normal ml-1">
              (optional)
            </span>
          </label>
          <input
            id="adventure-name"
            type="text"
            value={adventureName}
            onChange={(e) => {
              setAdventureName(e.target.value);
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
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleSkip}
              className="
                flex-1 py-3 px-4 rounded-fantasy border-2
                bg-parchment-100 border-ink-300 text-ink-600
                font-serif font-semibold text-base
                hover:bg-parchment-200 hover:border-ink-400
                dark:bg-shadow-700 dark:border-shadow-500 dark:text-parchment-300
                dark:hover:bg-shadow-600 dark:hover:border-shadow-400
                transition-all duration-200
              "
            >
              Skip for now
            </button>
            <button
              type="submit"
              className="
                flex-1 py-3 px-4 rounded-fantasy border-2
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
          </div>
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
  const resetAdventure = useAdventureStore((state) => state.reset);

  // =============================================================================
  // Session Recovery State
  // =============================================================================

  type RecoveryState = 'checking' | 'show-modal' | 'none';
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('checking');

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem('dagger-adventure-storage');
    if (!stored) {
      setRecoveryState('none');
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const storedSessionId = parsed?.state?.sessionId;

      if (!storedSessionId) {
        setRecoveryState('none');
        return;
      }

      // Found sessionId in localStorage - show recovery modal
      setRecoveryState('show-modal');
    } catch {
      // Invalid JSON in localStorage
      setRecoveryState('none');
    }
  }, []);

  // Recovery handlers
  const handleResume = useCallback(async () => {
    if (!sessionId) {
      setRecoveryState('none');
      return;
    }

    const response = await loadAdventure(sessionId);
    if (response.exists && response.adventure) {
      restoreFromSnapshot(response.adventure);
    }
    setRecoveryState('none');
  }, [sessionId]);

  const handleStartFresh = useCallback(async () => {
    if (sessionId) {
      await deleteAdventure(sessionId);
    }
    // Clear all stores
    resetAdventure();
    useDialsStore.getState().resetDials();
    useContentStore.getState().resetContent();
    useChatStore.getState().clearMessages();
    setRecoveryState('none');
  }, [sessionId, resetAdventure]);

  // Dials store state - use individual selectors to avoid infinite loops
  const partySize = useDialsStore((state) => state.partySize);
  const partyTier = useDialsStore((state) => state.partyTier);
  const sceneCount = useDialsStore((state) => state.sceneCount);
  const sessionLength = useDialsStore((state) => state.sessionLength);
  const tone = useDialsStore((state) => state.tone);
  const pillarBalance = useDialsStore((state) => state.pillarBalance);
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

  // Assemble dials state for DialTuningPanel - memoize to prevent infinite loops
  const dialsState: DialsState = useMemo(() => ({
    partySize,
    partyTier,
    sceneCount,
    sessionLength,
    tone,
    pillarBalance,
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
    pillarBalance,
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
  const currentOutline = useContentStore((state) => state.currentOutline);

  // Export-related content store state
  const selectedAdversaries = useContentStore((state) => state.selectedAdversaries);
  const selectedItems = useContentStore((state) => state.selectedItems);
  const echoes = useContentStore((state) => state.echoes);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // =============================================================================
  // Phase Transition Handlers
  // =============================================================================

  const handleStartAdventure = useCallback((name: string) => {
    initSession(name);
  }, [initSession]);

  const handleSkipNaming = useCallback(() => {
    initSession('');
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
  // Content Phase Handlers
  // =============================================================================

  const handleCreateCustomFrame = useCallback(() => {
    // Switch back to dial-tuning to use chat for custom frame creation
    setPhase('dial-tuning');
  }, [setPhase]);

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
  // Export Handler
  // =============================================================================

  const handleExport = useCallback(async (exportSessionId: string, data: ExportData) => {
    setIsExporting(true);
    setExportError(null);

    try {
      const result = await exportAdventure(exportSessionId, data);

      // Trigger browser download
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Failed to export adventure'
      );
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Build export data from current state
  const exportData: ExportData = useMemo(() => ({
    adventureName: adventureName ?? 'Untitled Adventure',
    frame: selectedFrame ? {
      name: selectedFrame.name,
      description: selectedFrame.description,
      themes: selectedFrame.themes,
      lore: selectedFrame.lore,
    } : undefined,
    outline: currentOutline ? {
      title: currentOutline.title,
      briefs: currentOutline.scenes,
    } : undefined,
    scenes: scenes.map((s) => ({
      id: s.brief.id,
      title: s.brief.title,
      content: s.draft ?? '',
    })),
    npcs: npcs.map((n) => ({
      id: n.id,
      name: n.name,
      role: n.role,
      description: n.description,
      personality: n.personality,
      motivations: n.motivations,
    })),
    adversaries: selectedAdversaries.map((a) => ({
      id: a.adversary.id,
      name: a.adversary.name,
      tier: a.adversary.tier,
      type: a.adversary.type,
    })),
    items: selectedItems.map((i) => ({
      id: i.item.data.id,
      name: i.item.data.name,
      tier: 'tier' in i.item.data ? i.item.data.tier : null,
      category: i.item.category,
    })),
    echoes: echoes.map((e) => ({
      id: e.id,
      category: e.category,
      content: e.content,
    })),
  }), [adventureName, selectedFrame, currentOutline, scenes, npcs, selectedAdversaries, selectedItems, echoes]);

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
      return <SetupPhase onStart={handleStartAdventure} onSkip={handleSkipNaming} />;
    }

    switch (currentPhase) {
      case 'setup':
        return <SetupPhase onStart={handleStartAdventure} onSkip={handleSkipNaming} />;

      case 'dial-tuning':
        return (
          <DialTuningPanel
            dials={dialsState}
            onContinue={handleContinue}
            canContinue={requiredDialsComplete}
          />
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
        return (
          <ExportPanel
            sessionId={sessionId ?? ''}
            adventureName={adventureName ?? 'Untitled Adventure'}
            partySize={partySize}
            partyTier={partyTier}
            sceneCount={scenes.length}
            npcCount={npcs.length}
            adversaryCount={selectedAdversaries.length}
            itemCount={selectedItems.length}
            echoCount={echoes.length}
            exportData={exportData}
            onExport={handleExport}
            isExporting={isExporting}
            error={exportError}
            className="flex-1"
          />
        );

      default:
        return <ComingSoonPhase phaseName="Unknown Phase" />;
    }
  };

  // =============================================================================
  // Render
  // =============================================================================

  // Show loading state while checking for existing session
  if (recoveryState === 'checking') {
    return (
      <div className="min-h-screen flex flex-col bg-parchment-100 dark:bg-shadow-900 transition-colors duration-200">
        <header className="flex items-center justify-between px-4 py-3 bg-parchment-50 dark:bg-shadow-800 border-b border-ink-200 dark:border-shadow-600">
          <Link to="/" className="font-serif text-xl font-bold text-ink-800 dark:text-parchment-100">
            Dagger-Gen
          </Link>
          <DarkModeToggle />
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin" />
            </div>
            <p className="text-ink-600 dark:text-parchment-400">
              Loading...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Determine if we should show the phase navigation (not for setup or scenes which have their own)
  const showPhaseNavigation =
    hasActiveSession &&
    currentPhase !== 'setup' &&
    currentPhase !== 'scenes' && // Scenes have their own SceneNavigation
    currentPhase !== 'dial-tuning'; // Dial tuning uses DialTuningPanel continue button

  return (
    <div className="min-h-screen flex flex-col bg-parchment-100 dark:bg-shadow-900 transition-colors duration-200">
      {/* Session recovery modal */}
      {recoveryState === 'show-modal' && sessionId && (
        <SessionRecoveryModal
          sessionId={sessionId}
          onResume={handleResume}
          onStartFresh={handleStartFresh}
        />
      )}

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
