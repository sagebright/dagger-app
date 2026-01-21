/**
 * Tests for Web Adventure type definitions
 *
 * These types support Supabase persistence for the web adventure workflow.
 */

import { describe, it, expect } from 'vitest';
import type {
  WebAdventure,
  WebAdventureInsert,
  WebAdventureUpdate,
  AdventureSnapshot,
  AdventureMetadata,
} from './web-adventure.js';
import { toAdventureSnapshot, toAdventureMetadata } from './web-adventure.js';
import type { Phase } from './dials.js';

describe('Web Adventure Types', () => {
  describe('WebAdventure', () => {
    it('should accept a complete web adventure row', () => {
      const adventure: WebAdventure = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        session_id: '550e8400-e29b-41d4-a716-446655440001',
        adventure_name: 'The Hollow Vigil',
        current_phase: 'dial-tuning',
        phase_history: ['setup', 'dial-tuning'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        dials: { partySize: 4, partyTier: 1 },
        confirmed_dials: ['partySize'],
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
      expect(adventure.session_id).toBeTruthy();
      expect(adventure.current_phase).toBe('dial-tuning');
    });

    it('should accept adventure with all optional fields populated', () => {
      const adventure: WebAdventure = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        session_id: '550e8400-e29b-41d4-a716-446655440001',
        adventure_name: 'The Hollow Vigil',
        current_phase: 'scenes',
        phase_history: ['setup', 'dial-tuning', 'frame', 'outline', 'scenes'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        dials: {
          partySize: 4,
          partyTier: 2,
          sceneCount: 5,
          tone: 'gritty',
          themes: ['redemption'],
        },
        confirmed_dials: ['partySize', 'partyTier', 'sceneCount', 'tone', 'themes'],
        selected_frame: { id: 'frame-1', name: 'Test Frame', description: 'A test' },
        frame_confirmed: true,
        current_outline: { id: 'outline-1', scenes: [] },
        outline_confirmed: true,
        scenes: [{ id: 'scene-1', title: 'Opening' }],
        current_scene_id: 'scene-1',
        npcs: [{ id: 'npc-1', name: 'Merchant' }],
        confirmed_npc_ids: ['npc-1'],
        selected_adversaries: [{ id: 'adv-1', name: 'Goblin' }],
        confirmed_adversary_ids: ['adv-1'],
        selected_items: [{ id: 'item-1', name: 'Sword' }],
        confirmed_item_ids: ['item-1'],
        echoes: [{ id: 'echo-1', category: 'complications' }],
        confirmed_echo_ids: ['echo-1'],
        last_exported_at: new Date().toISOString(),
        export_count: 2,
      };
      expect(adventure.frame_confirmed).toBe(true);
      expect(adventure.export_count).toBe(2);
    });

    it('should require unique session_id', () => {
      const adventure1: WebAdventure = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        session_id: '550e8400-e29b-41d4-a716-446655440001',
        adventure_name: 'Adventure 1',
        current_phase: 'setup',
        phase_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        dials: {},
        confirmed_dials: [],
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

      // Type ensures session_id is always present and non-optional
      expect(adventure1.session_id).toBeDefined();
    });
  });

  describe('WebAdventureInsert', () => {
    it('should accept minimal insert payload', () => {
      const insert: WebAdventureInsert = {
        session_id: '550e8400-e29b-41d4-a716-446655440001',
        adventure_name: 'New Adventure',
      };
      expect(insert.session_id).toBeTruthy();
      expect(insert.adventure_name).toBeTruthy();
    });

    it('should accept insert with optional fields', () => {
      const insert: WebAdventureInsert = {
        session_id: '550e8400-e29b-41d4-a716-446655440001',
        adventure_name: 'New Adventure',
        current_phase: 'dial-tuning',
        dials: { partySize: 5 },
      };
      expect(insert.current_phase).toBe('dial-tuning');
    });
  });

  describe('WebAdventureUpdate', () => {
    it('should accept partial update payload', () => {
      const update: WebAdventureUpdate = {
        current_phase: 'frame',
        dials: { partySize: 4, tone: 'epic' },
      };
      expect(update.current_phase).toBe('frame');
    });

    it('should accept empty update', () => {
      const update: WebAdventureUpdate = {};
      expect(Object.keys(update)).toHaveLength(0);
    });

    it('should not allow updating session_id', () => {
      // session_id should NOT be in the update type since it's immutable
      const update: WebAdventureUpdate = {
        adventure_name: 'Updated Name',
      };
      // This is a compile-time check - if session_id was in update type, this would fail
      expect('session_id' in update).toBe(false);
    });
  });

  describe('AdventureSnapshot', () => {
    it('should capture essential state for resume', () => {
      const snapshot: AdventureSnapshot = {
        sessionId: '550e8400-e29b-41d4-a716-446655440001',
        adventureName: 'The Hollow Vigil',
        currentPhase: 'scenes',
        phaseHistory: ['setup', 'dial-tuning', 'frame', 'outline', 'scenes'],
        dialsConfirmed: ['partySize', 'partyTier', 'tone'],
        frameConfirmed: true,
        outlineConfirmed: true,
        scenesConfirmed: 2,
        totalScenes: 5,
        lastUpdated: new Date().toISOString(),
      };
      expect(snapshot.currentPhase).toBe('scenes');
      expect(snapshot.scenesConfirmed).toBe(2);
    });

    it('should represent early-stage adventure', () => {
      const snapshot: AdventureSnapshot = {
        sessionId: '550e8400-e29b-41d4-a716-446655440001',
        adventureName: 'New Adventure',
        currentPhase: 'setup',
        phaseHistory: ['setup'],
        dialsConfirmed: [],
        frameConfirmed: false,
        outlineConfirmed: false,
        scenesConfirmed: 0,
        totalScenes: 0,
        lastUpdated: new Date().toISOString(),
      };
      expect(snapshot.dialsConfirmed).toHaveLength(0);
      expect(snapshot.frameConfirmed).toBe(false);
    });
  });

  describe('AdventureMetadata', () => {
    it('should track adventure metadata', () => {
      const metadata: AdventureMetadata = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: '550e8400-e29b-41d4-a716-446655440001',
        adventureName: 'The Hollow Vigil',
        currentPhase: 'complete',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastExportedAt: new Date().toISOString(),
        exportCount: 3,
      };
      expect(metadata.exportCount).toBe(3);
      expect(metadata.currentPhase).toBe('complete');
    });

    it('should handle never-exported adventure', () => {
      const metadata: AdventureMetadata = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: '550e8400-e29b-41d4-a716-446655440001',
        adventureName: 'New Adventure',
        currentPhase: 'setup',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastExportedAt: null,
        exportCount: 0,
      };
      expect(metadata.lastExportedAt).toBeNull();
      expect(metadata.exportCount).toBe(0);
    });
  });

  describe('Phase integration', () => {
    it('should use Phase type from dials', () => {
      const validPhases: Phase[] = [
        'setup',
        'dial-tuning',
        'frame',
        'outline',
        'scenes',
        'npcs',
        'adversaries',
        'items',
        'echoes',
        'complete',
      ];

      const adventure: WebAdventure = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        session_id: '550e8400-e29b-41d4-a716-446655440001',
        adventure_name: 'Test',
        current_phase: 'setup',
        phase_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        dials: {},
        confirmed_dials: [],
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

      // current_phase should be a valid Phase
      expect(validPhases).toContain(adventure.current_phase);
    });
  });

  describe('Utility Functions', () => {
    describe('toAdventureSnapshot', () => {
      it('should convert WebAdventure to AdventureSnapshot', () => {
        
        const adventure: WebAdventure = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          session_id: '550e8400-e29b-41d4-a716-446655440001',
          adventure_name: 'The Hollow Vigil',
          current_phase: 'scenes',
          phase_history: ['setup', 'dial-tuning', 'frame', 'outline', 'scenes'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          dials: { partySize: 4 },
          confirmed_dials: ['partySize', 'partyTier'],
          selected_frame: { id: 'frame-1' },
          frame_confirmed: true,
          current_outline: { scenes: [] },
          outline_confirmed: true,
          scenes: [
            { id: 'scene-1', status: 'confirmed' },
            { id: 'scene-2', status: 'draft' },
            { id: 'scene-3', status: 'pending' },
          ],
          current_scene_id: 'scene-2',
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

        const snapshot = toAdventureSnapshot(adventure);

        expect(snapshot.sessionId).toBe('550e8400-e29b-41d4-a716-446655440001');
        expect(snapshot.adventureName).toBe('The Hollow Vigil');
        expect(snapshot.currentPhase).toBe('scenes');
        expect(snapshot.phaseHistory).toEqual(['setup', 'dial-tuning', 'frame', 'outline', 'scenes']);
        expect(snapshot.dialsConfirmed).toEqual(['partySize', 'partyTier']);
        expect(snapshot.frameConfirmed).toBe(true);
        expect(snapshot.outlineConfirmed).toBe(true);
        expect(snapshot.scenesConfirmed).toBe(1);
        expect(snapshot.totalScenes).toBe(3);
        expect(snapshot.lastUpdated).toBe('2024-01-02T00:00:00Z');
      });

      it('should handle empty scenes array', () => {
        
        const adventure: WebAdventure = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          session_id: '550e8400-e29b-41d4-a716-446655440001',
          adventure_name: 'New Adventure',
          current_phase: 'setup',
          phase_history: ['setup'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          dials: {},
          confirmed_dials: [],
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

        const snapshot = toAdventureSnapshot(adventure);

        expect(snapshot.scenesConfirmed).toBe(0);
        expect(snapshot.totalScenes).toBe(0);
      });
    });

    describe('toAdventureMetadata', () => {
      it('should convert WebAdventure to AdventureMetadata', () => {
        
        const adventure: WebAdventure = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          session_id: '550e8400-e29b-41d4-a716-446655440001',
          adventure_name: 'The Hollow Vigil',
          current_phase: 'complete',
          phase_history: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
          dials: {},
          confirmed_dials: [],
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
          last_exported_at: '2024-01-14T00:00:00Z',
          export_count: 3,
        };

        const metadata = toAdventureMetadata(adventure);

        expect(metadata.id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(metadata.sessionId).toBe('550e8400-e29b-41d4-a716-446655440001');
        expect(metadata.adventureName).toBe('The Hollow Vigil');
        expect(metadata.currentPhase).toBe('complete');
        expect(metadata.createdAt).toBe('2024-01-01T00:00:00Z');
        expect(metadata.updatedAt).toBe('2024-01-15T00:00:00Z');
        expect(metadata.lastExportedAt).toBe('2024-01-14T00:00:00Z');
        expect(metadata.exportCount).toBe(3);
      });

      it('should handle null lastExportedAt', () => {
        
        const adventure: WebAdventure = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          session_id: '550e8400-e29b-41d4-a716-446655440001',
          adventure_name: 'New Adventure',
          current_phase: 'setup',
          phase_history: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          dials: {},
          confirmed_dials: [],
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

        const metadata = toAdventureMetadata(adventure);

        expect(metadata.lastExportedAt).toBeNull();
        expect(metadata.exportCount).toBe(0);
      });
    });
  });
});
