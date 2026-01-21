/**
 * Tests for web adventure query service
 *
 * Following TDD: RED phase - write failing tests first
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Supabase client before importing the module under test
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Import after mocking
import {
  saveAdventure,
  loadAdventure,
  getAdventureMetadata,
  deleteAdventure,
  markExported,
} from './web-adventure-queries.js';
import { resetSupabaseClient } from './supabase.js';
import type { WebAdventure, AdventureSnapshot, Phase } from '@dagger-app/shared-types';

// Helper to create a mock WebAdventure row
function createMockAdventure(overrides: Partial<WebAdventure> = {}): WebAdventure {
  return {
    id: 'test-uuid',
    session_id: 'test-session-123',
    adventure_name: 'Test Adventure',
    current_phase: 'setup' as Phase,
    phase_history: ['setup'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
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
    ...overrides,
  };
}

// Helper to create an AdventureSnapshot for save operations
function createMockSnapshot(overrides: Partial<AdventureSnapshot> = {}): AdventureSnapshot {
  return {
    sessionId: 'test-session-123',
    adventureName: 'Test Adventure',
    currentPhase: 'setup' as Phase,
    phaseHistory: ['setup'],
    dialsConfirmed: [],
    frameConfirmed: false,
    outlineConfirmed: false,
    scenesConfirmed: 0,
    totalScenes: 0,
    lastUpdated: '2024-01-15T12:00:00Z',
    ...overrides,
  };
}

describe('web-adventure-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseClient();

    // Reset mock chain
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      upsert: mockUpsert,
    });
    mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect, single: mockSingle });
    mockUpdate.mockReturnValue({ eq: mockEq, select: mockSelect });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockUpsert.mockReturnValue({ select: mockSelect, single: mockSingle });
    mockEq.mockReturnValue({ single: mockSingle, eq: mockEq, select: mockSelect });
  });

  describe('saveAdventure', () => {
    it('upserts adventure by session_id and returns success', async () => {
      const mockAdventure = createMockAdventure();
      mockSingle.mockResolvedValue({ data: mockAdventure, error: null });

      const snapshot = createMockSnapshot();
      const result = await saveAdventure(snapshot);

      expect(result.data).not.toBeNull();
      expect(result.data?.sessionId).toBe('test-session-123');
      expect(result.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('daggerheart_web_adventures');
    });

    it('returns error when upsert fails', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const snapshot = createMockSnapshot();
      const result = await saveAdventure(snapshot);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database error');
    });

    it('includes updatedAt timestamp in response', async () => {
      const mockAdventure = createMockAdventure({
        updated_at: '2024-01-15T14:30:00Z',
      });
      mockSingle.mockResolvedValue({ data: mockAdventure, error: null });

      const snapshot = createMockSnapshot();
      const result = await saveAdventure(snapshot);

      expect(result.data?.updatedAt).toBe('2024-01-15T14:30:00Z');
    });
  });

  describe('loadAdventure', () => {
    it('returns adventure when found', async () => {
      const mockAdventure = createMockAdventure();
      mockSingle.mockResolvedValue({ data: mockAdventure, error: null });

      const result = await loadAdventure('test-session-123');

      expect(result.data).not.toBeNull();
      expect(result.data?.session_id).toBe('test-session-123');
      expect(result.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('daggerheart_web_adventures');
    });

    it('returns null data when adventure not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const result = await loadAdventure('non-existent-session');

      expect(result.data).toBeNull();
      // Not found is not treated as an error - just null data
      expect(result.error).toBeNull();
    });

    it('returns error for database failures', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      const result = await loadAdventure('test-session-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('getAdventureMetadata', () => {
    it('returns metadata when adventure exists', async () => {
      const mockAdventure = createMockAdventure({
        scenes: [
          { id: 's1', status: 'confirmed' },
          { id: 's2', status: 'draft' },
        ],
        npcs: [{ id: 'npc1' }, { id: 'npc2' }],
      });
      mockSingle.mockResolvedValue({ data: mockAdventure, error: null });

      const result = await getAdventureMetadata('test-session-123');

      expect(result.data).not.toBeNull();
      expect(result.data?.exists).toBe(true);
      expect(result.data?.metadata?.sessionId).toBe('test-session-123');
      expect(result.data?.metadata?.adventureName).toBe('Test Adventure');
      expect(result.data?.metadata?.sceneCount).toBe(2);
      expect(result.data?.metadata?.npcCount).toBe(2);
    });

    it('returns exists: false when adventure not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const result = await getAdventureMetadata('non-existent');

      expect(result.data?.exists).toBe(false);
      expect(result.data?.metadata).toBeUndefined();
      expect(result.error).toBeNull();
    });

    it('returns error for database failures', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Query timeout' },
      });

      const result = await getAdventureMetadata('test-session-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Query timeout');
    });
  });

  describe('deleteAdventure', () => {
    it('deletes adventure and returns success', async () => {
      mockEq.mockResolvedValue({ data: null, error: null });

      const result = await deleteAdventure('test-session-123');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('daggerheart_web_adventures');
    });

    it('returns error when delete fails', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: { message: 'Foreign key constraint' },
      });

      const result = await deleteAdventure('test-session-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Foreign key constraint');
    });
  });

  describe('markExported', () => {
    it('updates export timestamp and increments count', async () => {
      const mockAdventure = createMockAdventure({
        last_exported_at: '2024-01-15T15:00:00Z',
        export_count: 1,
      });
      mockSingle.mockResolvedValue({ data: mockAdventure, error: null });

      const result = await markExported('test-session-123');

      expect(result.data).not.toBeNull();
      expect(result.data?.lastExportedAt).toBe('2024-01-15T15:00:00Z');
      expect(result.data?.exportCount).toBe(1);
      expect(result.error).toBeNull();
    });

    it('returns error when update fails', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Record not found' },
      });

      const result = await markExported('non-existent');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Record not found');
    });
  });
});
