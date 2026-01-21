/**
 * DialGroup Component Tests
 *
 * TDD tests for the container component that groups related dials
 * with a header and responsive grid layout.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DialGroup } from './DialGroup';

describe('DialGroup', () => {
  describe('rendering', () => {
    it('renders title', () => {
      render(
        <DialGroup title="Party">
          <div data-testid="child-1">Child 1</div>
        </DialGroup>
      );

      expect(screen.getByText('Party')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <DialGroup title="Party">
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </DialGroup>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('renders multiple children in grid container', () => {
      render(
        <DialGroup title="Session">
          <div data-testid="dial-1">Dial 1</div>
          <div data-testid="dial-2">Dial 2</div>
          <div data-testid="dial-3">Dial 3</div>
        </DialGroup>
      );

      const grid = screen.getByTestId('dial-group-grid');
      expect(grid).toBeInTheDocument();
      expect(grid.children).toHaveLength(3);
    });
  });

  describe('section header', () => {
    it('has section element with role="group"', () => {
      render(
        <DialGroup title="Party">
          <div>Child</div>
        </DialGroup>
      );

      const section = screen.getByRole('group');
      expect(section).toBeInTheDocument();
    });

    it('has accessible name matching title', () => {
      render(
        <DialGroup title="Party">
          <div>Child</div>
        </DialGroup>
      );

      const section = screen.getByRole('group', { name: 'Party' });
      expect(section).toBeInTheDocument();
    });

    it('renders decorative line element', () => {
      render(
        <DialGroup title="Atmosphere">
          <div>Child</div>
        </DialGroup>
      );

      const decorativeLine = screen.getByTestId('dial-group-decorative-line');
      expect(decorativeLine).toBeInTheDocument();
    });

    it('renders title in header element', () => {
      render(
        <DialGroup title="Themes">
          <div>Child</div>
        </DialGroup>
      );

      const header = screen.getByTestId('dial-group-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('Themes');
    });
  });

  describe('responsive grid layout', () => {
    it('has grid display class', () => {
      render(
        <DialGroup title="Party">
          <div>Child</div>
        </DialGroup>
      );

      const grid = screen.getByTestId('dial-group-grid');
      expect(grid).toHaveClass('grid');
    });

    it('has mobile-first single column class', () => {
      render(
        <DialGroup title="Party">
          <div>Child</div>
        </DialGroup>
      );

      const grid = screen.getByTestId('dial-group-grid');
      expect(grid).toHaveClass('grid-cols-1');
    });

    it('has tablet breakpoint two column class', () => {
      render(
        <DialGroup title="Party">
          <div>Child</div>
        </DialGroup>
      );

      const grid = screen.getByTestId('dial-group-grid');
      expect(grid).toHaveClass('md:grid-cols-2');
    });

    it('has desktop breakpoint three column class', () => {
      render(
        <DialGroup title="Party">
          <div>Child</div>
        </DialGroup>
      );

      const grid = screen.getByTestId('dial-group-grid');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });

    it('has consistent gap between grid items', () => {
      render(
        <DialGroup title="Party">
          <div>Child</div>
        </DialGroup>
      );

      const grid = screen.getByTestId('dial-group-grid');
      // Should have a gap class for spacing
      expect(grid.className).toMatch(/gap-\d+/);
    });
  });

  describe('styling', () => {
    it('has fantasy-themed header styling', () => {
      render(
        <DialGroup title="Party">
          <div>Child</div>
        </DialGroup>
      );

      const header = screen.getByTestId('dial-group-header');
      // Should use serif font for fantasy theme
      expect(header).toHaveClass('font-serif');
    });

    it('has proper spacing between header and grid', () => {
      render(
        <DialGroup title="Party">
          <div>Child</div>
        </DialGroup>
      );

      const wrapper = screen.getByTestId('dial-group');
      // Should have flex-col with gap for spacing
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('flex-col');
    });
  });

  describe('accessibility', () => {
    it('has aria-labelledby linking section to title', () => {
      render(
        <DialGroup title="Party">
          <div>Child</div>
        </DialGroup>
      );

      const section = screen.getByRole('group');
      const headerId = section.getAttribute('aria-labelledby');
      expect(headerId).toBeTruthy();

      const header = document.getElementById(headerId!);
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('Party');
    });

    it('decorative line has aria-hidden', () => {
      render(
        <DialGroup title="Party">
          <div>Child</div>
        </DialGroup>
      );

      const decorativeLine = screen.getByTestId('dial-group-decorative-line');
      expect(decorativeLine).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('edge cases', () => {
    it('renders with single child', () => {
      render(
        <DialGroup title="Solo">
          <div data-testid="only-child">Only Child</div>
        </DialGroup>
      );

      expect(screen.getByTestId('only-child')).toBeInTheDocument();
    });

    it('handles long title text', () => {
      const longTitle = 'This is a very long section title for testing';
      render(
        <DialGroup title={longTitle}>
          <div>Child</div>
        </DialGroup>
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('renders empty children array gracefully', () => {
      render(
        <DialGroup title="Empty">
          {[]}
        </DialGroup>
      );

      const grid = screen.getByTestId('dial-group-grid');
      expect(grid.children).toHaveLength(0);
    });
  });
});
