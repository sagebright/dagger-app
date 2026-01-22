/**
 * CustomFrameWizard Component
 *
 * Multi-step wizard for creating custom adventure frames.
 * MVP version with 4 steps: Basics, Pitch & Tone, Themes, Review.
 * Features step navigation, validation, and progress indicator.
 * Fantasy-themed styling with gold accents.
 */

import { useState, useCallback, useId } from 'react';
import type { CreateCustomFrameRequest } from '@dagger-app/shared-types';
import { WizardStepIndicator } from './WizardStepIndicator';
import { StepBasics } from './steps/StepBasics';
import { StepPitchTone } from './steps/StepPitchTone';
import { StepThemes } from './steps/StepThemes';
import { StepReview } from './steps/StepReview';

/** Wizard step identifiers */
type WizardStep = 'basics' | 'pitchTone' | 'themes' | 'review';

/** Step configuration for the wizard */
const WIZARD_STEPS: { id: WizardStep; label: string }[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'pitchTone', label: 'Pitch & Tone' },
  { id: 'themes', label: 'Themes' },
  { id: 'review', label: 'Review' },
];

/** Form data shape for the wizard */
export interface WizardFormData {
  title: string;
  concept: string;
  pitch: string;
  tones: string[];
  themes: string[];
}

/** Initial empty form data */
const INITIAL_FORM_DATA: WizardFormData = {
  title: '',
  concept: '',
  pitch: '',
  tones: [],
  themes: [],
};

export interface CustomFrameWizardProps {
  /** Callback when wizard completes with frame data */
  onComplete: (data: CreateCustomFrameRequest) => void;
  /** Callback when wizard is cancelled */
  onCancel: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function CustomFrameWizard({
  onComplete,
  onCancel,
  className = '',
}: CustomFrameWizardProps) {
  const headingId = useId();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof WizardFormData, string>>>({});

  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  /** Update a single field in form data */
  const updateField = useCallback(<K extends keyof WizardFormData>(
    field: K,
    value: WizardFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  /** Validate current step and return whether it passes */
  const validateCurrentStep = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof WizardFormData, string>> = {};

    switch (currentStep) {
      case 'basics':
        if (!formData.title.trim()) {
          newErrors.title = 'Title is required';
        }
        if (!formData.concept.trim()) {
          newErrors.concept = 'Concept is required';
        }
        break;

      case 'pitchTone':
        if (!formData.pitch.trim()) {
          newErrors.pitch = 'Pitch is required';
        }
        if (formData.tones.length === 0) {
          newErrors.tones = 'At least one tone is required';
        }
        break;

      case 'themes':
        if (formData.themes.length === 0) {
          newErrors.themes = 'At least one theme is required';
        }
        break;

      case 'review':
        // No validation needed for review step
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, formData]);

  /** Go to next step if validation passes */
  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < WIZARD_STEPS.length) {
      setCurrentStep(WIZARD_STEPS[nextIndex].id);
    }
  }, [validateCurrentStep, currentStepIndex]);

  /** Go to previous step */
  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(WIZARD_STEPS[prevIndex].id);
    }
  }, [currentStepIndex]);

  /** Navigate to a specific step (for edit buttons in review) */
  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  /** Handle final submission */
  const handleCreate = useCallback(() => {
    const requestData: CreateCustomFrameRequest = {
      title: formData.title.trim(),
      concept: formData.concept.trim(),
      pitch: formData.pitch.trim(),
      tone_feel: formData.tones,
      themes: formData.themes,
    };
    onComplete(requestData);
  }, [formData, onComplete]);

  /** Render the current step content */
  const renderStep = () => {
    switch (currentStep) {
      case 'basics':
        return (
          <StepBasics
            title={formData.title}
            concept={formData.concept}
            onTitleChange={(value) => updateField('title', value)}
            onConceptChange={(value) => updateField('concept', value)}
            errors={{ title: errors.title, concept: errors.concept }}
          />
        );

      case 'pitchTone':
        return (
          <StepPitchTone
            pitch={formData.pitch}
            tones={formData.tones}
            onPitchChange={(value) => updateField('pitch', value)}
            onTonesChange={(value) => updateField('tones', value)}
            errors={{ pitch: errors.pitch, tones: errors.tones }}
          />
        );

      case 'themes':
        return (
          <StepThemes
            themes={formData.themes}
            onThemesChange={(value) => updateField('themes', value)}
            error={errors.themes}
          />
        );

      case 'review':
        return (
          <StepReview
            formData={formData}
            onEditBasics={() => goToStep('basics')}
            onEditPitchTone={() => goToStep('pitchTone')}
            onEditThemes={() => goToStep('themes')}
          />
        );
    }
  };

  /** Get the heading for the current step */
  const getStepHeading = () => {
    switch (currentStep) {
      case 'basics':
        return 'Basics';
      case 'pitchTone':
        return 'Pitch & Tone';
      case 'themes':
        return 'Themes';
      case 'review':
        return 'Review';
    }
  };

  return (
    <div
      className={`
        flex flex-col h-full
        bg-parchment-50 dark:bg-shadow-900
        ${className}
      `}
    >
      {/* Header with progress indicator */}
      <div className="p-4 border-b border-ink-200 dark:border-shadow-600">
        <WizardStepIndicator
          steps={WIZARD_STEPS}
          currentStepId={currentStep}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2
          id={headingId}
          className="text-xl font-serif font-bold text-ink-800 dark:text-parchment-100 mb-6"
        >
          {getStepHeading()}
        </h2>

        {renderStep()}
      </div>

      {/* Footer with navigation buttons */}
      <div className="p-4 border-t border-ink-200 dark:border-shadow-600 bg-parchment-100 dark:bg-shadow-800">
        <div className="flex justify-between">
          {/* Left side: Cancel and Back */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="
                px-4 py-2 text-sm font-medium rounded-fantasy border
                bg-transparent border-ink-300 text-ink-600
                hover:bg-ink-100 hover:border-ink-400
                dark:border-shadow-500 dark:text-parchment-400
                dark:hover:bg-shadow-700 dark:hover:border-shadow-400
                transition-colors duration-200
              "
            >
              Cancel
            </button>

            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="
                  px-4 py-2 text-sm font-medium rounded-fantasy border
                  bg-transparent border-ink-300 text-ink-600
                  hover:bg-ink-100 hover:border-ink-400
                  dark:border-shadow-500 dark:text-parchment-400
                  dark:hover:bg-shadow-700 dark:hover:border-shadow-400
                  transition-colors duration-200
                "
              >
                Back
              </button>
            )}
          </div>

          {/* Right side: Next or Create Frame */}
          <div>
            {currentStep === 'review' ? (
              <button
                type="button"
                onClick={handleCreate}
                className="
                  px-6 py-2 text-sm font-semibold rounded-fantasy border-2
                  bg-gold-500 border-gold-600 text-ink-900
                  hover:bg-gold-400 hover:border-gold-500
                  dark:bg-gold-600 dark:border-gold-500 dark:text-shadow-900
                  dark:hover:bg-gold-500 dark:hover:border-gold-400
                  transition-colors duration-200
                "
              >
                Create Frame
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="
                  px-6 py-2 text-sm font-semibold rounded-fantasy border-2
                  bg-gold-500 border-gold-600 text-ink-900
                  hover:bg-gold-400 hover:border-gold-500
                  dark:bg-gold-600 dark:border-gold-500 dark:text-shadow-900
                  dark:hover:bg-gold-500 dark:hover:border-gold-400
                  transition-colors duration-200
                "
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
