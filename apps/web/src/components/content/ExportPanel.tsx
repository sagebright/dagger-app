/**
 * ExportPanel Component
 *
 * Export UI for the complete phase with:
 * - Adventure summary section (name, party size/tier, content counts)
 * - File list preview showing what will be in the zip
 * - Download button with loading/error states
 * Fantasy-themed styling with parchment backgrounds and gold accents.
 */

import { useCallback } from 'react';
import type { ExportData } from '@/services/adventureService';
import type { PartyTier } from '@dagger-app/shared-types';

// =============================================================================
// Props
// =============================================================================

export interface ExportPanelProps {
  /** Current session ID */
  sessionId: string;
  /** Adventure name to display */
  adventureName: string;
  /** Party size */
  partySize: number;
  /** Party tier */
  partyTier: PartyTier;
  /** Number of scenes */
  sceneCount: number;
  /** Number of NPCs */
  npcCount: number;
  /** Number of adversaries */
  adversaryCount: number;
  /** Number of items */
  itemCount: number;
  /** Number of echoes */
  echoCount: number;
  /** Export data for the zip */
  exportData: ExportData;
  /** Callback when download is initiated */
  onExport: (sessionId: string, data: ExportData) => void;
  /** Whether export is in progress */
  isExporting?: boolean;
  /** Error message if export failed */
  error?: string | null;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ExportPanel({
  sessionId,
  adventureName,
  partySize,
  partyTier,
  sceneCount,
  npcCount,
  adversaryCount,
  itemCount,
  echoCount,
  exportData,
  onExport,
  isExporting = false,
  error = null,
  className = '',
}: ExportPanelProps) {
  const handleDownload = useCallback(() => {
    onExport(sessionId, exportData);
  }, [sessionId, exportData, onExport]);

  // Build file list based on what content exists
  const files = buildFileList(exportData);

  return (
    <div
      data-testid="export-panel"
      className={`flex flex-col h-full bg-parchment-50 dark:bg-shadow-900 ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-ink-200 dark:border-shadow-600">
        <h2 className="text-2xl font-serif font-bold text-ink-800 dark:text-parchment-100 flex items-center gap-3">
          <span className="text-3xl">📥</span>
          Export Adventure
        </h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-parchment-500">
          Download your completed adventure as a zip file
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Adventure Summary Card */}
        <div className="bg-parchment-100 dark:bg-shadow-800 rounded-fantasy border border-ink-200 dark:border-shadow-600 p-4 mb-6">
          <h3 className="font-serif font-semibold text-lg text-ink-800 dark:text-parchment-100 mb-3">
            {adventureName}
          </h3>

          <ul className="space-y-2 text-sm text-ink-700 dark:text-parchment-300">
            <li className="flex items-center gap-2">
              <span className="text-gold-600 dark:text-gold-400">•</span>
              Party: {partySize} players, Tier {partyTier}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-gold-600 dark:text-gold-400">•</span>
              {sceneCount} scenes
            </li>
            <li className="flex items-center gap-2">
              <span className="text-gold-600 dark:text-gold-400">•</span>
              {npcCount} NPCs
            </li>
            <li className="flex items-center gap-2">
              <span className="text-gold-600 dark:text-gold-400">•</span>
              {adversaryCount} adversaries
            </li>
            <li className="flex items-center gap-2">
              <span className="text-gold-600 dark:text-gold-400">•</span>
              {itemCount} items
            </li>
            <li className="flex items-center gap-2">
              <span className="text-gold-600 dark:text-gold-400">•</span>
              {echoCount} echoes
            </li>
          </ul>
        </div>

        {/* File List Preview */}
        <div className="mb-6">
          <h3 className="font-serif font-semibold text-ink-800 dark:text-parchment-100 mb-3">
            Files included:
          </h3>

          <ul className="space-y-1 text-sm text-ink-600 dark:text-parchment-400 font-mono">
            {files.map((file) => (
              <li key={file} className="flex items-center gap-2">
                <span className="text-gold-500 dark:text-gold-500">•</span>
                {file}
              </li>
            ))}
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-blood-50 dark:bg-blood-900/30 border border-blood-200 dark:border-blood-800 rounded-fantasy">
            <p className="text-blood-700 dark:text-blood-400 text-sm font-medium">
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Footer with Download Button */}
      <div className="p-6 border-t border-ink-200 dark:border-shadow-600 bg-parchment-100 dark:bg-shadow-800">
        {error ? (
          <button
            type="button"
            onClick={handleDownload}
            className="
              w-full py-3 px-4 rounded-fantasy border-2
              bg-gold-500 border-gold-600 text-ink-900
              font-serif font-semibold text-base
              hover:bg-gold-400 hover:border-gold-500
              dark:bg-gold-600 dark:border-gold-500 dark:text-ink-900
              dark:hover:bg-gold-500 dark:hover:border-gold-400
              shadow-gold-glow
              transition-all duration-200
            "
          >
            Try Again
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            aria-busy={isExporting}
            className="
              w-full py-3 px-4 rounded-fantasy border-2
              bg-gold-500 border-gold-600 text-ink-900
              font-serif font-semibold text-base
              hover:bg-gold-400 hover:border-gold-500
              dark:bg-gold-600 dark:border-gold-500 dark:text-ink-900
              dark:hover:bg-gold-500 dark:hover:border-gold-400
              shadow-gold-glow
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            {isExporting ? (
              <>
                <span
                  role="status"
                  className="w-5 h-5 border-2 border-ink-400 border-t-ink-800 rounded-full animate-spin"
                />
                Generating...
              </>
            ) : (
              'Download Adventure'
            )}
          </button>
        )}

        <p className="mt-3 text-xs text-center text-ink-500 dark:text-parchment-600">
          Requires Claude Code to be running
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build list of files that will be included in the zip
 */
function buildFileList(data: ExportData): string[] {
  const files: string[] = ['README.md'];

  if (data.frame) {
    files.push('frame.md');
  }

  if (data.outline) {
    files.push('outline.md');
  }

  if (data.scenes && data.scenes.length > 0) {
    files.push(`scenes/*.md (${data.scenes.length} files)`);
  }

  if (data.npcs && data.npcs.length > 0) {
    files.push('npcs.md');
  }

  if (data.adversaries && data.adversaries.length > 0) {
    files.push('adversaries.md');
  }

  if (data.items && data.items.length > 0) {
    files.push('items.md');
  }

  if (data.echoes && data.echoes.length > 0) {
    files.push('echoes.md');
  }

  return files;
}
