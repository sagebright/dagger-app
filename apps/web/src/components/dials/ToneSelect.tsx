/**
 * ToneSelect Component
 *
 * A button group for selecting adventure tone with descriptions.
 * Shows all options inline for single-click selection.
 * Fantasy-themed with gold accent for selected option.
 * Includes AI-generated pop culture examples with regenerate button.
 */

import { useId, useCallback } from 'react';
import type { ToneOption } from '@dagger-app/shared-types';
import { RefreshCw } from 'lucide-react';

export interface ToneSelectProps {
  /** Current selected tone */
  value: ToneOption;
  /** Callback when tone changes */
  onChange: (tone: ToneOption) => void;
  /** Optional label */
  label?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Whether current value is a default that can be confirmed */
  isDefault?: boolean;
  /** Whether the default value has been confirmed by user */
  isConfirmed?: boolean;
  /** Callback when user confirms a default value by clicking it */
  onConfirm?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Callback when regenerate example button is clicked */
  onRegenerateExample?: (toneValue: ToneOption) => void;
  /** Tone option currently loading an example */
  loadingOption?: ToneOption;
  /** Tone option with an error */
  errorOption?: ToneOption;
  /** Custom examples keyed by tone value */
  customExamples?: Partial<Record<ToneOption, string>>;
}

/** Tone options with descriptions and AI example stubs */
const TONE_OPTIONS = [
  {
    value: 'grim',
    label: 'Grim',
    description: 'Morally complex, consequences matter',
    example: "Dark and unforgiving like 'Game of Thrones'",
  },
  {
    value: 'serious',
    label: 'Serious',
    description: 'Dramatic stakes, moments of levity',
    example: "Intense and grounded like 'The Witcher'",
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Mix of drama and fun',
    example: "Adventure with heart like 'Avatar: The Last Airbender'",
  },
  {
    value: 'lighthearted',
    label: 'Lighthearted',
    description: 'Upbeat with heroic themes',
    example: "Fun and adventurous like 'The Princess Bride'",
  },
  {
    value: 'whimsical',
    label: 'Whimsical',
    description: 'Playful, comedic elements',
    example: "Playful and absurd like 'Monty Python and the Holy Grail'",
  },
];

export function ToneSelect({
  value,
  onChange,
  label,
  disabled = false,
  isDefault = false,
  isConfirmed = false,
  onConfirm,
  className = '',
  onRegenerateExample,
  loadingOption,
  errorOption,
  customExamples,
}: ToneSelectProps) {
  const groupId = useId();
  const labelId = `${groupId}-label`;

  const handleClick = useCallback(
    (optionValue: string) => {
      if (disabled) return;

      if (optionValue === value) {
        if (isDefault && !isConfirmed && onConfirm) {
          onConfirm();
        }
        return;
      }

      onChange(optionValue as ToneOption);
    },
    [disabled, value, onChange, isDefault, isConfirmed, onConfirm]
  );

  const handleRegenerateClick = useCallback(
    (e: React.MouseEvent, toneValue: ToneOption, toneName: string) => {
      e.stopPropagation();
      if (onRegenerateExample) {
        onRegenerateExample(toneValue);
      } else {
        console.log(`Regenerate example for tone: ${toneName} - Coming soon!`);
      }
    },
    [onRegenerateExample]
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <span
          id={labelId}
          className="text-sm font-medium text-ink-700 dark:text-parchment-200"
        >
          {label}
        </span>
      )}
      <div
        role="group"
        aria-labelledby={label ? labelId : undefined}
        className="flex flex-wrap gap-2"
      >
        {TONE_OPTIONS.map((option) => {
          const isSelected = option.value === value;
          const showAsDefault = isSelected && isDefault && !isConfirmed;
          const showAsConfirmed = isSelected && isConfirmed;
          return (
            <div key={option.value} className="flex flex-col">
              <button
                type="button"
                role="button"
                aria-pressed={isSelected}
                disabled={disabled}
                data-default={showAsDefault ? 'true' : undefined}
                data-confirmed={showAsConfirmed ? 'true' : undefined}
                onClick={() => handleClick(option.value)}
                className={`
                  flex flex-col items-start px-4 py-2 rounded-t-lg border-2 border-b-0 transition-all
                  focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2
                  focus:ring-offset-parchment-100 dark:focus:ring-offset-shadow-900
                  ${
                    showAsDefault
                      ? 'bg-ink-50 border-ink-300 border-dashed text-ink-600 dark:bg-shadow-700/50 dark:border-shadow-500 dark:text-parchment-400 hover:border-gold-400 hover:bg-gold-50/50 dark:hover:border-gold-600 dark:hover:bg-gold-900/20'
                      : isSelected
                        ? 'bg-gold-100 border-gold-500 text-ink-900 dark:bg-gold-600/20 dark:border-gold-500 dark:text-parchment-100'
                        : 'bg-parchment-50 border-ink-300 text-ink-700 hover:bg-gold-50 hover:border-gold-300 dark:bg-shadow-800 dark:border-shadow-600 dark:text-parchment-300 dark:hover:border-shadow-500 dark:hover:bg-shadow-700'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-ink-500 dark:text-parchment-400 mt-0.5">
                  {option.description}
                </span>
              </button>
              <div
                className={`
                  flex items-center gap-1 px-4 py-1.5 rounded-b-lg border-2 border-t-0
                  ${
                    errorOption === option.value
                      ? 'bg-blood-50/50 border-blood-400 dark:bg-blood-900/20 dark:border-blood-600'
                      : showAsDefault
                        ? 'bg-ink-50/50 border-ink-300 border-dashed dark:bg-shadow-700/30 dark:border-shadow-500'
                        : isSelected
                          ? 'bg-gold-50 border-gold-500 dark:bg-gold-600/10 dark:border-gold-500'
                          : 'bg-parchment-100/50 border-ink-300 dark:bg-shadow-800/50 dark:border-shadow-600'
                  }
                `}
              >
                <span className="text-xs italic text-ink-400 dark:text-parchment-500 flex-1">
                  {customExamples?.[option.value as ToneOption] || option.example}
                </span>
                <button
                  type="button"
                  aria-label={`Regenerate example for ${option.label}`}
                  onClick={(e) => handleRegenerateClick(e, option.value as ToneOption, option.label)}
                  disabled={disabled || loadingOption === option.value}
                  className="p-0.5 rounded hover:bg-ink-200 dark:hover:bg-shadow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingOption === option.value ? (
                    <RefreshCw className="w-3 h-3 text-ink-400 dark:text-parchment-500 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 text-ink-400 dark:text-parchment-500" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
