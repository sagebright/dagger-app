/**
 * Tests for StageDropdown component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { StageDropdown } from './StageDropdown';

describe('StageDropdown', () => {
  it('renders the current stage name', () => {
    render(<StageDropdown currentStage="binding" />);

    expect(screen.getByText('Binding')).toBeInTheDocument();
  });

  it('renders the stage description', () => {
    render(<StageDropdown currentStage="binding" />);

    expect(
      screen.getByText('Which frame holds the story?')
    ).toBeInTheDocument();
  });

  it('does not show dropdown menu initially', () => {
    render(<StageDropdown currentStage="binding" />);

    // The menu items should not be visible
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();

    render(<StageDropdown currentStage="binding" />);

    const trigger = screen.getByRole('button', { expanded: false });
    await user.click(trigger);

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('shows all 6 stages in the dropdown', async () => {
    const user = userEvent.setup();

    render(<StageDropdown currentStage="binding" />);

    const trigger = screen.getByRole('button', { expanded: false });
    await user.click(trigger);

    expect(screen.getByText('Invoking')).toBeInTheDocument();
    expect(screen.getByText('Attuning')).toBeInTheDocument();
    // Binding appears both in trigger and menu
    const bindingItems = screen.getAllByText('Binding');
    expect(bindingItems.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Weaving')).toBeInTheDocument();
    expect(screen.getByText('Inscribing')).toBeInTheDocument();
    expect(screen.getByText('Delivering')).toBeInTheDocument();
  });

  it('marks past stages as completed and clickable', async () => {
    const handleNavigate = vi.fn();
    const user = userEvent.setup();

    render(
      <StageDropdown currentStage="binding" onNavigate={handleNavigate} />
    );

    const trigger = screen.getByRole('button', { expanded: false });
    await user.click(trigger);

    // Invoking should be a completed stage (clickable)
    const invokingItem = screen.getByRole('menuitem', { name: /invoking/i });
    expect(invokingItem).not.toBeDisabled();

    await user.click(invokingItem);
    expect(handleNavigate).toHaveBeenCalledWith('invoking');
  });

  it('marks future stages as disabled', async () => {
    const user = userEvent.setup();

    render(<StageDropdown currentStage="binding" />);

    const trigger = screen.getByRole('button', { expanded: false });
    await user.click(trigger);

    // Weaving should be a future stage (disabled)
    const weavingItem = screen.getByRole('menuitem', { name: /weaving/i });
    expect(weavingItem).toBeDisabled();
  });

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup();

    render(<StageDropdown currentStage="binding" />);

    const trigger = screen.getByRole('button', { expanded: false });
    await user.click(trigger);

    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
