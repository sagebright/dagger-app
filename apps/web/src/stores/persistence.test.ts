/**
 * Tests for persistence store
 *
 * Tests the persistence layer that:
 * - Collects snapshots from all 3 stores
 * - Restores state to all 3 stores
 * - Auto-saves on state changes
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { collectSnapshot, restoreFromSnapshot, initializePersistence, cleanup } from './persistence';
import { useAdventureStore } from './adventureStore';
import { useDialsStore } from './dialsStore';
import { useContentStore } from './contentStore';
import type { WebAdventure, Phase } from '@dagger-app/shared-types';

// Mock the adventure service
vi.mock('../services/adventureService', () => ({
  adventureService: {
    queueSave: vi.fn(),
    cancel: vi.fn(),
    flush: vi.fn(),
    pending: vi.fn().mockReturnValue(false),
  },
}));

// Import the mock after mocking
import { adventureService } from '../services/adventureService';

describe('persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all stores to initial state
    useAdventureStore.getState().reset();
    useDialsStore.getState().resetDials();
    useContentStore.getState().resetContent();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('collectSnapshot', () => {
    it('returns null when no session is active', () => {
      const snapshot = collectSnapshot();
      expect(snapshot).toBeNull();
    });

    it('collects state from all 3 stores', () => {
      // Initialize adventure session
      useAdventureStore.getState().initSession('Test Adventure');

      // Set some dial values
      useDialsStore.getState().setDial('partySize', 5);
      useDialsStore.getState().setDial('partyTier', 2);
      useDialsStore.getState().confirmDial('partySize');

      // Set some content
      useContentStore.getState().selectFrame({
        id: 'frame-1',
        name: 'Test Frame',
        description: 'A test frame',
        source_book: 'Custom',
        themes: ['redemption'],
        created_at: new Date().toISOString(),
        typical_adversaries: null,
        lore: null,
        embedding: null,
      });

      const snapshot = collectSnapshot();

      expect(snapshot).not.toBeNull();
      expect(snapshot!.sessionId).toBeTruthy();
      expect(snapshot!.adventureName).toBe('Test Adventure');
      expect(snapshot!.currentPhase).toBe('dial-tuning');
      expect(snapshot!.phaseHistory).toContain('setup');
      expect(snapshot!.dials.partySize).toBe(5);
      expect(snapshot!.dials.partyTier).toBe(2);
      expect(snapshot!.confirmedDials).toContain('partySize');
      expect(snapshot!.selectedFrame).not.toBeNull();
      expect(snapshot!.selectedFrame?.name).toBe('Test Frame');
    });

    it('converts Sets to Arrays', () => {
      useAdventureStore.getState().initSession('Test Adventure');
      useDialsStore.getState().confirmDial('partySize');
      useDialsStore.getState().confirmDial('partyTier');

      const snapshot = collectSnapshot();

      expect(snapshot!.confirmedDials).toBeInstanceOf(Array);
      expect(snapshot!.confirmedDials).toContain('partySize');
      expect(snapshot!.confirmedDials).toContain('partyTier');
    });

    it('includes all content state fields', () => {
      useAdventureStore.getState().initSession('Test Adventure');

      const snapshot = collectSnapshot();

      // Verify all content fields are present
      expect(snapshot!).toHaveProperty('selectedFrame');
      expect(snapshot!).toHaveProperty('frameConfirmed');
      expect(snapshot!).toHaveProperty('currentOutline');
      expect(snapshot!).toHaveProperty('outlineConfirmed');
      expect(snapshot!).toHaveProperty('scenes');
      expect(snapshot!).toHaveProperty('currentSceneId');
      expect(snapshot!).toHaveProperty('npcs');
      expect(snapshot!).toHaveProperty('confirmedNPCIds');
      expect(snapshot!).toHaveProperty('selectedAdversaries');
      expect(snapshot!).toHaveProperty('confirmedAdversaryIds');
      expect(snapshot!).toHaveProperty('selectedItems');
      expect(snapshot!).toHaveProperty('confirmedItemIds');
      expect(snapshot!).toHaveProperty('echoes');
      expect(snapshot!).toHaveProperty('confirmedEchoIds');
    });
  });

  describe('restoreFromSnapshot', () => {
    it('restores adventure store state', () => {
      const webAdventure: WebAdventure = {
        id: 'test-id',
        session_id: 'test-session-123',
        adventure_name: 'Restored Adventure',
        current_phase: 'frame' as Phase,
        phase_history: ['setup', 'dial-tuning'],
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-02T00:00:00.000Z',
        dials: {
          partySize: 5,
          partyTier: 2,
          sceneCount: 5,
          sessionLength: '3-4 hours',
          tone: 'dark and gritty',
          pillarBalance: null,
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: ['sacrifice'],
        },
        confirmed_dials: ['partySize', 'partyTier', 'sceneCount'],
        selected_frame: { id: 1, name: 'Test Frame' },
        frame_confirmed: true,
        current_outline: null,
        outline_confirmed: false,
        scenes: [],
        current_scene_id: null,
        npcs: [],
        confirmed_npc_ids: [],
        selected_adversaries: [],
        confirmed_adversary_ids: [],
        selected_items: [],
        confirmed_item_ids: [],
        echoes: [],
        confirmed_echo_ids: [],
        last_exported_at: null,
        export_count: 0,
      };

      restoreFromSnapshot(webAdventure);

      const adventureState = useAdventureStore.getState();
      expect(adventureState.sessionId).toBe('test-session-123');
      expect(adventureState.adventureName).toBe('Restored Adventure');
      expect(adventureState.currentPhase).toBe('frame');
      expect(adventureState.phaseHistory).toEqual(['setup', 'dial-tuning']);
    });

    it('restores dials store state', () => {
      const webAdventure: WebAdventure = {
        id: 'test-id',
        session_id: 'test-session-123',
        adventure_name: 'Test Adventure',
        current_phase: 'frame' as Phase,
        phase_history: ['setup', 'dial-tuning'],
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-02T00:00:00.000Z',
        dials: {
          partySize: 5,
          partyTier: 2,
          sceneCount: 5,
          sessionLength: '4-5 hours',
          tone: 'dark',
          pillarBalance: 'exploration-heavy',
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: ['sacrifice', 'identity'],
        },
        confirmed_dials: ['partySize', 'partyTier', 'sceneCount', 'sessionLength'],
        selected_frame: null,
        frame_confirmed: false,
        current_outline: null,
        outline_confirmed: false,
        scenes: [],
        current_scene_id: null,
        npcs: [],
        confirmed_npc_ids: [],
        selected_adversaries: [],
        confirmed_adversary_ids: [],
        selected_items: [],
        confirmed_item_ids: [],
        echoes: [],
        confirmed_echo_ids: [],
        last_exported_at: null,
        export_count: 0,
      };

      restoreFromSnapshot(webAdventure);

      const dialsState = useDialsStore.getState();
      expect(dialsState.partySize).toBe(5);
      expect(dialsState.partyTier).toBe(2);
      expect(dialsState.sceneCount).toBe(5);
      expect(dialsState.sessionLength).toBe('4-5 hours');
      expect(dialsState.tone).toBe('dark');
      expect(dialsState.pillarBalance).toBe('exploration-heavy');
      expect(dialsState.themes).toEqual(['sacrifice', 'identity']);
      expect(dialsState.confirmedDials.has('partySize')).toBe(true);
      expect(dialsState.confirmedDials.has('partyTier')).toBe(true);
    });

    it('restores content store state', () => {
      const webAdventure: WebAdventure = {
        id: 'test-id',
        session_id: 'test-session-123',
        adventure_name: 'Test Adventure',
        current_phase: 'scenes' as Phase,
        phase_history: ['setup', 'dial-tuning', 'frame', 'outline'],
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-02T00:00:00.000Z',
        dials: { partySize: 4, partyTier: 1, sceneCount: 4, sessionLength: '3-4 hours', tone: null, pillarBalance: null, npcDensity: null, lethality: null, emotionalRegister: null, themes: [] },
        confirmed_dials: [],
        selected_frame: { id: 1, name: 'Test Frame', description: 'A frame' },
        frame_confirmed: true,
        current_outline: { id: 'outline-1', title: 'Test Outline', scenes: [] },
        outline_confirmed: true,
        scenes: [
          { brief: { id: 'scene-1', sceneNumber: 1, title: 'Scene 1' }, draft: null, status: 'pending' },
        ],
        current_scene_id: 'scene-1',
        npcs: [{ id: 'npc-1', name: 'Test NPC', role: 'ally', sceneAppearances: [] }],
        confirmed_npc_ids: ['npc-1'],
        selected_adversaries: [],
        confirmed_adversary_ids: [],
        selected_items: [],
        confirmed_item_ids: [],
        echoes: [],
        confirmed_echo_ids: [],
        last_exported_at: null,
        export_count: 0,
      };

      restoreFromSnapshot(webAdventure);

      const contentState = useContentStore.getState();
      expect(contentState.selectedFrame).not.toBeNull();
      expect(contentState.frameConfirmed).toBe(true);
      expect(contentState.currentOutline).not.toBeNull();
      expect(contentState.outlineConfirmed).toBe(true);
      expect(contentState.scenes).toHaveLength(1);
      expect(contentState.currentSceneId).toBe('scene-1');
      expect(contentState.npcs).toHaveLength(1);
      expect(contentState.confirmedNPCIds.has('npc-1')).toBe(true);
    });
  });

  describe('initializePersistence', () => {
    it('subscribes to store changes', () => {
      // Initialize a session first
      useAdventureStore.getState().initSession('Test Adventure');

      // Initialize persistence
      initializePersistence();

      // Make a change that should trigger auto-save
      useDialsStore.getState().setDial('partySize', 5);

      // Should have queued a save
      expect(adventureService.queueSave).toHaveBeenCalled();
    });

    it('does not queue save if no session is active', () => {
      // Initialize persistence without an active session
      initializePersistence();

      // Make a change
      useDialsStore.getState().setDial('partySize', 5);

      // Should not have queued a save (no session)
      expect(adventureService.queueSave).not.toHaveBeenCalled();
    });

    it('can be cleaned up', () => {
      // Initialize a session
      useAdventureStore.getState().initSession('Test Adventure');
      initializePersistence();

      // Clean up
      cleanup();

      // Make a change
      useDialsStore.getState().setDial('partySize', 5);

      // queueSave may have been called before cleanup, but let's verify cleanup was called
      // by checking the mock was reset and no new calls happen after cleanup
      vi.clearAllMocks();
      useDialsStore.getState().setDial('partySize', 3);

      // Should not queue after cleanup
      expect(adventureService.queueSave).not.toHaveBeenCalled();
    });
  });
});
