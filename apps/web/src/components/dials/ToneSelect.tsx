/**
 * ToneSelect Component
 *
 * A button group for selecting adventure tone with descriptions.
 * Shows all options inline for single-click selection.
 * Fantasy-themed with gold accent for selected option.
 */

import type { ToneOption } from '@dagger-app/shared-types';
import { OptionButtonGroup } from './OptionButtonGroup';

export interface ToneSelectProps {
  /** Current selected tone */
  value: ToneOption;
  /** Callback when tone changes */
  onChange: (tone: ToneOption) => void;
  /** Optional label */
  label?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Tone options with descriptions */
const TONE_OPTIONS = [
  { value: 'grim', label: 'Grim', description: 'Morally complex, consequences matter' },
  { value: 'serious', label: 'Serious', description: 'Dramatic stakes, moments of levity' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of drama and fun' },
  { value: 'lighthearted', label: 'Lighthearted', description: 'Upbeat with heroic themes' },
  { value: 'whimsical', label: 'Whimsical', description: 'Playful, comedic elements' },
];

export function ToneSelect({
  value,
  onChange,
  label,
  disabled = false,
  className = '',
}: ToneSelectProps) {
  const handleChange = (selectedValue: string) => {
    onChange(selectedValue as ToneOption);
  };

  return (
    <OptionButtonGroup
      options={TONE_OPTIONS}
      value={value}
      onChange={handleChange}
      label={label}
      disabled={disabled}
      className={className}
    />
  );
}
