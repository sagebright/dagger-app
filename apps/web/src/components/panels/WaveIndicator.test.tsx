/**
 * Tests for WaveIndicator component
 *
 * Verifies wave progress indicator renders with:
 * - Visible "Waves" label for discoverability
 * - Three dots for wave progress tracking
 * - Correct visual states: filled, active, dimmed, empty
 * - Accessible title tooltips on each dot
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WaveIndicator } from './WaveIndicator';

describe('WaveIndicator', () => {
  const defaultProps = {
    populatedWaves: new Set<1 | 2 | 3>(),
    activeWave: null,
    isWave3Dimmed: false,
  };

  it('renders three wave dots', () => {
    const { container } = render(<WaveIndicator {...defaultProps} />);
    const dots = container.querySelectorAll('.wave-dot');
    expect(dots).toHaveLength(3);
  });

  it('renders a visible "Waves" label', () => {
    render(<WaveIndicator {...defaultProps} />);
    expect(screen.getByText('Waves')).toBeInTheDocument();
  });

  it('renders wave-indicator container with aria-label', () => {
    const { container } = render(<WaveIndicator {...defaultProps} />);
    const indicator = container.querySelector('.wave-indicator');
    expect(indicator).toHaveAttribute('aria-label', 'Wave progress');
  });

  describe('dot states', () => {
    it('marks populated waves as filled', () => {
      const { container } = render(
        <WaveIndicator
          populatedWaves={new Set<1 | 2 | 3>([1, 2])}
          activeWave={null}
          isWave3Dimmed={false}
        />,
      );
      const dots = container.querySelectorAll('.wave-dot');
      expect(dots[0]).toHaveClass('wave-dot--filled');
      expect(dots[1]).toHaveClass('wave-dot--filled');
      expect(dots[2]).not.toHaveClass('wave-dot--filled');
    });

    it('marks the active wave with active class', () => {
      const { container } = render(
        <WaveIndicator
          populatedWaves={new Set<1 | 2 | 3>()}
          activeWave={2}
          isWave3Dimmed={false}
        />,
      );
      const dots = container.querySelectorAll('.wave-dot');
      expect(dots[0]).not.toHaveClass('wave-dot--active');
      expect(dots[1]).toHaveClass('wave-dot--active');
      expect(dots[2]).not.toHaveClass('wave-dot--active');
    });

    it('dims wave 3 when isWave3Dimmed is true and not filled', () => {
      const { container } = render(
        <WaveIndicator
          populatedWaves={new Set<1 | 2 | 3>()}
          activeWave={null}
          isWave3Dimmed={true}
        />,
      );
      const dots = container.querySelectorAll('.wave-dot');
      expect(dots[2]).toHaveClass('wave-dot--dimmed');
    });

    it('does not dim wave 3 when it is filled', () => {
      const { container } = render(
        <WaveIndicator
          populatedWaves={new Set<1 | 2 | 3>([3])}
          activeWave={null}
          isWave3Dimmed={true}
        />,
      );
      const dots = container.querySelectorAll('.wave-dot');
      expect(dots[2]).not.toHaveClass('wave-dot--dimmed');
    });
  });

  describe('tooltips', () => {
    it('shows descriptive title on each dot', () => {
      const { container } = render(
        <WaveIndicator
          populatedWaves={new Set<1 | 2 | 3>([1])}
          activeWave={null}
          isWave3Dimmed={true}
        />,
      );
      const dots = container.querySelectorAll('.wave-dot');
      expect(dots[0]).toHaveAttribute('title', 'Wave 1: Narrative (populated)');
      expect(dots[1]).toHaveAttribute('title', 'Wave 2: Entities (empty)');
      expect(dots[2]).toHaveAttribute('title', 'Wave 3: Synthesis (pending)');
    });
  });
});
