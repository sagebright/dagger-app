/**
 * Tests for ComponentChoice panel
 *
 * Verifies the choice view for selecting component values:
 * - Renders component name and question
 * - Single-select card behavior
 * - Multi-select card behavior (max 3 for Threads)
 * - Back button returns to summary
 * - Confirm button state and callback
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ComponentChoice } from './ComponentChoice';
import type { ComponentId } from '@sage-codex/shared-types';

describe('ComponentChoice', () => {
  it('renders the component name and question', () => {
    render(
      <ComponentChoice
        componentId={'tenor' as ComponentId}
        currentValue={null}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText('Tenor')).toBeInTheDocument();
    expect(
      screen.getByText(/what kind of tenor/i)
    ).toBeInTheDocument();
  });

  it('renders choice cards for the component', () => {
    render(
      <ComponentChoice
        componentId={'tenor' as ComponentId}
        currentValue={null}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText('Grim')).toBeInTheDocument();
    expect(screen.getByText('Serious')).toBeInTheDocument();
    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText('Lighthearted')).toBeInTheDocument();
    expect(screen.getByText('Whimsical')).toBeInTheDocument();
  });

  it('renders back button that calls onBack', async () => {
    const handleBack = vi.fn();
    const user = userEvent.setup();

    render(
      <ComponentChoice
        componentId={'tenor' as ComponentId}
        currentValue={null}
        onConfirm={vi.fn()}
        onBack={handleBack}
      />
    );

    await user.click(screen.getByText(/return to attuning/i));
    expect(handleBack).toHaveBeenCalledOnce();
  });

  it('disables confirm button when no selection made', () => {
    render(
      <ComponentChoice
        componentId={'tenor' as ComponentId}
        currentValue={null}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />
    );

    const button = screen.getByText(/select tenor/i);
    expect(button).toBeDisabled();
  });

  it('enables confirm button after selecting a card', async () => {
    const user = userEvent.setup();

    render(
      <ComponentChoice
        componentId={'tenor' as ComponentId}
        currentValue={null}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />
    );

    await user.click(screen.getByText('Balanced'));

    const button = screen.getByText(/select tenor/i);
    expect(button).not.toBeDisabled();
  });

  it('calls onConfirm with selected value for single-select', async () => {
    const handleConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <ComponentChoice
        componentId={'tenor' as ComponentId}
        currentValue={null}
        onConfirm={handleConfirm}
        onBack={vi.fn()}
      />
    );

    await user.click(screen.getByText('Balanced'));
    await user.click(screen.getByText(/select tenor/i));

    expect(handleConfirm).toHaveBeenCalledWith('tenor', 'balanced');
  });

  it('pre-selects current value when provided', () => {
    render(
      <ComponentChoice
        componentId={'tenor' as ComponentId}
        currentValue="balanced"
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />
    );

    const button = screen.getByText(/select tenor/i);
    expect(button).not.toBeDisabled();
  });

  it('renders multi-select cards for Threads', () => {
    render(
      <ComponentChoice
        componentId={'threads' as ComponentId}
        currentValue={[]}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText('Redemption & Sacrifice')).toBeInTheDocument();
    expect(screen.getByText('Identity & Legacy')).toBeInTheDocument();
    expect(screen.getByText('Found Family')).toBeInTheDocument();
    expect(screen.getByText('Power & Corruption')).toBeInTheDocument();
    expect(screen.getByText('Trust & Betrayal')).toBeInTheDocument();
    expect(screen.getByText('Survival & Justice')).toBeInTheDocument();
  });

  it('allows selecting up to 3 threads', async () => {
    const handleConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <ComponentChoice
        componentId={'threads' as ComponentId}
        currentValue={[]}
        onConfirm={handleConfirm}
        onBack={vi.fn()}
      />
    );

    await user.click(screen.getByText('Found Family'));
    await user.click(screen.getByText('Trust & Betrayal'));
    await user.click(screen.getByText('Survival & Justice'));
    await user.click(screen.getByText(/select threads/i));

    expect(handleConfirm).toHaveBeenCalledWith(
      'threads',
      expect.arrayContaining([
        'found-family',
        'trust-betrayal',
        'survival-justice',
      ])
    );
  });

  it('renders number-based options for Scenes', () => {
    render(
      <ComponentChoice
        componentId={'scenes' as ComponentId}
        currentValue={null}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText('3 Scenes')).toBeInTheDocument();
    expect(screen.getByText('4 Scenes')).toBeInTheDocument();
    expect(screen.getByText('5 Scenes')).toBeInTheDocument();
    expect(screen.getByText('6 Scenes')).toBeInTheDocument();
  });

  it('calls onConfirm with numeric value for Scenes', async () => {
    const handleConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <ComponentChoice
        componentId={'scenes' as ComponentId}
        currentValue={null}
        onConfirm={handleConfirm}
        onBack={vi.fn()}
      />
    );

    await user.click(screen.getByText('4 Scenes'));
    await user.click(screen.getByText(/select scenes/i));

    expect(handleConfirm).toHaveBeenCalledWith('scenes', 4);
  });
});
