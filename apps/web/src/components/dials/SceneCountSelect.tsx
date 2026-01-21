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
      className={className}
    />
  );
}
