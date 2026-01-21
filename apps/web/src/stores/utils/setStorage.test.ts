/**
 * Set Storage Tests
 *
 * Tests for the createSetStorage factory function that handles
 * Set serialization/deserialization for Zustand persist middleware.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSetStorage } from './setStorage';

// =============================================================================
// createSetStorage() Tests
// =============================================================================

describe('createSetStorage', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('factory creation', () => {
    it('creates a storage object with getItem, setItem, removeItem', () => {
      const storage = createSetStorage(['confirmedNPCIds']);

      expect(storage).toHaveProperty('getItem');
      expect(storage).toHaveProperty('setItem');
      expect(storage).toHaveProperty('removeItem');
      expect(typeof storage.getItem).toBe('function');
      expect(typeof storage.setItem).toBe('function');
      expect(typeof storage.removeItem).toBe('function');
    });

    it('accepts multiple set field names', () => {
      const storage = createSetStorage([
        'confirmedNPCIds',
        'confirmedAdversaryIds',
        'confirmedItemIds',
        'confirmedEchoIds',
      ]);

      expect(storage).toBeDefined();
    });
  });

  describe('getItem', () => {
    it('returns null when item does not exist', () => {
      const storage = createSetStorage(['confirmedNPCIds']);
      const result = storage.getItem('nonexistent');

      expect(result).toBeNull();
    });

    it('parses stored JSON and converts arrays back to Sets for configured fields', () => {
      const storage = createSetStorage(['confirmedNPCIds']);
      const storedData = {
        state: {
          confirmedNPCIds: ['id1', 'id2', 'id3'],
          otherField: 'value',
        },
        version: 0,
      };
      mockLocalStorage['test-store'] = JSON.stringify(storedData);

      const result = storage.getItem('test-store') as {
        state: { confirmedNPCIds: Set<string>; otherField: string };
      };

      expect(result).not.toBeNull();
      expect(result.state.confirmedNPCIds).toBeInstanceOf(Set);
      expect(result.state.confirmedNPCIds.has('id1')).toBe(true);
      expect(result.state.confirmedNPCIds.has('id2')).toBe(true);
      expect(result.state.confirmedNPCIds.has('id3')).toBe(true);
      expect(result.state.otherField).toBe('value');
    });

    it('handles multiple Set fields', () => {
      const storage = createSetStorage([
        'confirmedNPCIds',
        'confirmedAdversaryIds',
        'confirmedItemIds',
      ]);
      const storedData = {
        state: {
          confirmedNPCIds: ['npc1', 'npc2'],
          confirmedAdversaryIds: ['adv1'],
          confirmedItemIds: ['item1', 'item2', 'item3'],
        },
        version: 0,
      };
      mockLocalStorage['test-store'] = JSON.stringify(storedData);

      const result = storage.getItem('test-store') as {
        state: {
          confirmedNPCIds: Set<string>;
          confirmedAdversaryIds: Set<string>;
          confirmedItemIds: Set<string>;
        };
      };

      expect(result.state.confirmedNPCIds).toBeInstanceOf(Set);
      expect(result.state.confirmedNPCIds.size).toBe(2);
      expect(result.state.confirmedAdversaryIds).toBeInstanceOf(Set);
      expect(result.state.confirmedAdversaryIds.size).toBe(1);
      expect(result.state.confirmedItemIds).toBeInstanceOf(Set);
      expect(result.state.confirmedItemIds.size).toBe(3);
    });

    it('preserves non-Set fields as-is', () => {
      const storage = createSetStorage(['confirmedNPCIds']);
      const storedData = {
        state: {
          confirmedNPCIds: ['id1'],
          scenes: [{ id: 'scene-1', title: 'Test' }],
          frameConfirmed: true,
          adventureName: 'Test Adventure',
        },
        version: 0,
      };
      mockLocalStorage['test-store'] = JSON.stringify(storedData);

      const result = storage.getItem('test-store') as {
        state: {
          scenes: Array<{ id: string; title: string }>;
          frameConfirmed: boolean;
          adventureName: string;
        };
      };

      expect(result.state.scenes).toEqual([{ id: 'scene-1', title: 'Test' }]);
      expect(result.state.frameConfirmed).toBe(true);
      expect(result.state.adventureName).toBe('Test Adventure');
    });

    it('handles empty arrays for Set fields', () => {
      const storage = createSetStorage(['confirmedNPCIds']);
      const storedData = {
        state: {
          confirmedNPCIds: [],
        },
        version: 0,
      };
      mockLocalStorage['test-store'] = JSON.stringify(storedData);

      const result = storage.getItem('test-store') as {
        state: { confirmedNPCIds: Set<string> };
      };

      expect(result.state.confirmedNPCIds).toBeInstanceOf(Set);
      expect(result.state.confirmedNPCIds.size).toBe(0);
    });

    it('handles missing Set fields gracefully', () => {
      const storage = createSetStorage(['confirmedNPCIds', 'confirmedAdversaryIds']);
      const storedData = {
        state: {
          confirmedNPCIds: ['id1'],
          // confirmedAdversaryIds is missing
        },
        version: 0,
      };
      mockLocalStorage['test-store'] = JSON.stringify(storedData);

      const result = storage.getItem('test-store') as {
        state: { confirmedNPCIds: Set<string>; confirmedAdversaryIds?: Set<string> };
      };

      expect(result.state.confirmedNPCIds).toBeInstanceOf(Set);
      expect(result.state.confirmedAdversaryIds).toBeUndefined();
    });

    it('handles malformed JSON gracefully', () => {
      const storage = createSetStorage(['confirmedNPCIds']);
      mockLocalStorage['test-store'] = 'not valid json';

      expect(() => storage.getItem('test-store')).toThrow();
    });
  });

  describe('setItem', () => {
    it('stores value as JSON in localStorage', () => {
      const storage = createSetStorage(['confirmedNPCIds']);
      const value = {
        state: { name: 'test' },
        version: 0,
      };

      storage.setItem('test-store', value);

      const stored = JSON.parse(mockLocalStorage['test-store']);
      expect(stored).toEqual(value);
    });

    it('serializes Sets as arrays automatically when partialize is used', () => {
      const storage = createSetStorage(['confirmedNPCIds']);
      // Note: When using persist middleware with partialize,
      // Sets are already converted to arrays before setItem is called.
      // This test verifies setItem handles normal objects correctly.
      const value = {
        state: {
          confirmedNPCIds: ['id1', 'id2'], // Already partialized to array
        },
        version: 0,
      };

      storage.setItem('test-store', value);

      const stored = JSON.parse(mockLocalStorage['test-store']);
      expect(stored.state.confirmedNPCIds).toEqual(['id1', 'id2']);
    });
  });

  describe('removeItem', () => {
    it('removes item from localStorage', () => {
      const storage = createSetStorage(['confirmedNPCIds']);
      mockLocalStorage['test-store'] = 'some value';

      storage.removeItem('test-store');

      expect(mockLocalStorage['test-store']).toBeUndefined();
    });

    it('does not throw when removing non-existent item', () => {
      const storage = createSetStorage(['confirmedNPCIds']);

      expect(() => storage.removeItem('nonexistent')).not.toThrow();
    });
  });

  describe('integration with contentStore Set fields', () => {
    it('handles all 4 contentStore Set fields', () => {
      const storage = createSetStorage([
        'confirmedNPCIds',
        'confirmedAdversaryIds',
        'confirmedItemIds',
        'confirmedEchoIds',
      ]);
      const storedData = {
        state: {
          confirmedNPCIds: ['npc-1', 'npc-2'],
          confirmedAdversaryIds: ['adv-1'],
          confirmedItemIds: ['weapon:Sword', 'armor:Shield'],
          confirmedEchoIds: ['echo-1', 'echo-2', 'echo-3'],
        },
        version: 0,
      };
      mockLocalStorage['dagger-content-storage'] = JSON.stringify(storedData);

      const result = storage.getItem('dagger-content-storage') as {
        state: {
          confirmedNPCIds: Set<string>;
          confirmedAdversaryIds: Set<string>;
          confirmedItemIds: Set<string>;
          confirmedEchoIds: Set<string>;
        };
      };

      expect(result.state.confirmedNPCIds.size).toBe(2);
      expect(result.state.confirmedAdversaryIds.size).toBe(1);
      expect(result.state.confirmedItemIds.size).toBe(2);
      expect(result.state.confirmedEchoIds.size).toBe(3);
    });
  });
});
