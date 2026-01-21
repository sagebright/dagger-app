/**
 * PartySizeSelect Component
 *
 * A button group for selecting party size (2-5 players).
 * Shows all options inline for single-click selection.
 * Fantasy-themed with gold accent for selected option.
 */

import type { PartySize } from '@dagger-app/shared-types';
import { DIAL_CONSTRAINTS } from '@dagger-app/shared-types';
import { OptionButtonGroup } from './OptionButtonGroup';

export interface PartySizeSelectProps {
  /** Current selected party size */
  value: PartySize;
  /** Callback when party size changes */
  onChange: (size: PartySize) => void;
  /** Optional label */
  label?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const PARTY_SIZE_OPTIONS = DIAL_CONSTRAINTS.partySize.options.map((size) => ({
  value: String(size),
  label: String(size),
}));

export function PartySizeSelect({
  value,
  onChange,
  label,
  disabled = false,
  className = '',
}: PartySizeSelectProps) {
  const handleChange = (selectedValue: string) => {
    const size = parseInt(selectedValue, 10) as PartySize;
    onChange(size);
  };

  return (
    <OptionButtonGroup
      options={PARTY_SIZE_OPTIONS}
      value={String(value)}
      onChange={handleChange}
      label={label}
      disabled={disabled}
      className={className}
    />
  );
}
