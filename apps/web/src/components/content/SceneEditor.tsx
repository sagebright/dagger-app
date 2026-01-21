/**
 * SceneEditor Component
 *
 * Main editor for individual scene content with:
 * - Streaming content display during generation
 * - Full scene draft display with collapsible sections
 * - Feedback input for draft-revise workflow
 * - Entity extraction display (NPCs, adversaries, items)
 * Fantasy-themed styling consistent with OutlinePanel.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SceneBrief, SceneDraft } from '@dagger-app/shared-types';

// =============================================================================
// Props
// =============================================================================

export interface SceneEditorProps {
  /** The scene brief from the outline */
  sceneBrief: SceneBrief;
  /** The generated scene draft (null if not yet generated) */
  sceneDraft: SceneDraft | null;
  /** Whether scene is currently being generated */
  isLoading: boolean;
  /** Streaming content during generation */
  streamingContent: string | null;
  /** Callback when user submits feedback for revision */
  onSubmitFeedback: (feedback: string) => void;
  /** Callback when user confirms the scene */
  onConfirmScene: () => void;
  /** Whether the scene is confirmed */
  isConfirmed?: boolean;
  /** Error message if generation failed */
  error?: string;
  /** Callback for retry on error */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function SceneEditor({
  sceneBrief,
  sceneDraft,
  isLoading,
  streamingContent,
  onSubmitFeedback,
  onConfirmScene,
  isConfirmed = false,
  error,
  onRetry,
  className = '',
}: SceneEditorProps) {
  const [feedbackInput, setFeedbackInput] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['keyMoments', 'extracted'])
  );
  const feedbackInputRef = useRef<HTMLInputElement>(null);

  // Focus feedback input when draft completes
  useEffect(() => {
    if (sceneDraft && !isLoading && !isConfirmed && feedbackInputRef.current) {
      feedbackInputRef.current.focus();
    }
  }, [sceneDraft, isLoading, isConfirmed]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const handleSubmitFeedback = useCallback(() => {
    const trimmed = feedbackInput.trim();
    if (trimmed) {
      onSubmitFeedback(trimmed);
      setFeedbackInput('');
    }
  }, [feedbackInput, onSubmitFeedback]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmitFeedback();
      }
    },
    [handleSubmitFeedback]
  );

  // Error state
  if (error) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <SceneHeader sceneBrief={sceneBrief} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-blood-600 dark:text-blood-400 font-medium mb-4">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 text-sm bg-gold-500 hover:bg-gold-400 text-ink-900 rounded-fantasy transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading/streaming state
  if (isLoading || (!sceneDraft && !error)) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <SceneHeader sceneBrief={sceneBrief} />
        <div className="flex-1 overflow-y-auto p-4">
          <div role="status" className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 border-3 border-gold-300 border-t-gold-600 rounded-full animate-spin" />
            <span className="text-ink-600 dark:text-parchment-400">
              {streamingContent ? 'Generating scene...' : 'Generating scene draft...'}
            </span>
          </div>
          {streamingContent && (
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-ink-700 dark:text-parchment-300 whitespace-pre-wrap">
                {streamingContent}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Draft display - sceneDraft is guaranteed to exist at this point
  // due to the early return in loading state check above
  if (!sceneDraft) {
    return null;
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <SceneHeader sceneBrief={sceneBrief} isConfirmed={isConfirmed} />

      {/* Scene content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Introduction */}
        <section className="bg-parchment-50 dark:bg-shadow-800 rounded-fantasy p-4 border border-ink-200 dark:border-shadow-600">
          <h3 className="text-sm font-semibold text-ink-600 dark:text-parchment-400 uppercase tracking-wide mb-2">
            Introduction
          </h3>
          <p className="text-ink-800 dark:text-parchment-200">{sceneDraft.introduction}</p>
        </section>

        {/* Key Moments */}
        <CollapsibleSection
          title="Key Moments"
          isExpanded={expandedSections.has('keyMoments')}
          onToggle={() => toggleSection('keyMoments')}
          count={sceneDraft.keyMoments.length}
        >
          <div className="space-y-3">
            {sceneDraft.keyMoments.map((moment, index) => (
              <div
                key={index}
                className="bg-parchment-100 dark:bg-shadow-700 rounded-fantasy p-3 border-l-4 border-gold-500"
              >
                <h4 className="font-medium text-ink-800 dark:text-parchment-100">
                  {moment.title}
                </h4>
                <p className="text-sm text-ink-600 dark:text-parchment-400 mt-1">
                  {moment.description}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Resolution */}
        <section className="bg-parchment-50 dark:bg-shadow-800 rounded-fantasy p-4 border border-ink-200 dark:border-shadow-600">
          <h3 className="text-sm font-semibold text-ink-600 dark:text-parchment-400 uppercase tracking-wide mb-2">
            Resolution
          </h3>
          <p className="text-ink-800 dark:text-parchment-200">{sceneDraft.resolution}</p>
        </section>

        {/* Tier Guidance */}
        <section className="bg-gold-50 dark:bg-gold-900/20 rounded-fantasy p-4 border border-gold-200 dark:border-gold-800">
          <h3 className="text-sm font-semibold text-gold-700 dark:text-gold-400 uppercase tracking-wide mb-2">
            GM Guidance
          </h3>
          <p className="text-ink-700 dark:text-parchment-300">{sceneDraft.tierGuidance}</p>
        </section>

        {/* Scene-type specific content */}
        {sceneDraft.environmentDetails && (
          <section className="bg-parchment-50 dark:bg-shadow-800 rounded-fantasy p-4 border border-ink-200 dark:border-shadow-600">
            <h3 className="text-sm font-semibold text-ink-600 dark:text-parchment-400 uppercase tracking-wide mb-2">
              Environment
            </h3>
            <p className="text-ink-800 dark:text-parchment-200">{sceneDraft.environmentDetails}</p>
          </section>
        )}

        {sceneDraft.discoveryOpportunities && sceneDraft.discoveryOpportunities.length > 0 && (
          <section className="bg-parchment-50 dark:bg-shadow-800 rounded-fantasy p-4 border border-ink-200 dark:border-shadow-600">
            <h3 className="text-sm font-semibold text-ink-600 dark:text-parchment-400 uppercase tracking-wide mb-2">
              Discovery Opportunities
            </h3>
            <ul className="list-disc list-inside text-ink-800 dark:text-parchment-200 space-y-1">
              {sceneDraft.discoveryOpportunities.map((discovery, i) => (
                <li key={i}>{discovery}</li>
              ))}
            </ul>
          </section>
        )}

        {sceneDraft.combatNotes && (
          <section className="bg-blood-50 dark:bg-blood-900/20 rounded-fantasy p-4 border border-blood-200 dark:border-blood-800">
            <h3 className="text-sm font-semibold text-blood-700 dark:text-blood-400 uppercase tracking-wide mb-2">
              Combat Notes
            </h3>
            <p className="text-ink-700 dark:text-parchment-300">{sceneDraft.combatNotes}</p>
          </section>
        )}

        {sceneDraft.socialChallenges && (
          <section className="bg-parchment-50 dark:bg-shadow-800 rounded-fantasy p-4 border border-ink-200 dark:border-shadow-600">
            <h3 className="text-sm font-semibold text-ink-600 dark:text-parchment-400 uppercase tracking-wide mb-2">
              Social Challenges
            </h3>
            <p className="text-ink-800 dark:text-parchment-200">{sceneDraft.socialChallenges}</p>
          </section>
        )}

        {sceneDraft.puzzleDetails && (
          <section className="bg-parchment-50 dark:bg-shadow-800 rounded-fantasy p-4 border border-ink-200 dark:border-shadow-600">
            <h3 className="text-sm font-semibold text-ink-600 dark:text-parchment-400 uppercase tracking-wide mb-2">
              Puzzle Details
            </h3>
            <p className="text-ink-800 dark:text-parchment-200">{sceneDraft.puzzleDetails}</p>
          </section>
        )}

        {sceneDraft.revelationContent && (
          <section className="bg-parchment-50 dark:bg-shadow-800 rounded-fantasy p-4 border border-ink-200 dark:border-shadow-600">
            <h3 className="text-sm font-semibold text-ink-600 dark:text-parchment-400 uppercase tracking-wide mb-2">
              Revelation Content
            </h3>
            <p className="text-ink-800 dark:text-parchment-200">{sceneDraft.revelationContent}</p>
          </section>
        )}

        {/* Extracted Entities */}
        <CollapsibleSection
          title="Extracted Entities"
          isExpanded={expandedSections.has('extracted')}
          onToggle={() => toggleSection('extracted')}
          count={
            sceneDraft.extractedEntities.npcs.length +
            sceneDraft.extractedEntities.adversaries.length +
            sceneDraft.extractedEntities.items.length
          }
        >
          <div className="space-y-4">
            {/* NPCs */}
            {sceneDraft.extractedEntities.npcs.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-700 dark:text-parchment-300 mb-2">
                  NPCs
                </h4>
                <div className="space-y-2">
                  {sceneDraft.extractedEntities.npcs.map((npc, i) => (
                    <div
                      key={i}
                      className="bg-parchment-100 dark:bg-shadow-700 rounded px-3 py-2"
                    >
                      <span className="font-medium text-ink-800 dark:text-parchment-100">
                        {npc.name}
                      </span>
                      <span className="text-ink-500 dark:text-parchment-500 ml-2">
                        ({npc.role})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Adversaries */}
            {sceneDraft.extractedEntities.adversaries.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-blood-700 dark:text-blood-400 mb-2">
                  Adversaries
                </h4>
                <div className="space-y-2">
                  {sceneDraft.extractedEntities.adversaries.map((adv, i) => (
                    <div
                      key={i}
                      className="bg-blood-50 dark:bg-blood-900/20 rounded px-3 py-2 border border-blood-200 dark:border-blood-800"
                    >
                      <span className="font-medium text-ink-800 dark:text-parchment-100">
                        {adv.name}
                      </span>
                      <span className="text-blood-600 dark:text-blood-400 ml-2">
                        ({adv.type}, Tier {adv.tier})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            {sceneDraft.extractedEntities.items.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gold-700 dark:text-gold-400 mb-2">
                  Items
                </h4>
                <div className="space-y-2">
                  {sceneDraft.extractedEntities.items.map((item, i) => (
                    <div
                      key={i}
                      className="bg-gold-50 dark:bg-gold-900/20 rounded px-3 py-2 border border-gold-200 dark:border-gold-800"
                    >
                      <span className="font-medium text-ink-800 dark:text-parchment-100">
                        {item.name}
                      </span>
                      <span className="text-gold-600 dark:text-gold-400 ml-2">
                        (Tier {item.suggestedTier})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* Footer with feedback/confirm */}
      <div className="p-4 border-t border-ink-200 dark:border-shadow-600 bg-parchment-100 dark:bg-shadow-800">
        {isConfirmed ? (
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
              Scene Confirmed
            </span>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <label htmlFor="scene-feedback" className="sr-only">
                Provide feedback for revision
              </label>
              <input
                ref={feedbackInputRef}
                id="scene-feedback"
                type="text"
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Provide feedback to revise this scene..."
                className="
                  flex-1 px-3 py-2 rounded-fantasy
                  bg-parchment-50 dark:bg-shadow-700
                  border border-ink-300 dark:border-shadow-500
                  text-ink-900 dark:text-parchment-100
                  placeholder-ink-400 dark:placeholder-parchment-600
                  focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400
                  disabled:opacity-50
                "
              />
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={!feedbackInput.trim() || isLoading}
                className="
                  px-4 py-2 text-sm font-medium
                  bg-parchment-200 dark:bg-shadow-600
                  text-ink-700 dark:text-parchment-300
                  border border-ink-300 dark:border-shadow-500
                  rounded-fantasy
                  hover:bg-gold-100 hover:border-gold-400
                  dark:hover:bg-gold-900/30 dark:hover:border-gold-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                Revise
              </button>
            </div>
            <button
              type="button"
              onClick={onConfirmScene}
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
              Confirm Scene
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface SceneHeaderProps {
  sceneBrief: SceneBrief;
  isConfirmed?: boolean;
}

function SceneHeader({ sceneBrief, isConfirmed }: SceneHeaderProps) {
  return (
    <div className="p-4 border-b border-ink-200 dark:border-shadow-600">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-medium bg-gold-100 dark:bg-gold-900/40 text-gold-700 dark:text-gold-400 rounded">
              Scene {sceneBrief.sceneNumber}
            </span>
            {sceneBrief.sceneType && (
              <span className="px-2 py-0.5 text-xs font-medium bg-ink-100 dark:bg-shadow-700 text-ink-600 dark:text-parchment-400 rounded capitalize">
                {sceneBrief.sceneType}
              </span>
            )}
          </div>
          <h2 className="text-xl font-serif font-bold text-ink-800 dark:text-parchment-100">
            {sceneBrief.title}
          </h2>
        </div>
        {isConfirmed && (
          <span className="px-2 py-1 text-xs font-medium bg-gold-100 dark:bg-gold-900/40 text-gold-700 dark:text-gold-400 rounded-full">
            Confirmed
          </span>
        )}
      </div>
      {sceneBrief.location && (
        <p className="mt-1 text-sm text-ink-500 dark:text-parchment-500">
          Location: {sceneBrief.location}
        </p>
      )}
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  count?: number;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  count,
  children,
}: CollapsibleSectionProps) {
  return (
    <section className="bg-parchment-50 dark:bg-shadow-800 rounded-fantasy border border-ink-200 dark:border-shadow-600 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="
          w-full flex items-center justify-between p-4
          text-left hover:bg-parchment-100 dark:hover:bg-shadow-700
          transition-colors
        "
      >
        <h3 className="text-sm font-semibold text-ink-600 dark:text-parchment-400 uppercase tracking-wide">
          {title}
          {count !== undefined && count > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-gold-100 dark:bg-gold-900/40 text-gold-700 dark:text-gold-400 rounded">
              {count}
            </span>
          )}
        </h3>
        <svg
          className={`w-5 h-5 text-ink-400 dark:text-parchment-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && <div className="p-4 pt-0">{children}</div>}
    </section>
  );
}
