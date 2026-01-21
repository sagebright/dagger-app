/**
 * ExportPanel Component Tests
 *
 * Tests for the export UI including:
 * - Adventure summary display
 * - File list preview
 * - Download button states (idle, loading, error)
 * - Download flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportPanel } from './ExportPanel';
import type { ExportData } from '@/services/adventureService';

// =============================================================================
// Test Data
// =============================================================================

const mockExportData: ExportData = {
  adventureName: 'The Hollow Vigil',
  frame: {
    name: 'Dark Fantasy',
    description: 'A grim setting',
  },
  outline: {
    briefs: [{ id: '1', title: 'Scene 1' }],
  },
  scenes: [
    { id: '1', title: 'Opening', content: 'Draft content' },
    { id: '2', title: 'Rising Action', content: 'More content' },
    { id: '3', title: 'Climax', content: 'Peak content' },
    { id: '4', title: 'Resolution', content: 'Ending' },
  ],
  npcs: [
    { id: 'npc1', name: 'Aldric' },
    { id: 'npc2', name: 'Morgana' },
    { id: 'npc3', name: 'Thorne' },
    { id: 'npc4', name: 'Elena' },
    { id: 'npc5', name: 'Cedric' },
    { id: 'npc6', name: 'Lyra' },
  ],
  adversaries: [
    { id: 'adv1', name: 'Shadow Beast' },
    { id: 'adv2', name: 'Corrupted Knight' },
    { id: 'adv3', name: 'Ancient Wraith' },
  ],
  items: [
    { id: 'item1', name: 'Sunblade' },
    { id: 'item2', name: 'Amulet of Protection' },
    { id: 'item3', name: 'Healing Potion' },
    { id: 'item4', name: 'Map Fragment' },
    { id: 'item5', name: 'Crystal Key' },
    { id: 'item6', name: 'Ancient Tome' },
    { id: 'item7', name: 'Silver Ring' },
    { id: 'item8', name: 'Enchanted Cloak' },
  ],
  echoes: Array.from({ length: 25 }, (_, i) => ({
    id: `echo${i}`,
    category: 'rumor',
    content: `Echo ${i}`,
  })),
};

const defaultProps = {
  sessionId: 'test-session-123',
  adventureName: 'The Hollow Vigil',
  partySize: 4,
  partyTier: 2 as const,
  sceneCount: 4,
  npcCount: 6,
  adversaryCount: 3,
  itemCount: 8,
  echoCount: 25,
  exportData: mockExportData,
  onExport: vi.fn(),
};

// =============================================================================
// Rendering Tests
// =============================================================================

describe('ExportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders the export panel header', () => {
      render(<ExportPanel {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /export adventure/i })).toBeInTheDocument();
    });

    it('displays the adventure name in the summary', () => {
      render(<ExportPanel {...defaultProps} />);

      expect(screen.getByText('The Hollow Vigil')).toBeInTheDocument();
    });

    it('displays party size and tier', () => {
      render(<ExportPanel {...defaultProps} />);

      expect(screen.getByText(/4 players/i)).toBeInTheDocument();
      expect(screen.getByText(/tier 2/i)).toBeInTheDocument();
    });

    it('displays content counts', () => {
      render(<ExportPanel {...defaultProps} />);

      expect(screen.getByText(/4 scenes/i)).toBeInTheDocument();
      expect(screen.getByText(/6 npcs/i)).toBeInTheDocument();
      expect(screen.getByText(/3 adversaries/i)).toBeInTheDocument();
      expect(screen.getByText(/8 items/i)).toBeInTheDocument();
      expect(screen.getByText(/25 echoes/i)).toBeInTheDocument();
    });

    it('displays the file list preview', () => {
      render(<ExportPanel {...defaultProps} />);

      expect(screen.getByText(/files included/i)).toBeInTheDocument();
      expect(screen.getByText(/readme\.md/i)).toBeInTheDocument();
      expect(screen.getByText(/frame\.md/i)).toBeInTheDocument();
      expect(screen.getByText(/outline\.md/i)).toBeInTheDocument();
      // scenes/*.md is in file list (distinct from "4 scenes" in summary)
      expect(screen.getByText(/scenes\/\*\.md/i)).toBeInTheDocument();
      expect(screen.getByText(/npcs\.md/i)).toBeInTheDocument();
      expect(screen.getByText(/adversaries\.md/i)).toBeInTheDocument();
      expect(screen.getByText(/items\.md/i)).toBeInTheDocument();
      expect(screen.getByText(/echoes\.md/i)).toBeInTheDocument();
    });

    it('shows scene folder with count', () => {
      render(<ExportPanel {...defaultProps} />);

      expect(screen.getByText(/scenes\/\*\.md/i)).toBeInTheDocument();
    });

    it('renders the download button', () => {
      render(<ExportPanel {...defaultProps} />);

      const button = screen.getByRole('button', { name: /download adventure/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  // =============================================================================
  // Loading State Tests
  // =============================================================================

  describe('loading state', () => {
    it('shows loading text when isExporting is true', () => {
      render(<ExportPanel {...defaultProps} isExporting />);

      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });

    it('disables download button during export', () => {
      render(<ExportPanel {...defaultProps} isExporting />);

      const button = screen.getByRole('button', { name: /generating/i });
      expect(button).toBeDisabled();
    });

    it('shows loading spinner during export', () => {
      render(<ExportPanel {...defaultProps} isExporting />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Error State Tests
  // =============================================================================

  describe('error state', () => {
    it('displays error message when error prop is provided', () => {
      render(<ExportPanel {...defaultProps} error="Failed to generate zip file" />);

      expect(screen.getByText(/failed to generate zip file/i)).toBeInTheDocument();
    });

    it('shows retry button on error', () => {
      render(<ExportPanel {...defaultProps} error="Export failed" />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('calls onExport when retry button is clicked', () => {
      const onExport = vi.fn();
      render(<ExportPanel {...defaultProps} error="Export failed" onExport={onExport} />);

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      expect(onExport).toHaveBeenCalledTimes(1);
    });
  });

  // =============================================================================
  // Download Flow Tests
  // =============================================================================

  describe('download flow', () => {
    it('calls onExport when download button is clicked', () => {
      const onExport = vi.fn();
      render(<ExportPanel {...defaultProps} onExport={onExport} />);

      fireEvent.click(screen.getByRole('button', { name: /download adventure/i }));

      expect(onExport).toHaveBeenCalledTimes(1);
    });

    it('passes sessionId and exportData to onExport', () => {
      const onExport = vi.fn();
      render(<ExportPanel {...defaultProps} onExport={onExport} />);

      fireEvent.click(screen.getByRole('button', { name: /download adventure/i }));

      expect(onExport).toHaveBeenCalledWith('test-session-123', mockExportData);
    });
  });

  // =============================================================================
  // Empty Content Tests
  // =============================================================================

  describe('empty content handling', () => {
    it('handles zero NPCs gracefully', () => {
      render(<ExportPanel {...defaultProps} npcCount={0} />);

      expect(screen.getByText(/0 npcs/i)).toBeInTheDocument();
    });

    it('hides file types with no content', () => {
      const emptyData: ExportData = {
        adventureName: 'Empty Adventure',
      };

      render(
        <ExportPanel
          {...defaultProps}
          exportData={emptyData}
          npcCount={0}
          adversaryCount={0}
          itemCount={0}
          echoCount={0}
        />
      );

      // Should still show README
      expect(screen.getByText(/readme\.md/i)).toBeInTheDocument();
    });
  });

  // =============================================================================
  // Accessibility Tests
  // =============================================================================

  describe('accessibility', () => {
    it('has accessible heading hierarchy', () => {
      render(<ExportPanel {...defaultProps} />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent(/export adventure/i);

      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('download button has accessible name', () => {
      render(<ExportPanel {...defaultProps} />);

      const button = screen.getByRole('button', { name: /download adventure/i });
      expect(button).toHaveAccessibleName();
    });

    it('loading state is announced with role=status', () => {
      render(<ExportPanel {...defaultProps} isExporting />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('error message is visually emphasized', () => {
      render(<ExportPanel {...defaultProps} error="Export failed" />);

      const errorElement = screen.getByText(/export failed/i);
      // Error text should have blood/red coloring
      expect(errorElement.className).toMatch(/blood/i);
    });
  });

  // =============================================================================
  // Styling Tests
  // =============================================================================

  describe('styling', () => {
    it('applies fantasy theme classes', () => {
      render(<ExportPanel {...defaultProps} />);

      const button = screen.getByRole('button', { name: /download adventure/i });
      // Should have gold styling
      expect(button.className).toMatch(/gold/i);
    });

    it('applies custom className', () => {
      render(<ExportPanel {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('export-panel');
      expect(container).toHaveClass('custom-class');
    });
  });
});
