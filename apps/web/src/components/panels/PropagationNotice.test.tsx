/**
 * Tests for PropagationNotice component
 *
 * Verifies:
 * - Deterministic notice renders name change summary
 * - Semantic notice renders affected sections and suggested action
 * - Dismiss button calls onDismiss
 * - Auto-dismiss fires after timeout
 * - ARIA attributes for accessibility
 */

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PropagationNotice,
  type DeterministicNoticeData,
  type SemanticNoticeData,
} from './PropagationNotice';

// =============================================================================
// Fixtures
// =============================================================================

const DETERMINISTIC_NOTICE: DeterministicNoticeData = {
  type: 'deterministic',
  oldName: 'Aldric',
  newName: 'Theron',
  updatedSections: [
    { sectionId: 'setup', replacementCount: 2 },
    { sectionId: 'developments', replacementCount: 1 },
    { sectionId: 'gm_notes', replacementCount: 1 },
  ],
  totalReplacements: 4,
};

const SEMANTIC_NOTICE: SemanticNoticeData = {
  type: 'semantic',
  entityName: 'Aldric',
  changeType: 'motivation',
  affectedSectionIds: ['setup', 'developments'],
  suggestedAction:
    'Please update all references to Aldric to reflect the motivation change.',
};

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// =============================================================================
// Deterministic Notice
// =============================================================================

describe('PropagationNotice - deterministic', () => {
  it('renders the old and new name', () => {
    render(
      <PropagationNotice
        notice={DETERMINISTIC_NOTICE}
        onDismiss={vi.fn()}
        autoDismissMs={0}
      />
    );

    expect(screen.getByText('Aldric')).toBeInTheDocument();
    expect(screen.getByText('Theron')).toBeInTheDocument();
  });

  it('renders the title "Name Propagated"', () => {
    render(
      <PropagationNotice
        notice={DETERMINISTIC_NOTICE}
        onDismiss={vi.fn()}
        autoDismissMs={0}
      />
    );

    expect(screen.getByText('Name Propagated')).toBeInTheDocument();
  });

  it('renders updated section names', () => {
    render(
      <PropagationNotice
        notice={DETERMINISTIC_NOTICE}
        onDismiss={vi.fn()}
        autoDismissMs={0}
      />
    );

    expect(screen.getByText('Setup')).toBeInTheDocument();
    expect(screen.getByText('Developments')).toBeInTheDocument();
    expect(screen.getByText('GM Notes')).toBeInTheDocument();
  });

  it('renders the replacement count badges', () => {
    render(
      <PropagationNotice
        notice={DETERMINISTIC_NOTICE}
        onDismiss={vi.fn()}
        autoDismissMs={0}
      />
    );

    expect(screen.getByText('2x')).toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(
      <PropagationNotice
        notice={DETERMINISTIC_NOTICE}
        onDismiss={vi.fn()}
        autoDismissMs={0}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// =============================================================================
// Semantic Notice
// =============================================================================

describe('PropagationNotice - semantic', () => {
  it('renders the entity name and change type', () => {
    render(
      <PropagationNotice
        notice={SEMANTIC_NOTICE}
        onDismiss={vi.fn()}
        autoDismissMs={0}
      />
    );

    expect(screen.getByText('Aldric')).toBeInTheDocument();
    expect(screen.getByText('Semantic Change Detected')).toBeInTheDocument();
  });

  it('renders affected section names', () => {
    render(
      <PropagationNotice
        notice={SEMANTIC_NOTICE}
        onDismiss={vi.fn()}
        autoDismissMs={0}
      />
    );

    expect(screen.getByText('Setup')).toBeInTheDocument();
    expect(screen.getByText('Developments')).toBeInTheDocument();
  });

  it('renders the suggested action', () => {
    render(
      <PropagationNotice
        notice={SEMANTIC_NOTICE}
        onDismiss={vi.fn()}
        autoDismissMs={0}
      />
    );

    expect(
      screen.getByText(/Please update all references/)
    ).toBeInTheDocument();
  });

  it('renders "needs review" badges', () => {
    render(
      <PropagationNotice
        notice={SEMANTIC_NOTICE}
        onDismiss={vi.fn()}
        autoDismissMs={0}
      />
    );

    const badges = screen.getAllByText('needs review');
    expect(badges).toHaveLength(2);
  });
});

// =============================================================================
// Dismiss Behavior
// =============================================================================

describe('PropagationNotice - dismiss', () => {
  it('calls onDismiss when close button is clicked', () => {
    const handleDismiss = vi.fn();

    render(
      <PropagationNotice
        notice={DETERMINISTIC_NOTICE}
        onDismiss={handleDismiss}
        autoDismissMs={0}
      />
    );

    const closeButton = screen.getByRole('button', {
      name: 'Dismiss propagation notice',
    });

    act(() => {
      closeButton.click();
    });

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after the timeout', () => {
    const handleDismiss = vi.fn();

    render(
      <PropagationNotice
        notice={DETERMINISTIC_NOTICE}
        onDismiss={handleDismiss}
        autoDismissMs={5000}
      />
    );

    expect(handleDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not auto-dismiss when autoDismissMs is 0', () => {
    const handleDismiss = vi.fn();

    render(
      <PropagationNotice
        notice={DETERMINISTIC_NOTICE}
        onDismiss={handleDismiss}
        autoDismissMs={0}
      />
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(handleDismiss).not.toHaveBeenCalled();
  });
});
