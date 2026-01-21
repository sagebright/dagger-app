/**
 * EchoGenerator Component (Phase 4.3)
 *
 * Main UI for generating and managing GM creativity echoes.
 * Provides category tabs, generation controls, and echo list.
 */

import { useCallback, useMemo } from 'react';
import type { Echo, EchoCategory } from '@dagger-app/shared-types';
import { EchoCard } from './EchoCard';

// =============================================================================
// Types
// =============================================================================

export interface EchoGeneratorProps {
  /** All generated echoes */
  echoes: Echo[];
  /** Currently active category tab */
  activeCategory: EchoCategory;
  /** Callback when category tab changes */
  onCategoryChange: (category: EchoCategory) => void;
  /** Callback to generate new echoes */
  onGenerate: () => void;
  /** Callback when user confirms a single echo */
  onConfirm: (echoId: string) => void;
  /** Callback to confirm all echoes */
  onConfirmAll: () => void;
  /** Callback when user wants to edit an echo */
  onEdit: (echoId: string) => void;
  /** Callback when user requests echo regeneration */
  onRegenerate: (echoId: string) => void;
  /** Loading state during generation */
  isLoading: boolean;
  /** Streaming content during generation */
  streamingContent: string | null;
  /** Error message */
  error?: string | null;
}

// =============================================================================
// Constants
// =============================================================================

const ALL_CATEGORIES: EchoCategory[] = [
  'complications',
  'rumors',
  'discoveries',
  'intrusions',
  'wonders',
];

const CATEGORY_DESCRIPTIONS: Record<EchoCategory, string> = {
  complications: 'Obstacles and challenges that arise during play',
  rumors: 'Information and gossip the party might overhear',
  discoveries: 'Hidden truths and secrets waiting to be found',
  intrusions: 'Unexpected events that interrupt the action',
  wonders: 'Moments of awe and magical wonder',
};

// =============================================================================
// Component
// =============================================================================

export function EchoGenerator({
  echoes,
  activeCategory,
  onCategoryChange,
  onGenerate,
  onConfirm,
  onConfirmAll,
  onEdit,
  onRegenerate,
  isLoading,
  streamingContent,
  error,
}: EchoGeneratorProps) {
  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<EchoCategory, number> = {
      complications: 0,
      rumors: 0,
      discoveries: 0,
      intrusions: 0,
      wonders: 0,
    };
    echoes.forEach((echo) => {
      counts[echo.category]++;
    });
    return counts;
  }, [echoes]);

  // Filter echoes for active category
  const activeEchoes = useMemo(
    () => echoes.filter((e) => e.category === activeCategory),
    [echoes, activeCategory]
  );

  // Check if all echoes are confirmed
  const allConfirmed = useMemo(
    () => echoes.length > 0 && echoes.every((e) => e.isConfirmed),
    [echoes]
  );

  // Total and confirmed counts
  const totalCount = echoes.length;
  const confirmedCount = echoes.filter((e) => e.isConfirmed).length;

  // Keyboard navigation for tabs
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % ALL_CATEGORIES.length;
        onCategoryChange(ALL_CATEGORIES[nextIndex]);
      } else if (e.key === 'ArrowLeft') {
        const prevIndex = (currentIndex - 1 + ALL_CATEGORIES.length) % ALL_CATEGORIES.length;
        onCategoryChange(ALL_CATEGORIES[prevIndex]);
      }
    },
    [onCategoryChange]
  );

  return (
    <div className="flex flex-col h-full bg-parchment-50 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">GM Creativity Echoes</h2>
          <p className="text-sm text-ink-600">
            {totalCount} total, {confirmedCount} confirmed
          </p>
        </div>
        <div className="flex gap-2">
          {echoes.length > 0 && (
            <button
              type="button"
              onClick={onConfirmAll}
              disabled={isLoading || allConfirmed}
              className="
                px-4 py-2 text-sm font-medium rounded
                border border-parchment-300 text-ink-700
                hover:bg-parchment-100
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              Confirm All
            </button>
          )}
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading}
            className="
              px-4 py-2 text-sm font-medium rounded
              bg-gold-500 text-white
              hover:bg-gold-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            Generate Echoes
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div role="alert" className="mb-4 p-3 bg-blood-100 border border-blood-300 rounded-lg text-blood-700">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={onGenerate}
              className="px-3 py-1 text-sm font-medium bg-blood-200 rounded hover:bg-blood-300 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div
        role="tablist"
        aria-label="Echo categories"
        className="flex gap-1 mb-4 border-b border-parchment-300"
      >
        {ALL_CATEGORIES.map((category, index) => (
          <button
            key={category}
            role="tab"
            aria-selected={activeCategory === category}
            aria-controls={`tabpanel-${category}`}
            id={`tab-${category}`}
            tabIndex={activeCategory === category ? 0 : -1}
            onClick={() => onCategoryChange(category)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              px-3 py-2 text-sm font-medium rounded-t-lg
              transition-colors
              ${
                activeCategory === category
                  ? 'bg-white border-x border-t border-parchment-300 text-ink-900 -mb-px'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-parchment-100'
              }
            `}
          >
            <span className="capitalize">{category}</span>
            <span className="ml-1 text-xs text-ink-500">({categoryCounts[category]})</span>
          </button>
        ))}
      </div>

      {/* Loading / Streaming */}
      {isLoading && (
        <div className="mb-4 p-4 bg-white border border-parchment-300 rounded-lg">
          <div className="flex items-center gap-3">
            <span role="status" className="animate-spin h-5 w-5 border-2 border-gold-500 border-t-transparent rounded-full" />
            <span className="text-ink-700">Generating echoes...</span>
          </div>
          {streamingContent && (
            <p className="mt-2 text-sm text-ink-600 whitespace-pre-wrap">{streamingContent}</p>
          )}
        </div>
      )}

      {/* Tab panel with echoes */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeCategory}`}
        aria-labelledby={`tab-${activeCategory}`}
        className="flex-1 overflow-y-auto"
      >
        {activeEchoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <p className="text-ink-600 mb-2">No echoes generated for {activeCategory} yet.</p>
            <p className="text-sm text-ink-500">
              {CATEGORY_DESCRIPTIONS[activeCategory]}
            </p>
            <p className="text-sm text-ink-500 mt-4">
              Generate some echoes to get started!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {activeEchoes.map((echo) => (
              <EchoCard
                key={echo.id}
                echo={echo}
                onConfirm={onConfirm}
                onEdit={onEdit}
                onRegenerate={onRegenerate}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
