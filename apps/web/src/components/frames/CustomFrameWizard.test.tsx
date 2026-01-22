/**
 * CustomFrameWizard Component Tests
 *
 * TDD tests for the multi-step custom frame creation wizard.
 * Tests step navigation, validation, and form submission.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomFrameWizard } from './CustomFrameWizard';

describe('CustomFrameWizard', () => {
  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
    mockOnCancel.mockClear();
  });

  describe('wizard structure', () => {
    it('displays progress indicator with 4 steps', () => {
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      const progressIndicator = screen.getByRole('list', { name: /wizard progress/i });
      const steps = within(progressIndicator).getAllByRole('listitem');
      expect(steps).toHaveLength(4);
    });

    it('shows step labels: Basics, Pitch & Tone, Themes, Review', () => {
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      const progressIndicator = screen.getByRole('list', { name: /wizard progress/i });

      expect(within(progressIndicator).getByText('Basics')).toBeInTheDocument();
      expect(within(progressIndicator).getByText('Pitch & Tone')).toBeInTheDocument();
      expect(within(progressIndicator).getByText('Themes')).toBeInTheDocument();
      expect(within(progressIndicator).getByText('Review')).toBeInTheDocument();
    });

    it('starts on Step 1 (Basics)', () => {
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      expect(screen.getByRole('heading', { name: /basics/i })).toBeInTheDocument();
    });

    it('highlights current step in progress indicator', () => {
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      const progressIndicator = screen.getByRole('list', { name: /wizard progress/i });
      const steps = within(progressIndicator).getAllByRole('listitem');

      // First step should be marked as current
      expect(steps[0]).toHaveAttribute('aria-current', 'step');
    });
  });

  describe('Step 1: Basics', () => {
    it('renders Title input field', () => {
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    it('renders Concept input field', () => {
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/concept/i)).toBeInTheDocument();
    });

    it('shows character count for Title (max 50)', async () => {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Title');

      expect(screen.getByText(/10.*\/.*50/)).toBeInTheDocument();
    });

    it('shows character count for Concept (max 150)', async () => {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      const conceptInput = screen.getByLabelText(/concept/i);
      await user.type(conceptInput, 'A brief concept');

      expect(screen.getByText(/15.*\/.*150/)).toBeInTheDocument();
    });

    it('shows validation error when Title is empty and Next is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    it('shows validation error when Concept is empty and Next is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Valid Title');
      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(screen.getByText(/concept is required/i)).toBeInTheDocument();
    });
  });

  describe('Step 2: Pitch & Tone', () => {
    async function goToStep2() {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Fill Step 1
      await user.type(screen.getByLabelText(/title/i), 'Test Frame');
      await user.type(screen.getByLabelText(/concept/i), 'A test concept');
      await user.click(screen.getByRole('button', { name: /next/i }));

      return user;
    }

    it('renders Pitch textarea', async () => {
      await goToStep2();

      expect(screen.getByLabelText(/pitch/i)).toBeInTheDocument();
    });

    it('renders Tone & Feel multi-select', async () => {
      await goToStep2();

      expect(screen.getByRole('group', { name: /tone.*feel/i })).toBeInTheDocument();
    });

    it('shows character count for Pitch (max 500)', async () => {
      const user = await goToStep2();

      const pitchTextarea = screen.getByLabelText(/pitch/i);
      await user.type(pitchTextarea, 'A compelling pitch');

      expect(screen.getByText(/18.*\/.*500/)).toBeInTheDocument();
    });

    it('shows validation error when Pitch is empty and Next is clicked', async () => {
      const user = await goToStep2();

      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(screen.getByText(/pitch is required/i)).toBeInTheDocument();
    });

    it('shows validation error when no Tone is selected and Next is clicked', async () => {
      const user = await goToStep2();

      const pitchTextarea = screen.getByLabelText(/pitch/i);
      await user.type(pitchTextarea, 'A valid pitch for the frame');
      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(screen.getByText(/at least one tone.*required/i)).toBeInTheDocument();
    });

    it('allows selecting multiple tones', async () => {
      const user = await goToStep2();

      // Click on tone options (assuming they're buttons)
      const toneButtons = screen.getAllByRole('button', { pressed: false });
      const grimButton = toneButtons.find(b => b.textContent?.toLowerCase().includes('grim'));
      const mysteriousButton = toneButtons.find(b => b.textContent?.toLowerCase().includes('mysterious'));

      if (grimButton) await user.click(grimButton);
      if (mysteriousButton) await user.click(mysteriousButton);

      // Verify selections
      expect(screen.getByRole('button', { name: /grim/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /mysterious/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Step 3: Themes', () => {
    async function goToStep3() {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Fill Step 1
      await user.type(screen.getByLabelText(/title/i), 'Test Frame');
      await user.type(screen.getByLabelText(/concept/i), 'A test concept');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Fill Step 2
      await user.type(screen.getByLabelText(/pitch/i), 'A compelling pitch for the adventure');
      await user.click(screen.getByRole('button', { name: /grim/i }));
      await user.click(screen.getByRole('button', { name: /next/i }));

      return user;
    }

    it('renders theme selection component', async () => {
      await goToStep3();

      expect(screen.getByRole('group', { name: /themes/i })).toBeInTheDocument();
    });

    it('shows validation error when no theme is selected and Next is clicked', async () => {
      const user = await goToStep3();

      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(screen.getByText(/at least one theme.*required/i)).toBeInTheDocument();
    });

    it('allows selecting themes', async () => {
      const user = await goToStep3();

      // Find and click a theme chip
      const themeButtons = screen.getAllByRole('button', { pressed: false });
      const redemptionTheme = themeButtons.find(b => b.textContent?.toLowerCase().includes('redemption'));

      if (redemptionTheme) {
        await user.click(redemptionTheme);
        expect(redemptionTheme).toHaveAttribute('aria-pressed', 'true');
      }
    });
  });

  describe('Step 4: Review', () => {
    async function goToStep4() {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Fill Step 1
      await user.type(screen.getByLabelText(/title/i), 'The Hollow Vigil');
      await user.type(screen.getByLabelText(/concept/i), 'A haunted monastery adventure');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Fill Step 2
      await user.type(screen.getByLabelText(/pitch/i), 'An ancient order guards a terrible secret');
      await user.click(screen.getByRole('button', { name: /grim/i }));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Fill Step 3
      const themeButtons = screen.getAllByRole('button', { pressed: false });
      const redemptionTheme = themeButtons.find(b => b.textContent?.toLowerCase().includes('redemption'));
      if (redemptionTheme) await user.click(redemptionTheme);
      await user.click(screen.getByRole('button', { name: /next/i }));

      return user;
    }

    it('displays all entered data', async () => {
      await goToStep4();

      expect(screen.getByText('The Hollow Vigil')).toBeInTheDocument();
      expect(screen.getByText('A haunted monastery adventure')).toBeInTheDocument();
      expect(screen.getByText('An ancient order guards a terrible secret')).toBeInTheDocument();
    });

    it('shows Edit buttons for each section', async () => {
      await goToStep4();

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons.length).toBeGreaterThanOrEqual(3); // At least one per previous step
    });

    it('clicking Edit for Basics goes back to Step 1', async () => {
      const user = await goToStep4();

      const editButtons = screen.getAllByRole('button', { name: /edit basics/i });
      await user.click(editButtons[0]);

      expect(screen.getByRole('heading', { name: /basics/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('The Hollow Vigil')).toBeInTheDocument();
    });

    it('shows Create Frame button', async () => {
      await goToStep4();

      expect(screen.getByRole('button', { name: /create frame/i })).toBeInTheDocument();
    });

    it('calls onComplete with frame data when Create Frame is clicked', async () => {
      const user = await goToStep4();

      await user.click(screen.getByRole('button', { name: /create frame/i }));

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'The Hollow Vigil',
          concept: 'A haunted monastery adventure',
          pitch: 'An ancient order guards a terrible secret',
        })
      );
    });
  });

  describe('navigation', () => {
    it('shows Back button on steps after Step 1', async () => {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Step 1 should not have Back button
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();

      // Fill Step 1 and go to Step 2
      await user.type(screen.getByLabelText(/title/i), 'Test');
      await user.type(screen.getByLabelText(/concept/i), 'Test concept');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 2 should have Back button
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('Back button returns to previous step', async () => {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Fill Step 1 and go to Step 2
      await user.type(screen.getByLabelText(/title/i), 'Test Frame');
      await user.type(screen.getByLabelText(/concept/i), 'Test concept');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Verify on Step 2
      expect(screen.getByLabelText(/pitch/i)).toBeInTheDocument();

      // Go back
      await user.click(screen.getByRole('button', { name: /back/i }));

      // Verify on Step 1 with data preserved
      expect(screen.getByDisplayValue('Test Frame')).toBeInTheDocument();
    });

    it('preserves form data when navigating between steps', async () => {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Fill Step 1
      await user.type(screen.getByLabelText(/title/i), 'My Frame');
      await user.type(screen.getByLabelText(/concept/i), 'My concept');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Fill Step 2 partially
      await user.type(screen.getByLabelText(/pitch/i), 'My pitch');

      // Go back to Step 1
      await user.click(screen.getByRole('button', { name: /back/i }));

      // Return to Step 2
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Pitch should still be there
      expect(screen.getByDisplayValue('My pitch')).toBeInTheDocument();
    });

    it('cannot proceed to next step without completing required fields', async () => {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Try to proceed without filling anything
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should still be on Step 1
      expect(screen.getByRole('heading', { name: /basics/i })).toBeInTheDocument();
    });
  });

  describe('cancel functionality', () => {
    it('shows Cancel button', () => {
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('calls onCancel when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      // Should have a main heading
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('form inputs have associated labels', () => {
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const conceptInput = screen.getByLabelText(/concept/i);

      expect(titleInput).toHaveAccessibleName();
      expect(conceptInput).toHaveAccessibleName();
    });

    it('validation errors are announced to screen readers', async () => {
      const user = userEvent.setup();
      render(
        <CustomFrameWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
      );

      await user.click(screen.getByRole('button', { name: /next/i }));

      const errorMessage = screen.getByText(/title is required/i);
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });
});
