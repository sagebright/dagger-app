/**
 * Tests for EchoGenerator component (Phase 4.3)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Echo, EchoCategory } from '@dagger-app/shared-types';
import { EchoGenerator } from './EchoGenerator';

// =============================================================================
// Test Data
// =============================================================================

const mockEchoes: Echo[] = [
  {
    id: 'echo-1',
    category: 'complications',
    title: 'The Bridge Collapses',
    content: 'The ancient bridge crumbles.',
    isConfirmed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'echo-2',
    category: 'complications',
    title: 'Sudden Storm',
    content: 'A fierce storm rolls in.',
    isConfirmed: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'echo-3',
    category: 'rumors',
    title: 'Whispers of Treasure',
    content: 'Locals speak of gold.',
    isConfirmed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'echo-4',
    category: 'discoveries',
    title: 'Ancient Tome',
    content: 'A dusty book reveals secrets.',
    isConfirmed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'echo-5',
    category: 'intrusions',
    title: 'Shadowy Figure',
    content: 'Someone watches from afar.',
    isConfirmed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'echo-6',
    category: 'wonders',
    title: 'Aurora',
    content: 'Magical lights in the sky.',
    isConfirmed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

const allCategories: EchoCategory[] = [
  'complications',
  'rumors',
  'discoveries',
  'intrusions',
  'wonders',
];

// =============================================================================
// Tests
// =============================================================================

describe('EchoGenerator', () => {
  const defaultProps = {
    echoes: mockEchoes,
    activeCategory: 'complications' as EchoCategory,
    onCategoryChange: vi.fn(),
    onGenerate: vi.fn(),
    onConfirm: vi.fn(),
    onConfirmAll: vi.fn(),
    onEdit: vi.fn(),
    onRegenerate: vi.fn(),
    isLoading: false,
    streamingContent: null as string | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all category tabs', () => {
      render(<EchoGenerator {...defaultProps} />);
      allCategories.forEach((category) => {
        expect(screen.getByRole('tab', { name: new RegExp(category, 'i') })).toBeInTheDocument();
      });
    });

    it('renders echoes for active category', () => {
      render(<EchoGenerator {...defaultProps} />);
      // Should show complications (2 echoes)
      expect(screen.getByText('The Bridge Collapses')).toBeInTheDocument();
      expect(screen.getByText('Sudden Storm')).toBeInTheDocument();
      // Should not show rumors
      expect(screen.queryByText('Whispers of Treasure')).not.toBeInTheDocument();
    });

    it('renders generate button', () => {
      render(<EchoGenerator {...defaultProps} />);
      expect(screen.getByRole('button', { name: /generate echoes/i })).toBeInTheDocument();
    });

    it('renders confirm all button when echoes exist', () => {
      render(<EchoGenerator {...defaultProps} />);
      expect(screen.getByRole('button', { name: /confirm all/i })).toBeInTheDocument();
    });

    it('does not render confirm all button when no echoes', () => {
      render(<EchoGenerator {...defaultProps} echoes={[]} />);
      expect(screen.queryByRole('button', { name: /confirm all/i })).not.toBeInTheDocument();
    });
  });

  describe('category tabs', () => {
    it('shows active category tab as selected', () => {
      render(<EchoGenerator {...defaultProps} activeCategory="rumors" />);
      const rumorsTab = screen.getByRole('tab', { name: /rumors/i });
      expect(rumorsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('calls onCategoryChange when tab clicked', () => {
      render(<EchoGenerator {...defaultProps} />);
      fireEvent.click(screen.getByRole('tab', { name: /rumors/i }));
      expect(defaultProps.onCategoryChange).toHaveBeenCalledWith('rumors');
    });

    it('displays category counts on tabs', () => {
      render(<EchoGenerator {...defaultProps} />);
      // complications has 2 echoes
      expect(screen.getByRole('tab', { name: /complications/i })).toHaveTextContent('2');
      // rumors has 1 echo
      expect(screen.getByRole('tab', { name: /rumors/i })).toHaveTextContent('1');
    });
  });

  describe('generation', () => {
    it('calls onGenerate when generate button clicked', () => {
      render(<EchoGenerator {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /generate echoes/i }));
      expect(defaultProps.onGenerate).toHaveBeenCalled();
    });

    it('disables generate button when loading', () => {
      render(<EchoGenerator {...defaultProps} isLoading />);
      expect(screen.getByRole('button', { name: /generate echoes/i })).toBeDisabled();
    });

    it('shows streaming content when generating', () => {
      render(<EchoGenerator {...defaultProps} isLoading streamingContent="Generating..." />);
      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('shows loading indicator when generating', () => {
      render(<EchoGenerator {...defaultProps} isLoading />);
      // Multiple status elements may exist (spinner in header and in cards)
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  describe('confirm all', () => {
    it('calls onConfirmAll when confirm all clicked', () => {
      render(<EchoGenerator {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /confirm all/i }));
      expect(defaultProps.onConfirmAll).toHaveBeenCalled();
    });

    it('disables confirm all when loading', () => {
      render(<EchoGenerator {...defaultProps} isLoading />);
      expect(screen.getByRole('button', { name: /confirm all/i })).toBeDisabled();
    });

    it('disables confirm all when all echoes confirmed', () => {
      const allConfirmed = mockEchoes.map((e) => ({ ...e, isConfirmed: true }));
      render(<EchoGenerator {...defaultProps} echoes={allConfirmed} />);
      expect(screen.getByRole('button', { name: /confirm all/i })).toBeDisabled();
    });
  });

  describe('echo card interactions', () => {
    it('passes onConfirm to EchoCard', () => {
      render(<EchoGenerator {...defaultProps} />);
      const confirmButtons = screen.getAllByRole('button', { name: /^confirm$/i });
      fireEvent.click(confirmButtons[0]);
      expect(defaultProps.onConfirm).toHaveBeenCalledWith('echo-1');
    });

    it('passes onEdit to EchoCard', () => {
      render(<EchoGenerator {...defaultProps} />);
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);
      expect(defaultProps.onEdit).toHaveBeenCalledWith('echo-1');
    });

    it('passes onRegenerate to EchoCard', () => {
      render(<EchoGenerator {...defaultProps} />);
      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate/i });
      fireEvent.click(regenerateButtons[0]);
      expect(defaultProps.onRegenerate).toHaveBeenCalledWith('echo-1');
    });
  });

  describe('empty state', () => {
    it('shows empty state for category with no echoes', () => {
      render(<EchoGenerator {...defaultProps} activeCategory="wonders" echoes={[]} />);
      expect(screen.getByText(/no echoes generated/i)).toBeInTheDocument();
    });

    it('shows generate prompt in empty state', () => {
      render(<EchoGenerator {...defaultProps} echoes={[]} />);
      expect(screen.getByText(/generate some echoes/i)).toBeInTheDocument();
    });
  });

  describe('summary', () => {
    it('shows total echo count', () => {
      render(<EchoGenerator {...defaultProps} />);
      expect(screen.getByText(/6 total/i)).toBeInTheDocument();
    });

    it('shows confirmed count', () => {
      render(<EchoGenerator {...defaultProps} />);
      expect(screen.getByText(/1 confirmed/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper tablist role for category tabs', () => {
      render(<EchoGenerator {...defaultProps} />);
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('has proper tabpanel for echo list', () => {
      render(<EchoGenerator {...defaultProps} />);
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('supports keyboard navigation between tabs', () => {
      render(<EchoGenerator {...defaultProps} />);
      const firstTab = screen.getByRole('tab', { name: /complications/i });
      firstTab.focus();
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      expect(defaultProps.onCategoryChange).toHaveBeenCalledWith('rumors');
    });
  });

  describe('error state', () => {
    it('displays error message when error prop provided', () => {
      render(<EchoGenerator {...defaultProps} error="Generation failed" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Generation failed');
    });

    it('allows retry when error occurs', () => {
      render(<EchoGenerator {...defaultProps} error="Generation failed" />);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
});
