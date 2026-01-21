/**
 * FramePanel Component
 *
 * Main panel for frame selection phase.
 * Shows existing frames from Supabase with option to create custom.
 * Includes search/filter, frame cards, and selected frame details.
 * Shows name suggestion banner after frame confirmation if adventure is unnamed.
 * Fantasy-themed styling.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { DaggerheartFrame, SelectedFrame } from '@dagger-app/shared-types';
import { isCustomFrame } from '@dagger-app/shared-types';
import { FrameCard } from './FrameCard';
import { NameSuggestionBanner } from '../adventure';
import {
  useContentStore,
  selectHasSelectedFrame,
  selectIsFrameConfirmed,
  selectCanProceedToOutline,
} from '../../stores/contentStore';
import { useAdventureStore } from '../../stores/adventureStore';

export interface FramePanelProps {
  /** Callback when user wants to create custom frame (opens chat) */
  onCreateCustom: () => void;
  /** Callback when user confirms frame and proceeds to outline */
  onContinueToOutline: () => void;
  /** Additional CSS classes */
  className?: string;
}

/** Generates a suggested adventure name from frame name and themes */
function generateNameSuggestion(frameName: string, themes?: string[]): string {
  // Simple name generation based on frame and themes
  if (themes && themes.length > 0) {
    // Pick a random theme to incorporate
    const theme = themes[0];
    const themeWord = theme.charAt(0).toUpperCase() + theme.slice(1);
    return `The ${themeWord} of ${frameName}`;
  }
  return `Adventures in ${frameName}`;
}

