/**
 * EmotionalRegisterSelect Component
 *
 * A button group for selecting emotional register.
 * Shows all options inline for single-click selection.
 * Fantasy-themed with gold accent for selected option.
 */

import type { EmotionalRegisterOption } from '@dagger-app/shared-types';
import { OptionButtonGroup } from './OptionButtonGroup';

export interface EmotionalRegisterSelectProps {
  /** Current selected emotional register */
  value: EmotionalRegisterOption;
  /** Callback when register changes */
  onChange: (register: EmotionalRegisterOption) => void;
  /** Optional label */
  label?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Emotional register options */
const EMOTIONAL_REGISTER_OPTIONS = [
  { value: 'thrilling', label: 'Thrilling' },
  { value: 'tense', label: 'Tense' },
  { value: 'heartfelt', label: 'Heartfelt' },
  { value: 'bittersweet', label: 'Bittersweet' },
  { value: 'epic', label: 'Epic' },
];

export function EmotionalRegisterSelect({
  value,
  onChange,
  label,
  disabled = false,
  className = '',
}: EmotionalRegisterSelectProps) {
  const handleChange = (selectedValue: string) => {
    onChange(selectedValue as EmotionalRegisterOption);
  };

  return (
    <OptionButtonGroup
      options={EMOTIONAL_REGISTER_OPTIONS}
      value={value}
      onChange={handleChange}
      label={label}
      disabled={disabled}
      className={className}
    />
  );
}
