/**
 * MultiSelectChips Snapshot Tests
 *
 * Visual regression tests using Vitest's built-in snapshot capability.
 * Tests both light and dark mode states with selected/unselected/hover variants.
 * Issue #83: Unified button styling to match other dial buttons.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MultiSelectChips } from './MultiSelectChips';

const TEST_OPTIONS = [
  { id: 'redemption', label: 'Redemption' },
  { id: 'sacrifice', label: 'Sacrifice' },
  { id: 'identity', label: 'Identity' },
];

describe('MultiSelectChips Snapshots', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  describe('Light Mode', () => {
    it('renders with no selection', () => {
      const { container } = render(
        <MultiSelectChips
          options={TEST_OPTIONS}
          selected={[]}
          maxSelections={3}
          onChange={() => {}}
          label="Themes"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders with single selection', () => {
      const { container } = render(
        <MultiSelectChips
          options={TEST_OPTIONS}
          selected={['redemption']}
          maxSelections={3}
          onChange={() => {}}
          label="Themes"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders with multiple selections', () => {
      const { container } = render(
        <MultiSelectChips
          options={TEST_OPTIONS}
          selected={['redemption', 'sacrifice']}
          maxSelections={3}
          onChange={() => {}}
          label="Themes"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders at max selections (disabled unselected)', () => {
      const { container } = render(
        <MultiSelectChips
          options={TEST_OPTIONS}
          selected={['redemption', 'sacrifice', 'identity']}
          maxSelections={3}
          onChange={() => {}}
          label="Themes"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders disabled state', () => {
      const { container } = render(
        <MultiSelectChips
          options={TEST_OPTIONS}
          selected={['redemption']}
          maxSelections={3}
          onChange={() => {}}
          label="Themes"
          disabled
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Dark Mode', () => {
    beforeEach(() => {
      document.documentElement.classList.add('dark');
    });

    it('renders with no selection', () => {
      const { container } = render(
        <MultiSelectChips
          options={TEST_OPTIONS}
          selected={[]}
          maxSelections={3}
          onChange={() => {}}
          label="Themes"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders with single selection', () => {
      const { container } = render(
        <MultiSelectChips
          options={TEST_OPTIONS}
          selected={['redemption']}
          maxSelections={3}
          onChange={() => {}}
          label="Themes"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders with multiple selections', () => {
      const { container } = render(
        <MultiSelectChips
          options={TEST_OPTIONS}
          selected={['redemption', 'sacrifice']}
          maxSelections={3}
          onChange={() => {}}
          label="Themes"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders at max selections (disabled unselected)', () => {
      const { container } = render(
        <MultiSelectChips
          options={TEST_OPTIONS}
          selected={['redemption', 'sacrifice', 'identity']}
          maxSelections={3}
          onChange={() => {}}
          label="Themes"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders disabled state', () => {
      const { container } = render(
        <MultiSelectChips
          options={TEST_OPTIONS}
          selected={['redemption']}
          maxSelections={3}
          onChange={() => {}}
          label="Themes"
          disabled
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
