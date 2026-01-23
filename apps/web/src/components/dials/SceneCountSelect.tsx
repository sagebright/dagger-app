/**
 * SceneCountSelect Component
 *
 * A button group for selecting scene count (3-6 scenes).
 * Shows all options inline for single-click selection.
 * Fantasy-themed with gold accent for selected option.
 */

import type { SceneCount } from '@dagger-app/shared-types';
import { DIAL_CONSTRAINTS } from '@dagger-app/shared-types';
import { OptionButtonGroup } from './OptionButtonGroup';

export interface SceneCountSelectProps {
  /** Current selected scene count */
  value: SceneCount;
  /** Callback when scene count changes */
  onChange: (count: SceneCount) => void;
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

const SCENE_COUNT_OPTIONS = DIAL_CONSTRAINTS.sceneCount.options.map((count) => ({
  value: String(count),
  label: String(count),
}));

export function SceneCountSelect({
  value,
  onChange,
  label,
  disabled = false,
  isDefault = false,
  isConfirmed = false,
  onConfirm,
  className = '',
}: SceneCountSelectProps) {
  const handleChange = (selectedValue: string) => {
    const count = parseInt(selectedValue, 10) as SceneCount;
    onChange(count);
  };

  return (
    <OptionButtonGroup
      options={SCENE_COUNT_OPTIONS}
      value={String(value)}
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
