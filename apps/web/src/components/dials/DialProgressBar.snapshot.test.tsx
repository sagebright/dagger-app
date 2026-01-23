/**
 * DialProgressBar Snapshot Tests
 *
 * Visual regression tests using Vitest's built-in snapshot capability.
 * These tests capture the rendered HTML structure to detect unintended UI changes.
 *
 * Usage:
 * - Run tests: pnpm test
 * - Update snapshots: pnpm test -- -u (or pnpm --filter web test -- -u)
 *
 * When to update snapshots:
 * - After intentional UI changes
 * - Review snapshot diffs carefully before updating
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DialProgressBar } from './DialProgressBar';

describe('DialProgressBar Snapshots', () => {
  it('renders empty progress state', () => {
    const { container } = render(
      <DialProgressBar confirmedCount={0} totalCount={14} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders partial progress state', () => {
    const { container } = render(
      <DialProgressBar confirmedCount={7} totalCount={14} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders complete progress state', () => {
    const { container } = render(
      <DialProgressBar confirmedCount={14} totalCount={14} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom className', () => {
    const { container } = render(
      <DialProgressBar
        confirmedCount={5}
        totalCount={10}
        className="mt-4 mb-2"
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
