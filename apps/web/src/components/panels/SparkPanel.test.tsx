/**
 * Tests for SparkPanel component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SparkPanel } from './SparkPanel';

describe('SparkPanel', () => {
  it('renders placeholder when spark is null', () => {
    render(
      <SparkPanel spark={null} isReady={false} onAdvance={vi.fn()} />
    );

    expect(
      screen.getByText(/your spark will appear here/i)
    ).toBeInTheDocument();
  });

  it('renders spark content when spark is provided', () => {
    const spark = {
      name: 'The Hollow Vigil',
      vision: 'A mystery in a haunted mansion',
    };

    const { container } = render(
      <SparkPanel spark={spark} isReady={false} onAdvance={vi.fn()} />
    );

    // RevealText splits text into individual word spans for animation;
    // use toHaveTextContent which checks across child elements
    expect(container).toHaveTextContent('The Hollow Vigil');
    expect(container).toHaveTextContent('A mystery in a haunted mansion');
  });

  it('renders disabled Continue button when not ready', () => {
    render(
      <SparkPanel spark={null} isReady={false} onAdvance={vi.fn()} />
    );

    const button = screen.getByText('Continue to Attuning');
    expect(button).toBeDisabled();
  });

  it('renders enabled Continue button when ready', () => {
    const spark = { name: 'Test', vision: 'Test vision' };

    render(
      <SparkPanel spark={spark} isReady={true} onAdvance={vi.fn()} />
    );

    const button = screen.getByText('Continue to Attuning');
    expect(button).not.toBeDisabled();
  });

  it('calls onAdvance when Continue button is clicked', async () => {
    const handleAdvance = vi.fn();
    const user = userEvent.setup();
    const spark = { name: 'Test', vision: 'Test vision' };

    render(
      <SparkPanel spark={spark} isReady={true} onAdvance={handleAdvance} />
    );

    const button = screen.getByText('Continue to Attuning');
    await user.click(button);

    expect(handleAdvance).toHaveBeenCalledOnce();
  });

  it('renders Invoking header and Spark section', () => {
    render(
      <SparkPanel spark={null} isReady={false} onAdvance={vi.fn()} />
    );

    expect(screen.getByText('Invoking')).toBeInTheDocument();
    expect(screen.getByText('Spark')).toBeInTheDocument();
    expect(
      screen.getByText("What's the seed of your adventure?")
    ).toBeInTheDocument();
  });
});
