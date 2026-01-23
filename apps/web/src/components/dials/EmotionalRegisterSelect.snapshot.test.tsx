/**
 * EmotionalRegisterSelect Snapshot Tests
 *
 * Visual regression tests using Vitest's built-in snapshot capability.
 * Tests both light and dark mode states with AI example stubs visible.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { EmotionalRegisterSelect } from './EmotionalRegisterSelect';

describe('EmotionalRegisterSelect Snapshots', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  describe('Light Mode', () => {
    it('renders thrilling register selected with AI example', () => {
      const { container } = render(
        <EmotionalRegisterSelect value="thrilling" onChange={() => {}} label="Emotional Register" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders heartfelt register selected with AI example', () => {
      const { container } = render(
        <EmotionalRegisterSelect value="heartfelt" onChange={() => {}} label="Emotional Register" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders epic register selected with AI example', () => {
      const { container } = render(
        <EmotionalRegisterSelect value="epic" onChange={() => {}} label="Emotional Register" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders disabled state with AI examples', () => {
      const { container } = render(
        <EmotionalRegisterSelect value="tense" onChange={() => {}} label="Emotional Register" disabled />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Dark Mode', () => {
    beforeEach(() => {
      document.documentElement.classList.add('dark');
    });

    it('renders thrilling register selected with AI example', () => {
      const { container } = render(
        <EmotionalRegisterSelect value="thrilling" onChange={() => {}} label="Emotional Register" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders bittersweet register selected with AI example', () => {
      const { container } = render(
        <EmotionalRegisterSelect value="bittersweet" onChange={() => {}} label="Emotional Register" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders disabled state with AI examples', () => {
      const { container } = render(
        <EmotionalRegisterSelect value="heartfelt" onChange={() => {}} label="Emotional Register" disabled />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Default vs Confirmed States', () => {
    it('renders default (unconfirmed) state with AI examples', () => {
      const { container } = render(
        <EmotionalRegisterSelect
          value="heartfelt"
          onChange={() => {}}
          label="Emotional Register"
          isDefault={true}
          isConfirmed={false}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders confirmed state with AI examples', () => {
      const { container } = render(
        <EmotionalRegisterSelect
          value="heartfelt"
          onChange={() => {}}
          label="Emotional Register"
          isDefault={true}
          isConfirmed={true}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders default state with AI examples in dark mode', () => {
      document.documentElement.classList.add('dark');
      const { container } = render(
        <EmotionalRegisterSelect
          value="tense"
          onChange={() => {}}
          label="Emotional Register"
          isDefault={true}
          isConfirmed={false}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
      document.documentElement.classList.remove('dark');
    });
  });
});
