/**
 * StepBasics Component
 *
 * Step 1 of the custom frame wizard.
 * Collects Title and Concept with character limits and validation.
 * Fantasy-themed styling.
 */

import { useId } from 'react';

/** Maximum character limits */
const TITLE_MAX_LENGTH = 50;
const CONCEPT_MAX_LENGTH = 150;

export interface StepBasicsProps {
  /** Current title value */
  title: string;
  /** Current concept value */
  concept: string;
  /** Callback when title changes */
  onTitleChange: (value: string) => void;
  /** Callback when concept changes */
  onConceptChange: (value: string) => void;
  /** Validation errors */
  errors?: {
    title?: string;
    concept?: string;
  };
  /** Additional CSS classes */
  className?: string;
}

export function StepBasics({
  title,
  concept,
  onTitleChange,
  onConceptChange,
  errors = {},
  className = '',
}: StepBasicsProps) {
  const titleId = useId();
  const conceptId = useId();
  const titleErrorId = useId();
  const conceptErrorId = useId();

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Title field */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <label
            htmlFor={titleId}
            className="text-sm font-medium text-ink-700 dark:text-parchment-300"
          >
            Title <span className="text-blood" aria-hidden="true">*</span>
          </label>
          <span className="text-xs text-ink-500 dark:text-parchment-500">
            {title.length} / {TITLE_MAX_LENGTH}
          </span>
        </div>
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value.slice(0, TITLE_MAX_LENGTH))}
          placeholder="Enter a compelling title for your frame"
          aria-describedby={errors.title ? titleErrorId : undefined}
          aria-invalid={!!errors.title}
          className={`
            w-full px-4 py-3 rounded-fantasy border
            bg-parchment-50 dark:bg-shadow-800
            text-ink-900 dark:text-parchment-100
            placeholder-ink-400 dark:placeholder-parchment-600
            focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400
            transition-all duration-200
            ${
              errors.title
                ? 'border-blood dark:border-blood-400'
                : 'border-ink-300 dark:border-shadow-500'
            }
          `}
        />
        {errors.title && (
          <p
            id={titleErrorId}
            role="alert"
            className="text-xs text-blood dark:text-blood-400 font-medium"
          >
            {errors.title}
          </p>
        )}
      </div>

      {/* Concept field */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <label
            htmlFor={conceptId}
            className="text-sm font-medium text-ink-700 dark:text-parchment-300"
          >
            Concept <span className="text-blood" aria-hidden="true">*</span>
          </label>
          <span className="text-xs text-ink-500 dark:text-parchment-500">
            {concept.length} / {CONCEPT_MAX_LENGTH}
          </span>
        </div>
        <input
          id={conceptId}
          type="text"
          value={concept}
          onChange={(e) => onConceptChange(e.target.value.slice(0, CONCEPT_MAX_LENGTH))}
          placeholder="One sentence describing the core idea"
          aria-describedby={errors.concept ? conceptErrorId : undefined}
          aria-invalid={!!errors.concept}
          className={`
            w-full px-4 py-3 rounded-fantasy border
            bg-parchment-50 dark:bg-shadow-800
            text-ink-900 dark:text-parchment-100
            placeholder-ink-400 dark:placeholder-parchment-600
            focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400
            transition-all duration-200
            ${
              errors.concept
                ? 'border-blood dark:border-blood-400'
                : 'border-ink-300 dark:border-shadow-500'
            }
          `}
        />
        {errors.concept && (
          <p
            id={conceptErrorId}
            role="alert"
            className="text-xs text-blood dark:text-blood-400 font-medium"
          >
            {errors.concept}
          </p>
        )}
        <p className="text-xs text-ink-500 dark:text-parchment-500 italic">
          Example: &ldquo;A haunted monastery guards an ancient secret&rdquo;
        </p>
      </div>
    </div>
  );
}
