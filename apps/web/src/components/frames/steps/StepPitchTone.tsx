/**
 * StepPitchTone Component
 *
 * Step 2 of the custom frame wizard.
 * Collects Pitch (textarea) and Tone & Feel (multi-select).
 * Fantasy-themed styling.
 */

import { useId } from 'react';

/** Maximum character limit for pitch */
const PITCH_MAX_LENGTH = 500;

/** Available tone options */
const TONE_OPTIONS = [
  { id: 'grim', label: 'Grim', description: 'Dark and morally complex' },
  { id: 'mysterious', label: 'Mysterious', description: 'Secrets and intrigue' },
  { id: 'heroic', label: 'Heroic', description: 'Classic adventure vibes' },
  { id: 'whimsical', label: 'Whimsical', description: 'Playful and lighthearted' },
  { id: 'epic', label: 'Epic', description: 'Grand scale and stakes' },
  { id: 'intimate', label: 'Intimate', description: 'Character-focused stories' },
];

export interface StepPitchToneProps {
  /** Current pitch value */
  pitch: string;
  /** Currently selected tones */
  tones: string[];
  /** Callback when pitch changes */
  onPitchChange: (value: string) => void;
  /** Callback when tones change */
  onTonesChange: (value: string[]) => void;
  /** Validation errors */
  errors?: {
    pitch?: string;
    tones?: string;
  };
  /** Additional CSS classes */
  className?: string;
}

export function StepPitchTone({
  pitch,
  tones,
  onPitchChange,
  onTonesChange,
  errors = {},
  className = '',
}: StepPitchToneProps) {
  const pitchId = useId();
  const pitchErrorId = useId();
  const tonesErrorId = useId();

  const handleToneClick = (toneId: string) => {
    if (tones.includes(toneId)) {
      onTonesChange(tones.filter((t) => t !== toneId));
    } else {
      onTonesChange([...tones, toneId]);
    }
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Pitch field */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <label
            htmlFor={pitchId}
            className="text-sm font-medium text-ink-700 dark:text-parchment-300"
          >
            Pitch <span className="text-blood" aria-hidden="true">*</span>
          </label>
          <span className="text-xs text-ink-500 dark:text-parchment-500">
            {pitch.length} / {PITCH_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id={pitchId}
          value={pitch}
          onChange={(e) => onPitchChange(e.target.value.slice(0, PITCH_MAX_LENGTH))}
          placeholder="Describe your adventure frame in one compelling paragraph..."
          rows={4}
          aria-describedby={errors.pitch ? pitchErrorId : undefined}
          aria-invalid={!!errors.pitch}
          className={`
            w-full px-4 py-3 rounded-fantasy border resize-none
            bg-parchment-50 dark:bg-shadow-800
            text-ink-900 dark:text-parchment-100
            placeholder-ink-400 dark:placeholder-parchment-600
            focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400
            transition-all duration-200
            ${
              errors.pitch
                ? 'border-blood dark:border-blood-400'
                : 'border-ink-300 dark:border-shadow-500'
            }
          `}
        />
        {errors.pitch && (
          <p
            id={pitchErrorId}
            role="alert"
            className="text-xs text-blood dark:text-blood-400 font-medium"
          >
            {errors.pitch}
          </p>
        )}
      </div>

      {/* Tone & Feel multi-select */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink-700 dark:text-parchment-300">
          Tone & Feel <span className="text-blood" aria-hidden="true">*</span>
        </label>
        <div
          role="group"
          aria-label="Tone and Feel"
          aria-describedby={errors.tones ? tonesErrorId : undefined}
          className="flex flex-wrap gap-2"
        >
          {TONE_OPTIONS.map((option) => {
            const isSelected = tones.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleToneClick(option.id)}
                aria-pressed={isSelected}
                className={`
                  flex flex-col items-start px-4 py-2 rounded-lg border-2 transition-all
                  focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2
                  dark:focus:ring-offset-shadow-900
                  ${
                    isSelected
                      ? 'bg-gold-100 border-gold-400 text-ink-900 dark:bg-gold-900/40 dark:border-gold-500 dark:text-parchment-100'
                      : 'bg-parchment-50 border-ink-300 text-ink-700 hover:bg-gold-50 hover:border-gold-300 dark:bg-shadow-800 dark:border-shadow-500 dark:text-parchment-200 dark:hover:bg-gold-900/20 dark:hover:border-gold-600'
                  }
                `}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-ink-500 dark:text-parchment-400 mt-0.5">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
        {errors.tones && (
          <p
            id={tonesErrorId}
            role="alert"
            className="text-xs text-blood dark:text-blood-400 font-medium"
          >
            {errors.tones}
          </p>
        )}
      </div>
    </div>
  );
}