export function FramePanel({
  onCreateCustom,
  onContinueToOutline,
  className = '',
}: FramePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFrameId, setExpandedFrameId] = useState<string | null>(null);
  const [showNameSuggestion, setShowNameSuggestion] = useState(false);
  const [nameSuggestionDismissed, setNameSuggestionDismissed] = useState(false);

  // Adventure store state
  const adventureName = useAdventureStore((state) => state.adventureName);
  const setAdventureName = useAdventureStore((state) => state.setAdventureName);

  // Store state
  const availableFrames = useContentStore((state) => state.availableFrames);
  const selectedFrame = useContentStore((state) => state.selectedFrame);
  const framesLoading = useContentStore((state) => state.framesLoading);
  const framesError = useContentStore((state) => state.framesError);
  const hasSelectedFrame = useContentStore(selectHasSelectedFrame);
  const isFrameConfirmed = useContentStore(selectIsFrameConfirmed);
  const canProceed = useContentStore(selectCanProceedToOutline);

  // Store actions
  const selectFrame = useContentStore((state) => state.selectFrame);
  const confirmFrame = useContentStore((state) => state.confirmFrame);
  const clearFrame = useContentStore((state) => state.clearFrame);
  const setAvailableFrames = useContentStore((state) => state.setAvailableFrames);
  const setFramesLoading = useContentStore((state) => state.setFramesLoading);
  const setFramesError = useContentStore((state) => state.setFramesError);

  // Fetch frames from backend on mount
  useEffect(() => {
    const fetchFrames = async () => {
      // Skip if already loading or frames are loaded
      if (framesLoading || availableFrames.length > 0) {
        return;
      }

      setFramesLoading(true);

      try {
        const response = await fetch('/api/content/frames');

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP error ${response.status}`);
        }

        const data = await response.json();
        setAvailableFrames(data.frames || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch frames';
        setFramesError(message);
      }
    };

    fetchFrames();
  }, [availableFrames.length, framesLoading, setAvailableFrames, setFramesLoading, setFramesError]);

  // Show name suggestion after frame confirmation if adventure is unnamed
  useEffect(() => {
    const isUnnamed = !adventureName || adventureName.trim() === '';
    if (isFrameConfirmed && isUnnamed && !nameSuggestionDismissed) {
      setShowNameSuggestion(true);
    } else {
      setShowNameSuggestion(false);
    }
  }, [isFrameConfirmed, adventureName, nameSuggestionDismissed]);

  // Generate suggested name based on selected frame
  const suggestedName = useMemo(() => {
    if (!selectedFrame) return '';
    return generateNameSuggestion(selectedFrame.name, selectedFrame.themes ?? undefined);
  }, [selectedFrame]);

  // Name suggestion handlers
  const handleAcceptName = useCallback((name: string) => {
    setAdventureName(name);
    setShowNameSuggestion(false);
  }, [setAdventureName]);

  const handleDismissNameSuggestion = useCallback(() => {
    setShowNameSuggestion(false);
    setNameSuggestionDismissed(true);
  }, []);

  // Filter frames by search query
  const filteredFrames = useMemo(() => {
    if (!searchQuery.trim()) return availableFrames;

    const query = searchQuery.toLowerCase();
    return availableFrames.filter(
      (frame) =>
        frame.name.toLowerCase().includes(query) ||
        frame.description.toLowerCase().includes(query) ||
        frame.themes?.some((theme) => theme.toLowerCase().includes(query))
    );
  }, [availableFrames, searchQuery]);

  const handleSelectFrame = (frame: DaggerheartFrame | SelectedFrame) => {
    selectFrame(frame);
    // Expand the selected frame to show details
    setExpandedFrameId(frame.id);
  };

  const handleConfirm = () => {
    confirmFrame();
  };

  const handleChange = () => {
    clearFrame();
    setExpandedFrameId(null);
  };

  const handleContinue = () => {
    if (canProceed) {
      onContinueToOutline();
    }
  };

  // Loading state
  if (framesLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gold-300 border-t-gold-600 rounded-full animate-spin" />
          <p className="mt-4 text-ink-600 dark:text-parchment-400">Loading frames...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (framesError) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <p className="text-blood-600 dark:text-blood-400 font-medium">{framesError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm bg-ink-100 hover:bg-ink-200 dark:bg-shadow-700 dark:hover:bg-shadow-600 rounded-fantasy transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-ink-200 dark:border-shadow-600">
        <h2 className="text-xl font-serif font-bold text-ink-800 dark:text-parchment-100">
          Select a Frame
        </h2>
        <p className="mt-1 text-sm text-ink-600 dark:text-parchment-400">
          Choose an existing adventure framework or create your own
        </p>
      </div>

      {/* Search and Create Custom */}
      <div className="p-4 border-b border-ink-200 dark:border-shadow-600">
        <div className="flex gap-3">
          {/* Search input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search frames..."
              aria-label="Search frames"
              className="
                w-full px-4 py-2 pl-10
                bg-parchment-50 dark:bg-shadow-800
                border border-ink-300 dark:border-shadow-500
                rounded-fantasy
                text-ink-900 dark:text-parchment-100
                placeholder-ink-400 dark:placeholder-parchment-600
                focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400
                transition-all duration-200
              "
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-parchment-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Create Custom button */}
          <button
            type="button"
            onClick={onCreateCustom}
            className="
              px-4 py-2
              bg-gold-500 hover:bg-gold-400
              dark:bg-gold-600 dark:hover:bg-gold-500
              text-ink-900 font-medium
              rounded-fantasy border-2 border-gold-600 dark:border-gold-500
              transition-colors duration-200
              whitespace-nowrap
            "
          >
            + Create Custom
          </button>
        </div>
      </div>

      {/* Frame list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredFrames.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-ink-500 dark:text-parchment-500">
              {searchQuery ? 'No frames match your search' : 'No frames available'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredFrames.map((frame) => (
              <FrameCard
                key={frame.id}
                frame={frame}
                isSelected={selectedFrame?.id === frame.id}
                onSelect={handleSelectFrame}
                expanded={expandedFrameId === frame.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Name suggestion banner (shown after frame confirmation for unnamed adventures) */}
      {showNameSuggestion && suggestedName && (
        <div className="p-4 border-t border-ink-200 dark:border-shadow-600">
          <NameSuggestionBanner
            suggestedName={suggestedName}
            onAccept={handleAcceptName}
            onDismiss={handleDismissNameSuggestion}
          />
        </div>
      )}

      {/* Selected frame actions */}
      {hasSelectedFrame && (
        <div className="p-4 border-t border-ink-200 dark:border-shadow-600 bg-parchment-100 dark:bg-shadow-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm text-ink-500 dark:text-parchment-500">Selected: </span>
              <span className="font-serif font-semibold text-ink-800 dark:text-parchment-200">
                {selectedFrame?.name}
              </span>
              {selectedFrame && isCustomFrame(selectedFrame) && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gold-200 text-gold-800 rounded dark:bg-gold-800 dark:text-gold-200">
                  Custom
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleChange}
              className="text-sm text-ink-500 hover:text-ink-700 dark:text-parchment-500 dark:hover:text-parchment-300 underline"
            >
              Change
            </button>
          </div>

          {isFrameConfirmed ? (
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
              Continue to Outline →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              className="
                w-full py-3 px-4 rounded-fantasy border-2
                bg-parchment-100 border-gold-400 text-gold-700
                font-serif font-semibold text-base
                hover:bg-gold-50 hover:border-gold-500
                dark:bg-shadow-700 dark:border-gold-500 dark:text-gold-400
                dark:hover:bg-shadow-600 dark:hover:border-gold-400
                transition-all duration-200
              "
            >
              Confirm Frame
            </button>
          )}
        </div>
      )}
    </div>
  );
}
