/**
 * Frame Components
 *
 * Export all frame-related components for the custom frame wizard.
 */

export { CustomFrameWizard } from './CustomFrameWizard';
export type { CustomFrameWizardProps, WizardFormData } from './CustomFrameWizard';

export { WizardStepIndicator } from './WizardStepIndicator';
export type { WizardStepIndicatorProps, WizardStep } from './WizardStepIndicator';

// Step components (typically used internally but exported for testing)
export { StepBasics } from './steps/StepBasics';
export type { StepBasicsProps } from './steps/StepBasics';

export { StepPitchTone } from './steps/StepPitchTone';
export type { StepPitchToneProps } from './steps/StepPitchTone';

export { StepThemes } from './steps/StepThemes';
export type { StepThemesProps } from './steps/StepThemes';

export { StepReview } from './steps/StepReview';
export type { StepReviewProps } from './steps/StepReview';
