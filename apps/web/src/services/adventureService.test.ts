/**
 * Tests for adventureService
 *
 * Tests the frontend API service layer for adventure persistence.
 * Uses mocked fetch for API calls.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  adventureService,
  saveAdventure,
  checkSession,
  loadAdventure,
  deleteAdventure,
  exportAdventure,
  type FullSnapshot,
} from './adventureService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock JSZip
vi.mock('jszip', () => {
  class MockJSZip {
    file = vi.fn().mockReturnThis();
    generateAsync = vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/zip' }));
  }
  return {
    default: MockJSZip,
  };
});

describe('adventureService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('saveAdventure', () => {
    it('sends POST request to /api/adventure/save', async () => {
      const snapshot: FullSnapshot = {
        sessionId: 'test-session-123',
        adventureName: 'Test Adventure',
        currentPhase: 'dial-tuning',
        phaseHistory: ['setup'],
        dials: {
          partySize: 4,
          partyTier: 2,
          sceneCount: 4,
          sessionLength: '3-4 hours',
          tone: 'balanced',
          pillarBalance: null,
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: ['redemption'],
        },
        confirmedDials: ['partySize', 'partyTier'],
        selectedFrame: null,
        frameConfirmed: false,
        currentOutline: null,
        outlineConfirmed: false,
        scenes: [],
        currentSceneId: null,
        npcs: [],
        confirmedNPCIds: [],
        selectedAdversaries: [],
        confirmedAdversaryIds: [],
        selectedItems: [],
        confirmedItemIds: [],
        echoes: [],
        confirmedEchoIds: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          sessionId: 'test-session-123',
          updatedAt: '2025-01-01T00:00:00.000Z',
        }),
      });

      const result = await saveAdventure(snapshot);

      expect(mockFetch).toHaveBeenCalledWith('/api/adventure/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('test-session-123');
    });

    it('handles API errors gracefully', async () => {
      const snapshot: FullSnapshot = {
        sessionId: 'test-session-123',
        adventureName: 'Test Adventure',
        currentPhase: 'setup',
        phaseHistory: [],
        dials: {
          partySize: 4,
          partyTier: 1,
          sceneCount: 4,
          sessionLength: '3-4 hours',
          tone: null,
          pillarBalance: null,
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: [],
        },
        confirmedDials: [],
        selectedFrame: null,
        frameConfirmed: false,
        currentOutline: null,
        outlineConfirmed: false,
        scenes: [],
        currentSceneId: null,
        npcs: [],
        confirmedNPCIds: [],
        selectedAdversaries: [],
        confirmedAdversaryIds: [],
        selectedItems: [],
        confirmedItemIds: [],
        echoes: [],
        confirmedEchoIds: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ code: 'SAVE_FAILED', message: 'Database error' }),
      });

      const result = await saveAdventure(snapshot);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });

    it('handles network errors', async () => {
      const snapshot: FullSnapshot = {
        sessionId: 'test-session-123',
        adventureName: 'Test Adventure',
        currentPhase: 'setup',
        phaseHistory: [],
        dials: {
          partySize: 4,
          partyTier: 1,
          sceneCount: 4,
          sessionLength: '3-4 hours',
          tone: null,
          pillarBalance: null,
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: [],
        },
        confirmedDials: [],
        selectedFrame: null,
        frameConfirmed: false,
        currentOutline: null,
        outlineConfirmed: false,
        scenes: [],
        currentSceneId: null,
        npcs: [],
        confirmedNPCIds: [],
        selectedAdversaries: [],
        confirmedAdversaryIds: [],
        selectedItems: [],
        confirmedItemIds: [],
        echoes: [],
        confirmedEchoIds: [],
      };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await saveAdventure(snapshot);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('checkSession', () => {
    it('sends GET request to /api/adventure/:sessionId/metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          exists: true,
          metadata: {
            sessionId: 'test-session-123',
            adventureName: 'Test Adventure',
            currentPhase: 'dial-tuning',
            updatedAt: '2025-01-01T00:00:00.000Z',
            sceneCount: 3,
            npcCount: 5,
          },
        }),
      });

      const result = await checkSession('test-session-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/adventure/test-session-123/metadata');
      expect(result.exists).toBe(true);
      expect(result.metadata?.adventureName).toBe('Test Adventure');
    });

    it('returns exists: false when session not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      });

      const result = await checkSession('nonexistent-session');

      expect(result.exists).toBe(false);
      expect(result.metadata).toBeUndefined();
    });
  });

  describe('loadAdventure', () => {
    it('sends GET request to /api/adventure/:sessionId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          exists: true,
          adventure: {
            session_id: 'test-session-123',
            adventure_name: 'Test Adventure',
            current_phase: 'dial-tuning',
            phase_history: ['setup'],
            dials: { partySize: 4 },
            confirmed_dials: ['partySize'],
            // ... other fields
          },
        }),
      });

      const result = await loadAdventure('test-session-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/adventure/test-session-123');
      expect(result.exists).toBe(true);
    });

    it('returns null adventure when session not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      });

      const result = await loadAdventure('nonexistent-session');

      expect(result.exists).toBe(false);
      expect(result.adventure).toBeUndefined();
    });
  });

  describe('deleteAdventure', () => {
    it('sends DELETE request to /api/adventure/:sessionId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await deleteAdventure('test-session-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/adventure/test-session-123', {
        method: 'DELETE',
      });
      expect(result.success).toBe(true);
    });

    it('handles delete errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ code: 'DELETE_FAILED', message: 'Not found' }),
      });

      const result = await deleteAdventure('test-session-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not found');
    });
  });

  describe('exportAdventure', () => {
    it('creates a zip blob with markdown content', async () => {
      // Mock mark exported API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          lastExportedAt: '2025-01-01T00:00:00.000Z',
          exportCount: 1,
        }),
      });

      const exportData = {
        adventureName: 'Test Adventure',
        frame: { name: 'Test Frame', description: 'A test frame' },
        outline: { title: 'Test Outline', scenes: [] },
        scenes: [{ title: 'Scene 1', content: 'Content' }],
        npcs: [{ name: 'Test NPC', role: 'ally' }],
        adversaries: [{ name: 'Test Enemy' }],
        items: [{ name: 'Test Sword' }],
        echoes: [{ category: 'complications', title: 'Test Echo' }],
      };

      const result = await exportAdventure('test-session-123', exportData);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.filename).toContain('Test_Adventure');
      expect(result.filename).toContain('.zip');
      expect(mockFetch).toHaveBeenCalledWith('/api/adventure/test-session-123/export', {
        method: 'POST',
      });
    });
  });

  describe('adventureService (debounced)', () => {
    it('debounces save calls with 2.5s delay', async () => {
      const snapshot: FullSnapshot = {
        sessionId: 'test-session-123',
        adventureName: 'Test Adventure',
        currentPhase: 'setup',
        phaseHistory: [],
        dials: {
          partySize: 4,
          partyTier: 1,
          sceneCount: 4,
          sessionLength: '3-4 hours',
          tone: null,
          pillarBalance: null,
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: [],
        },
        confirmedDials: [],
        selectedFrame: null,
        frameConfirmed: false,
        currentOutline: null,
        outlineConfirmed: false,
        scenes: [],
        currentSceneId: null,
        npcs: [],
        confirmedNPCIds: [],
        selectedAdversaries: [],
        confirmedAdversaryIds: [],
        selectedItems: [],
        confirmedItemIds: [],
        echoes: [],
        confirmedEchoIds: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          sessionId: 'test-session-123',
          updatedAt: '2025-01-01T00:00:00.000Z',
        }),
      });

      // Queue multiple saves rapidly
      adventureService.queueSave(snapshot);
      adventureService.queueSave({ ...snapshot, adventureName: 'Updated 1' });
      adventureService.queueSave({ ...snapshot, adventureName: 'Updated 2' });

      // Should not have called fetch yet
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance time by 2.5 seconds
      await vi.advanceTimersByTimeAsync(2500);

      // Should have only made one call with the last snapshot
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.adventureName).toBe('Updated 2');
    });

    it('allows cancelling pending save', async () => {
      const snapshot: FullSnapshot = {
        sessionId: 'test-session-123',
        adventureName: 'Test Adventure',
        currentPhase: 'setup',
        phaseHistory: [],
        dials: {
          partySize: 4,
          partyTier: 1,
          sceneCount: 4,
          sessionLength: '3-4 hours',
          tone: null,
          pillarBalance: null,
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: [],
        },
        confirmedDials: [],
        selectedFrame: null,
        frameConfirmed: false,
        currentOutline: null,
        outlineConfirmed: false,
        scenes: [],
        currentSceneId: null,
        npcs: [],
        confirmedNPCIds: [],
        selectedAdversaries: [],
        confirmedAdversaryIds: [],
        selectedItems: [],
        confirmedItemIds: [],
        echoes: [],
        confirmedEchoIds: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      adventureService.queueSave(snapshot);
      adventureService.cancel();

      await vi.advanceTimersByTimeAsync(3000);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('flushes pending save immediately', async () => {
      const snapshot: FullSnapshot = {
        sessionId: 'test-session-123',
        adventureName: 'Test Adventure',
        currentPhase: 'setup',
        phaseHistory: [],
        dials: {
          partySize: 4,
          partyTier: 1,
          sceneCount: 4,
          sessionLength: '3-4 hours',
          tone: null,
          pillarBalance: null,
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: [],
        },
        confirmedDials: [],
        selectedFrame: null,
        frameConfirmed: false,
        currentOutline: null,
        outlineConfirmed: false,
        scenes: [],
        currentSceneId: null,
        npcs: [],
        confirmedNPCIds: [],
        selectedAdversaries: [],
        confirmedAdversaryIds: [],
        selectedItems: [],
        confirmedItemIds: [],
        echoes: [],
        confirmedEchoIds: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      adventureService.queueSave(snapshot);
      adventureService.flush();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('reports pending status correctly', () => {
      const snapshot: FullSnapshot = {
        sessionId: 'test-session-123',
        adventureName: 'Test Adventure',
        currentPhase: 'setup',
        phaseHistory: [],
        dials: {
          partySize: 4,
          partyTier: 1,
          sceneCount: 4,
          sessionLength: '3-4 hours',
          tone: null,
          pillarBalance: null,
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: [],
        },
        confirmedDials: [],
        selectedFrame: null,
        frameConfirmed: false,
        currentOutline: null,
        outlineConfirmed: false,
        scenes: [],
        currentSceneId: null,
        npcs: [],
        confirmedNPCIds: [],
        selectedAdversaries: [],
        confirmedAdversaryIds: [],
        selectedItems: [],
        confirmedItemIds: [],
        echoes: [],
        confirmedEchoIds: [],
      };

      expect(adventureService.pending()).toBe(false);
      adventureService.queueSave(snapshot);
      expect(adventureService.pending()).toBe(true);
      adventureService.cancel();
      expect(adventureService.pending()).toBe(false);
    });
  });
});
