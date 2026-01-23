/**
 * MultiSelectChips Component
 *
 * Chip-based multi-select with maximum selection limit.
 * Used for themes (max 3 selections).
 * Fantasy-themed with gold accent for selected chips.
 */

export interface ChipOption {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
}

export interface MultiSelectChipsProps {
  /** Available options */
  options: ChipOption[];
  /** Currently selected option IDs */
  selected: string[];
  /** Maximum number of selections allowed */
  maxSelections: number;
  /** Callback when selection changes */
  onChange: (selected: string[]) => void;
  /** Optional label */
  label?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function MultiSelectChips({
  options,
  selected,
  maxSelections,
  onChange,
  label,
  disabled = false,
  className = '',
}: MultiSelectChipsProps) {
  const isMaxReached = selected.length >= maxSelections;

  const handleClick = (id: string) => {
    if (disabled) return;

    const isSelected = selected.includes(id);

    if (isSelected) {
      // Deselect
      onChange(selected.filter((s) => s !== id));
    } else if (!isMaxReached) {
      // Select (only if not at max)
      onChange([...selected, id]);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-ink-700 dark:text-parchment-300">
            {label}
          </label>
          <span className="text-xs text-ink-500 dark:text-parchment-400">
            {selected.length} / {maxSelections}
          </span>
        </div>
      )}
      {!label && (
        <div className="text-right">
          <span className="text-xs text-ink-500 dark:text-parchment-400">
            {selected.length} / {maxSelections}
          </span>
        </div>
      )}
      <div
        role="group"
        aria-label={label || 'Multi-select options'}
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isDisabledByMax = isMaxReached && !isSelected;
          const isChipDisabled = disabled || isDisabledByMax;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleClick(option.id)}
              disabled={isChipDisabled}
              aria-pressed={isSelected}
              className={`
                px-4 py-2 rounded-lg border-2 text-sm font-medium
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2
                focus:ring-offset-parchment-100 dark:focus:ring-offset-shadow-900
                ${
                  isSelected
                    ? 'bg-gold-100 border-gold-500 text-ink-900 dark:bg-gold-600/20 dark:border-gold-500 dark:text-parchment-100'
                    : isChipDisabled
                      ? 'bg-ink-100 border-ink-200 text-ink-400 cursor-not-allowed dark:bg-shadow-700 dark:border-shadow-600 dark:text-shadow-400'
                      : 'bg-parchment-50 border-ink-300 text-ink-700 hover:bg-gold-50 hover:border-gold-300 dark:bg-shadow-800 dark:border-shadow-600 dark:text-parchment-300 dark:hover:border-shadow-500 dark:hover:bg-shadow-700'
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
