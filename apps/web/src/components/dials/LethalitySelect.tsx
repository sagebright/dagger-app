/**
 * LethalitySelect Component
 *
 * A button group for selecting lethality level with descriptions.
 * Shows all options inline for single-click selection.
 * Fantasy-themed with gold accent for selected option.
 */

import type { LethalityOption } from '@dagger-app/shared-types';
import { OptionButtonGroup } from './OptionButtonGroup';

export interface LethalitySelectProps {
  /** Current selected lethality */
  value: LethalityOption;
  /** Callback when lethality changes */
  onChange: (lethality: LethalityOption) => void;
  /** Optional label */
  label?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Lethality options with descriptions */
const LETHALITY_OPTIONS = [
  { value: 'heroic', label: 'Heroic', description: 'Death is rare' },
  { value: 'standard', label: 'Standard', description: 'Tactical challenge' },
  { value: 'dangerous', label: 'Dangerous', description: 'Mistakes hurt' },
  { value: 'brutal', label: 'Brutal', description: 'Expect casualties' },
];

export function LethalitySelect({
  value,
  onChange,
  label,
  disabled = false,
  className = '',
}: LethalitySelectProps) {
  const handleChange = (selectedValue: string) => {
    onChange(selectedValue as LethalityOption);
  };

  return (
    <OptionButtonGroup
      options={LETHALITY_OPTIONS}
      value={value}
      onChange={handleChange}
      label={label}
      disabled={disabled}
      className={className}
    />
  );
}
