/**
 * SceneBriefCard Component
 *
 * Displays a single scene brief from the adventure outline.
 * Shows scene number, title, description, key elements, and optional details.
 * Fantasy-themed styling with scene type color coding.
 */

import type { SceneBrief } from '@dagger-app/shared-types';

export interface SceneBriefCardProps {
  /** The scene brief to display */
  scene: SceneBrief;
  /** Whether this scene card is expanded to show full details */
  expanded?: boolean;
  /** Callback when scene card is clicked */
  onToggleExpand?: (sceneId: string) => void;
  /** Callback when user wants to edit this scene */
  onEdit?: (sceneId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get color classes based on scene type
 */
function getSceneTypeColors(sceneType: SceneBrief['sceneType']): {
  bg: string;
  text: string;
  badge: string;
  border: string;
} {
  switch (sceneType) {
    case 'combat':
      return {
        bg: 'bg-blood-50 dark:bg-blood-900/30',
        text: 'text-blood-700 dark:text-blood-300',
        badge: 'bg-blood-100 text-blood-700 dark:bg-blood-900/50 dark:text-blood-300',
        border: 'border-blood-200 dark:border-blood-800',
      };
    case 'exploration':
      return {
        bg: 'bg-gold-50 dark:bg-gold-900/30',
        text: 'text-gold-700 dark:text-gold-300',
        badge: 'bg-gold-100 text-gold-700 dark:bg-gold-900/50 dark:text-gold-300',
        border: 'border-gold-200 dark:border-gold-700',
      };
    case 'social':
      return {
        bg: 'bg-parchment-100 dark:bg-shadow-700',
        text: 'text-ink-700 dark:text-parchment-300',
        badge: 'bg-parchment-200 text-ink-700 dark:bg-shadow-600 dark:text-parchment-300',
        border: 'border-ink-200 dark:border-shadow-500',
      };
    case 'puzzle':
      return {
        bg: 'bg-gold-50/50 dark:bg-gold-900/20',
        text: 'text-gold-800 dark:text-gold-200',
        badge: 'bg-gold-200 text-gold-800 dark:bg-gold-800/50 dark:text-gold-200',
        border: 'border-gold-300 dark:border-gold-700',
      };
    case 'revelation':
      return {
        bg: 'bg-shadow-50 dark:bg-shadow-800',
        text: 'text-shadow-800 dark:text-parchment-200',
        badge: 'bg-shadow-200 text-shadow-800 dark:bg-shadow-700 dark:text-parchment-200',
        border: 'border-shadow-300 dark:border-shadow-600',
      };
    case 'mixed':
    default:
      return {
        bg: 'bg-parchment-50 dark:bg-shadow-800',
        text: 'text-ink-700 dark:text-parchment-300',
        badge: 'bg-ink-100 text-ink-700 dark:bg-shadow-700 dark:text-parchment-300',
        border: 'border-ink-200 dark:border-shadow-600',
      };
  }
}

/**
 * Get scene type display label
 */
function getSceneTypeLabel(sceneType: SceneBrief['sceneType']): string {
  const labels: Record<NonNullable<SceneBrief['sceneType']>, string> = {
    combat: 'Combat',
    exploration: 'Exploration',
    social: 'Social',
    puzzle: 'Puzzle',
    revelation: 'Revelation',
    mixed: 'Mixed',
  };
  return labels[sceneType || 'mixed'] || 'Scene';
}

export function SceneBriefCard({
  scene,
  expanded = false,
  onToggleExpand,
  onEdit,
  className = '',
}: SceneBriefCardProps) {
  const colors = getSceneTypeColors(scene.sceneType);

  const handleClick = () => {
    onToggleExpand?.(scene.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(scene.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-expanded={expanded}
      aria-label={`Scene ${scene.sceneNumber}: ${scene.title}`}
      className={`
        relative flex flex-col p-4 rounded-fantasy border-2 cursor-pointer
        transition-all duration-200
        ${colors.bg} ${colors.border}
        hover:shadow-md hover:border-gold-400
        focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2
        dark:focus:ring-offset-shadow-900
        ${expanded ? 'shadow-md' : ''}
        ${className}
      `}
    >
      {/* Scene number badge */}
      <div
        className={`
          absolute -top-3 left-4 px-3 py-0.5 rounded-full
          text-xs font-semibold
          ${colors.badge}
        `}
      >
        Scene {scene.sceneNumber}
      </div>

      {/* Header with title and scene type */}
      <div className="flex items-start justify-between mt-2">
        <h3 className={`font-serif font-bold text-lg ${colors.text}`}>
          {scene.title}
        </h3>
        <span
          className={`
            px-2 py-0.5 text-xs font-medium rounded
            ${colors.badge}
          `}
        >
          {getSceneTypeLabel(scene.sceneType)}
        </span>
      </div>

      {/* Description */}
      <p className={`mt-2 text-sm ${colors.text} line-clamp-2`}>
        {scene.description}
      </p>

      {/* Key elements (always shown, but limited when collapsed) */}
      {scene.keyElements.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {scene.keyElements.slice(0, expanded ? undefined : 2).map((element, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs bg-parchment-100 text-ink-600 rounded dark:bg-shadow-700 dark:text-parchment-400"
            >
              {element}
            </span>
          ))}
          {!expanded && scene.keyElements.length > 2 && (
            <span className="px-2 py-0.5 text-xs text-ink-400 dark:text-parchment-500">
              +{scene.keyElements.length - 2} more
            </span>
          )}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-ink-200 dark:border-shadow-600 space-y-3">
          {/* Location */}
          {scene.location && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-parchment-500 mb-1">
                Location
              </h4>
              <p className="text-sm text-ink-700 dark:text-parchment-300">
                {scene.location}
              </p>
            </div>
          )}

          {/* Characters */}
          {scene.characters && scene.characters.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-parchment-500 mb-1">
                Characters
              </h4>
              <div className="flex flex-wrap gap-1">
                {scene.characters.map((character, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 text-xs bg-ink-100 text-ink-700 rounded dark:bg-shadow-700 dark:text-parchment-300"
                  >
                    {character}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* All key elements */}
          {scene.keyElements.length > 2 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-parchment-500 mb-1">
                Key Elements
              </h4>
              <ul className="list-disc list-inside text-sm text-ink-700 dark:text-parchment-300 space-y-1">
                {scene.keyElements.map((element, index) => (
                  <li key={index}>{element}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Edit button */}
          {onEdit && (
            <button
              type="button"
              onClick={handleEdit}
              className="
                w-full mt-2 py-2 px-4 rounded-fantasy
                text-sm font-medium
                bg-parchment-100 text-ink-700 border border-ink-300
                hover:bg-gold-100 hover:border-gold-400 hover:text-gold-800
                dark:bg-shadow-700 dark:text-parchment-300 dark:border-shadow-500
                dark:hover:bg-gold-900/30 dark:hover:border-gold-600 dark:hover:text-gold-300
                transition-colors duration-200
              "
            >
              Edit Scene Brief
            </button>
          )}
        </div>
      )}

      {/* Expand/collapse indicator */}
      <div className="absolute bottom-2 right-2 text-ink-400 dark:text-parchment-500">
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
