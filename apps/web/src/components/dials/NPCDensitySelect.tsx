/**
 * NPCDensitySelect Component
 *
 * A button group for selecting NPC density with descriptions.
 * Shows all options inline for single-click selection.
 * Fantasy-themed with gold accent for selected option.
 */

import type { NPCDensityOption } from '@dagger-app/shared-types';
import { OptionButtonGroup } from './OptionButtonGroup';

export interface NPCDensitySelectProps {
  /** Current selected NPC density */
  value: NPCDensityOption;
  /** Callback when density changes */
  onChange: (density: NPCDensityOption) => void;
  /** Optional label */
  label?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** NPC density options with descriptions */
const NPC_DENSITY_OPTIONS = [
  { value: 'sparse', label: 'Sparse', description: 'Few named NPCs' },
  { value: 'moderate', label: 'Moderate', description: 'Standard cast' },
  { value: 'rich', label: 'Rich', description: 'Ensemble cast' },
];

export function NPCDensitySelect({
  value,
  onChange,
  label,
  disabled = false,
  className = '',
}: NPCDensitySelectProps) {
  const handleChange = (selectedValue: string) => {
    onChange(selectedValue as NPCDensityOption);
  };

  return (
    <OptionButtonGroup
      options={NPC_DENSITY_OPTIONS}
      value={value}
      onChange={handleChange}
      label={label}
      disabled={disabled}
      className={className}
    />
  );
}
