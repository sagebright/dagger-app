/**
 * OutlinePanel Component
 *
 * Main panel for outline generation phase.
 * Displays scene brief cards with ability to provide feedback and regenerate.
 * Fantasy-themed styling matching FramePanel.
 */

import { useState, useCallback } from 'react';
import { SceneBriefCard } from './SceneBriefCard';
import {
  useContentStore,
  selectHasOutline,
  selectIsOutlineConfirmed,
  selectCanProceedToScenes,
  selectSceneBriefs,
  selectOutlineTitle,
  selectOutlineStatus,
} from '../../stores/contentStore';

export interface OutlinePanelProps {
  /** Callback when user wants to generate/regenerate outline */
  onGenerateOutline: (feedback?: string) => void;
  /** Callback when user confirms outline and proceeds to scenes */
  onContinueToScenes: () => void;
  /** Callback when user wants to go back to frame selection */
  onBackToFrame: () => void;
  /** Callback when user wants to edit a specific scene */
  onEditScene?: (sceneId: string) => void;
  /** Frame name for display context */
  frameName?: string;
  /** Expected scene count from dials */
  expectedSceneCount?: number;
  /** Additional CSS classes */
  className?: string;
}

export function OutlinePanel({
  onGenerateOutline,
  onContinueToScenes,
  onBackToFrame,
  onEditScene,
  frameName,
  expectedSceneCount = 4,
  className = '',
}: OutlinePanelProps) {
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  // Store state
  const hasOutline = useContentStore(selectHasOutline);
  const isOutlineConfirmed = useContentStore(selectIsOutlineConfirmed);
  const canProceed = useContentStore(selectCanProceedToScenes);
  const sceneBriefs = useContentStore(selectSceneBriefs);
  const outlineTitle = useContentStore(selectOutlineTitle);
  const { loading, error } = useContentStore(selectOutlineStatus);
  const currentOutline = useContentStore((state) => state.currentOutline);

  // Store actions
  const confirmOutline = useContentStore((state) => state.confirmOutline);
  const clearOutline = useContentStore((state) => state.clearOutline);

  const handleToggleExpand = useCallback((sceneId: string) => {
    setExpandedSceneId((prev) => (prev === sceneId ? null : sceneId));
  }, []);

  const handleGenerate = () => {
    onGenerateOutline();
    setShowFeedbackInput(false);
    setFeedbackInput('');
  };

  const handleRegenerate = () => {
    setShowFeedbackInput(true);
  };

  const handleSubmitFeedback = () => {
    if (feedbackInput.trim()) {
      onGenerateOutline(feedbackInput.trim());
      setShowFeedbackInput(false);
      setFeedbackInput('');
    }
  };

  const handleCancelFeedback = () => {
    setShowFeedbackInput(false);
    setFeedbackInput('');
  };

  const handleConfirm = () => {
    confirmOutline();
  };

  const handleChange = () => {
    clearOutline();
    setExpandedSceneId(null);
  };

  const handleContinue = () => {
    if (canProceed) {
      onContinueToScenes();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gold-300 border-t-gold-600 rounded-full animate-spin" />
          <p className="mt-4 text-ink-600 dark:text-parchment-400">Generating outline...</p>
          {frameName && (
            <p className="mt-2 text-sm text-ink-500 dark:text-parchment-500">
              Based on <span className="font-medium">{frameName}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <p className="text-blood-600 dark:text-blood-400 font-medium">{error}</p>
          <div className="mt-4 flex gap-2 justify-center">
            <button
              type="button"
              onClick={handleGenerate}
              className="px-4 py-2 text-sm bg-gold-500 hover:bg-gold-400 text-ink-900 rounded-fantasy transition-colors"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onBackToFrame}
              className="px-4 py-2 text-sm bg-ink-100 hover:bg-ink-200 dark:bg-shadow-700 dark:hover:bg-shadow-600 rounded-fantasy transition-colors"
            >
              Back to Frame
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no outline yet
  if (!hasOutline) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-ink-200 dark:border-shadow-600">
          <h2 className="text-xl font-serif font-bold text-ink-800 dark:text-parchment-100">
            Generate Outline
          </h2>
          <p className="mt-1 text-sm text-ink-600 dark:text-parchment-400">
            Create scene briefs for your adventure
            {frameName && (
              <span>
                {' '}based on <span className="font-medium text-gold-700 dark:text-gold-400">{frameName}</span>
              </span>
            )}
          </p>
        </div>

        {/* Generate prompt */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-serif font-semibold text-ink-800 dark:text-parchment-100 mb-2">
              Ready to Create Your Outline
            </h3>
            <p className="text-sm text-ink-600 dark:text-parchment-400 mb-6">
              Generate {expectedSceneCount} scene briefs that will form the structure of your adventure.
              You can review and refine them before proceeding.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                className="
                  w-full py-3 px-4 rounded-fantasy border-2
                  bg-gold-500 border-gold-600 text-ink-900
                  font-serif font-semibold text-base
                  hover:bg-gold-400 hover:border-gold-500
                  dark:bg-gold-600 dark:border-gold-500 dark:text-ink-900
                  dark:hover:bg-gold-500 dark:hover:border-gold-400
                  shadow-gold-glow
                  transition-all duration-200
                "
              >
                Generate Outline
              </button>
              <button
                type="button"
                onClick={onBackToFrame}
                className="text-sm text-ink-500 hover:text-ink-700 dark:text-parchment-500 dark:hover:text-parchment-300 underline"
              >
                ← Back to Frame Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Outline exists - show scene briefs
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-ink-200 dark:border-shadow-600">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold text-ink-800 dark:text-parchment-100">
              {outlineTitle || 'Adventure Outline'}
            </h2>
            <p className="mt-1 text-sm text-ink-600 dark:text-parchment-400">
              {sceneBriefs.length} scene{sceneBriefs.length !== 1 ? 's' : ''} in this adventure
            </p>
          </div>
          {!isOutlineConfirmed && (
            <button
              type="button"
              onClick={handleRegenerate}
              className="
                px-3 py-1.5 text-sm
                bg-parchment-100 dark:bg-shadow-700
                text-ink-700 dark:text-parchment-300
                border border-ink-300 dark:border-shadow-500
                rounded-fantasy
                hover:bg-gold-100 hover:border-gold-400
                dark:hover:bg-gold-900/30 dark:hover:border-gold-600
                transition-colors
              "
            >
              Regenerate
            </button>
          )}
        </div>

        {/* Summary */}
        {currentOutline?.summary && (
          <p className="mt-3 text-sm text-ink-600 dark:text-parchment-400 italic">
            {currentOutline.summary}
          </p>
        )}
      </div>

      {/* Feedback input (shown when regenerating) */}
      {showFeedbackInput && (
        <div className="p-4 bg-gold-50 dark:bg-gold-900/20 border-b border-gold-200 dark:border-gold-800">
          <label
            htmlFor="feedback-input"
            className="block text-sm font-medium text-ink-700 dark:text-parchment-300 mb-2"
          >
            What would you like to change?
          </label>
          <textarea
            id="feedback-input"
            value={feedbackInput}
            onChange={(e) => setFeedbackInput(e.target.value)}
            placeholder="e.g., More combat scenes, add a puzzle element, make it darker..."
            rows={3}
            className="
              w-full px-3 py-2 rounded-fantasy
              bg-parchment-50 dark:bg-shadow-800
              border border-ink-300 dark:border-shadow-500
              text-ink-900 dark:text-parchment-100
              placeholder-ink-400 dark:placeholder-parchment-600
              focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400
              resize-none
            "
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleSubmitFeedback}
              disabled={!feedbackInput.trim()}
              className="
                px-4 py-2 text-sm
                bg-gold-500 text-ink-900 font-medium
                rounded-fantasy
                hover:bg-gold-400
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              Regenerate with Feedback
            </button>
            <button
              type="button"
              onClick={handleCancelFeedback}
              className="
                px-4 py-2 text-sm
                text-ink-600 dark:text-parchment-400
                hover:text-ink-800 dark:hover:text-parchment-200
                transition-colors
              "
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Scene briefs list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {sceneBriefs.map((scene) => (
            <SceneBriefCard
              key={scene.id}
              scene={scene}
              expanded={expandedSceneId === scene.id}
              onToggleExpand={handleToggleExpand}
              onEdit={isOutlineConfirmed ? undefined : onEditScene}
            />
          ))}
        </div>
      </div>

      {/* Action footer */}
      <div className="p-4 border-t border-ink-200 dark:border-shadow-600 bg-parchment-100 dark:bg-shadow-800">
        {isOutlineConfirmed ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-gold-600 dark:text-gold-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-gold-700 dark:text-gold-400">
                  Outline Confirmed
                </span>
              </div>
              <button
                type="button"
                onClick={handleChange}
                className="text-sm text-ink-500 hover:text-ink-700 dark:text-parchment-500 dark:hover:text-parchment-300 underline"
              >
                Change
              </button>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              className="
                w-full py-3 px-4 rounded-fantasy border-2
                bg-gold-500 border-gold-600 text-ink-900
                font-serif font-semibold text-base
                hover:bg-gold-400 hover:border-gold-500
                dark:bg-gold-600 dark:border-gold-500 dark:text-ink-900
                dark:hover:bg-gold-500 dark:hover:border-gold-400
                shadow-gold-glow
                transition-all duration-200
              "
            >
              Continue to Scene Writing →
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-600 dark:text-parchment-400 mb-3">
              Review the scenes above. Provide feedback to regenerate, or confirm to proceed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                className="
                  flex-1 py-3 px-4 rounded-fantasy border-2
                  bg-gold-500 border-gold-600 text-ink-900
                  font-serif font-semibold text-base
                  hover:bg-gold-400 hover:border-gold-500
                  dark:bg-gold-600 dark:border-gold-500 dark:text-ink-900
                  dark:hover:bg-gold-500 dark:hover:border-gold-400
                  transition-all duration-200
                "
              >
                Confirm Outline
              </button>
              <button
                type="button"
                onClick={onBackToFrame}
                className="
                  py-3 px-4 rounded-fantasy border-2
                  bg-parchment-100 border-ink-300 text-ink-700
                  dark:bg-shadow-700 dark:border-shadow-500 dark:text-parchment-300
                  hover:bg-ink-100 hover:border-ink-400
                  dark:hover:bg-shadow-600 dark:hover:border-shadow-400
                  transition-colors duration-200
                "
              >
                ← Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
