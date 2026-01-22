/**
 * StepThemes Component
 *
 * Step 3 of the custom frame wizard.
 * Theme selection using multi-select chips.
 * Fantasy-themed styling.
 */

import { useId } from 'react';

/** Available theme options */
const THEME_OPTIONS = [
  { id: 'redemption', label: 'Redemption' },
  { id: 'sacrifice', label: 'Sacrifice' },
  { id: 'identity', label: 'Identity' },
  { id: 'power-corruption', label: 'Power & Corruption' },
  { id: 'found-family', label: 'Found Family' },
  { id: 'legacy', label: 'Legacy' },
  { id: 'survival', label: 'Survival' },
  { id: 'justice', label: 'Justice' },
  { id: 'nature-vs-civilization', label: 'Nature vs Civilization' },
  { id: 'forbidden-knowledge', label: 'Forbidden Knowledge' },
];

/** Maximum themes allowed */
const MAX_THEMES = 3;

export interface StepThemesProps {
  /** Currently selected themes */
  themes: string[];
  /** Callback when themes change */
  onThemesChange: (value: string[]) => void;
  /** Validation error */
  error?: string;
  /** Additional CSS classes */
  className?: string;
}

export function StepThemes({
  themes,
  onThemesChange,
  error,
  className = '',
}: StepThemesProps) {
  const errorId = useId();
  const isMaxReached = themes.length >= MAX_THEMES;

  const handleThemeClick = (themeId: string) => {
    if (themes.includes(themeId)) {
      onThemesChange(themes.filter((t) => t !== themeId));
    } else if (!isMaxReached) {
      onThemesChange([...themes, themeId]);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header with selection count */}
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-ink-700 dark:text-parchment-300">
          Themes <span className="text-blood" aria-hidden="true">*</span>
        </label>
        <span className="text-xs text-ink-500 dark:text-parchment-500">
          {themes.length} / {MAX_THEMES}
        </span>
      </div>

      {/* Theme chips */}
      <div
        role="group"
        aria-label="Themes"
        aria-describedby={error ? errorId : undefined}
        className="flex flex-wrap gap-2"
      >
        {THEME_OPTIONS.map((option) => {
          const isSelected = themes.includes(option.id);
          const isDisabledByMax = isMaxReached && !isSelected;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleThemeClick(option.id)}
              disabled={isDisabledByMax}
              aria-pressed={isSelected}
              className={`
                px-3 py-1.5 rounded-full border text-sm font-medium
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2
                dark:focus:ring-offset-shadow-900
                ${
                  isSelected
                    ? 'bg-gold-100 border-gold-400 text-ink-900 dark:bg-gold-900/40 dark:border-gold-500 dark:text-parchment-100'
                    : isDisabledByMax
                      ? 'bg-ink-100 border-ink-200 text-ink-400 cursor-not-allowed dark:bg-shadow-700 dark:border-shadow-600 dark:text-shadow-400'
                      : 'bg-parchment-50 border-ink-300 text-ink-700 hover:bg-gold-50 hover:border-gold-300 dark:bg-shadow-800 dark:border-shadow-500 dark:text-parchment-200 dark:hover:bg-gold-900/20 dark:hover:border-gold-600'
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-blood dark:text-blood-400 font-medium"
        >
          {error}
        </p>
      )}

      {/* Help text */}
      <p className="text-xs text-ink-500 dark:text-parchment-500 italic">
        Select 1-3 themes that will guide your adventure&apos;s narrative
      </p>
    </div>
  );
}
