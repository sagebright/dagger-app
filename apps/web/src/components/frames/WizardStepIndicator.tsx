/**
 * WizardStepIndicator Component
 *
 * Displays the progress through wizard steps.
 * Shows step labels with visual indicators for current and completed steps.
 * Fantasy-themed styling with gold accents.
 */

export interface WizardStep {
  id: string;
  label: string;
}

export interface WizardStepIndicatorProps {
  /** All steps in the wizard */
  steps: WizardStep[];
  /** ID of the current step */
  currentStepId: string;
  /** Additional CSS classes */
  className?: string;
}

export function WizardStepIndicator({
  steps,
  currentStepId,
  className = '',
}: WizardStepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <ol
      aria-label="Wizard progress"
      className={`flex items-center justify-between ${className}`}
    >
      {steps.map((step, index) => {
        const isCurrent = step.id === currentStepId;
        const isCompleted = index < currentIndex;

        return (
          <li
            key={step.id}
            aria-current={isCurrent ? 'step' : undefined}
            className="flex items-center flex-1"
          >
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-sm font-medium border-2 transition-colors
                  ${
                    isCurrent
                      ? 'bg-gold-500 border-gold-600 text-ink-900 dark:bg-gold-600 dark:border-gold-500'
                      : isCompleted
                        ? 'bg-gold-200 border-gold-400 text-ink-700 dark:bg-gold-800 dark:border-gold-600 dark:text-parchment-200'
                        : 'bg-parchment-100 border-ink-300 text-ink-400 dark:bg-shadow-700 dark:border-shadow-500 dark:text-shadow-400'
                  }
                `}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  mt-2 text-xs font-medium text-center
                  ${
                    isCurrent
                      ? 'text-gold-700 dark:text-gold-400'
                      : isCompleted
                        ? 'text-ink-600 dark:text-parchment-400'
                        : 'text-ink-400 dark:text-shadow-400'
                  }
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (except for last step) */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-0.5 mx-2 mt-[-1rem]
                  ${
                    index < currentIndex
                      ? 'bg-gold-400 dark:bg-gold-600'
                      : 'bg-ink-200 dark:bg-shadow-600'
                  }
                `}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
