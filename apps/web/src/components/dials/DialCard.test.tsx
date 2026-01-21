/**
 * DialCard Component Tests
 *
 * TDD tests for the reusable card component displaying a single dial
 * with inline editing controls.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DialCard } from './DialCard';

describe('DialCard', () => {
  describe('rendering', () => {
    it('renders label', () => {
      render(
        <DialCard label="Party Size" value="4 players">
          <input type="text" data-testid="child-input" />
        </DialCard>
      );

      expect(screen.getByText('Party Size')).toBeInTheDocument();
    });

    it('renders children (inline control)', () => {
      render(
        <DialCard label="Party Size" value="4 players">
          <input type="text" data-testid="child-input" />
        </DialCard>
      );

      expect(screen.getByTestId('child-input')).toBeInTheDocument();
    });

    it('renders value display', () => {
      render(
        <DialCard label="Party Size" value="4 players">
          <span>Control</span>
        </DialCard>
      );

      expect(screen.getByText('4 players')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <DialCard
          label="Party Size"
          value="4 players"
          description="Number of players at your table"
        >
          <span>Control</span>
        </DialCard>
      );

      expect(screen.getByText('Number of players at your table')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      render(
        <DialCard label="Party Size" value="4 players">
          <span>Control</span>
        </DialCard>
      );

      // The component should not have a description paragraph
      const wrapper = screen.getByTestId('dial-card');
      const descriptions = wrapper.querySelectorAll('[data-testid="dial-card-description"]');
      expect(descriptions).toHaveLength(0);
    });

    it('applies custom className', () => {
      render(
        <DialCard label="Test" value="test" className="custom-class">
          <span>Control</span>
        </DialCard>
      );

      expect(screen.getByTestId('dial-card')).toHaveClass('custom-class');
    });

    it('supports ReactNode as value prop', () => {
      render(
        <DialCard
          label="Tier"
          value={<span data-testid="complex-value">Tier <strong>2</strong></span>}
        >
          <span>Control</span>
        </DialCard>
      );

      expect(screen.getByTestId('complex-value')).toBeInTheDocument();
    });
  });

  describe('required indicator', () => {
    it('shows required indicator when isRequired is true', () => {
      render(
        <DialCard label="Party Size" value="4 players" isRequired>
          <span>Control</span>
        </DialCard>
      );

      expect(screen.getByTestId('required-indicator')).toBeInTheDocument();
    });

    it('does not show required indicator when isRequired is false', () => {
      render(
        <DialCard label="Party Size" value="4 players" isRequired={false}>
          <span>Control</span>
        </DialCard>
      );

      expect(screen.queryByTestId('required-indicator')).not.toBeInTheDocument();
    });

    it('does not show required indicator by default', () => {
      render(
        <DialCard label="Party Size" value="4 players">
          <span>Control</span>
        </DialCard>
      );

      expect(screen.queryByTestId('required-indicator')).not.toBeInTheDocument();
    });
  });

  describe('isSet state', () => {
    it('applies set styling when isSet is true', () => {
      render(
        <DialCard label="Party Size" value="4 players" isSet>
          <span>Control</span>
        </DialCard>
      );

      const card = screen.getByTestId('dial-card');
      // Should have the "set" visual state
      expect(card).toHaveAttribute('data-set', 'true');
    });

    it('applies unset styling when isSet is false', () => {
      render(
        <DialCard label="Party Size" value="4 players" isSet={false}>
          <span>Control</span>
        </DialCard>
      );

      const card = screen.getByTestId('dial-card');
      expect(card).toHaveAttribute('data-set', 'false');
    });

    it('defaults to unset when isSet is not provided', () => {
      render(
        <DialCard label="Party Size" value="4 players">
          <span>Control</span>
        </DialCard>
      );

      const card = screen.getByTestId('dial-card');
      expect(card).toHaveAttribute('data-set', 'false');
    });
  });

  describe('responsive behavior', () => {
    it('has responsive width classes for mobile and desktop', () => {
      render(
        <DialCard label="Party Size" value="4 players">
          <span>Control</span>
        </DialCard>
      );

      const card = screen.getByTestId('dial-card');
      // Should be full width on mobile (w-full) and fit grid on larger screens
      expect(card).toHaveClass('w-full');
    });
  });

  describe('styling', () => {
    it('has border and shadow styling', () => {
      render(
        <DialCard label="Party Size" value="4 players">
          <span>Control</span>
        </DialCard>
      );

      const card = screen.getByTestId('dial-card');
      expect(card).toHaveClass('border');
    });

    it('uses fantasy theme border radius', () => {
      render(
        <DialCard label="Party Size" value="4 players">
          <span>Control</span>
        </DialCard>
      );

      const card = screen.getByTestId('dial-card');
      expect(card).toHaveClass('rounded-fantasy');
    });
  });

  describe('accessibility', () => {
    it('has accessible label structure', () => {
      render(
        <DialCard label="Party Size" value="4 players">
          <span>Control</span>
        </DialCard>
      );

      // Label should be present and accessible
      const label = screen.getByText('Party Size');
      expect(label.tagName.toLowerCase()).toBe('span');
    });

    it('required indicator has aria-hidden for screen readers', () => {
      render(
        <DialCard label="Party Size" value="4 players" isRequired>
          <span>Control</span>
        </DialCard>
      );

      const indicator = screen.getByTestId('required-indicator');
      expect(indicator).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
