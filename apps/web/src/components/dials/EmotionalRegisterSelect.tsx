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
  /** Whether current value is a default that can be confirmed */
  isDefault?: boolean;
  /** Whether the default value has been confirmed by user */
  isConfirmed?: boolean;
  /** Callback when user confirms a default value by clicking it */
  onConfirm?: () => void;
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
  isDefault = false,
  isConfirmed = false,
  onConfirm,
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
      isDefault={isDefault}
      isConfirmed={isConfirmed}
      onConfirm={onConfirm}
      className={className}
    />
  );
}
