/**
 * Set Storage Factory
 *
 * Creates a custom storage adapter for Zustand's persist middleware that
 * handles Set serialization/deserialization. Since JSON.stringify cannot
 * serialize Sets directly, they must be converted to Arrays for storage
 * and back to Sets on retrieval.
 *
 * This factory replaces 30+ lines of custom storage configuration in
 * contentStore.ts with a reusable, testable function.
 */

import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * Creates a storage adapter that handles Set fields for Zustand persist middleware.
 *
 * When data is retrieved from localStorage, any configured Set fields are
 * converted from Arrays back to Sets. When data is stored, it's saved as
 * standard JSON (Sets should be converted to Arrays via partialize).
 *
 * @param setFieldNames - Array of state field names that contain Sets
 * @returns Storage adapter compatible with Zustand persist middleware
 *
 * @example
 * const storage = createSetStorage([
 *   'confirmedNPCIds',
 *   'confirmedAdversaryIds',
 *   'confirmedItemIds',
 *   'confirmedEchoIds',
 * ]);
 *
 * // Use in Zustand persist config:
 * persist(
 *   (set, get) => ({ ... }),
 *   {
 *     name: 'my-storage',
 *     storage: storage,
 *     partialize: (state) => ({
 *       ...state,
 *       confirmedNPCIds: Array.from(state.confirmedNPCIds),
 *     }),
 *   }
 * )
 */
export function createSetStorage<S>(
  setFieldNames: string[]
): PersistStorage<S> {
  return {
    getItem: (name: string): StorageValue<S> | null => {
      const str = localStorage.getItem(name);
      if (!str) return null;

      const parsed = JSON.parse(str) as StorageValue<S>;

      if (parsed.state) {
        for (const fieldName of setFieldNames) {
          const fieldValue = (parsed.state as Record<string, unknown>)[fieldName];
          if (Array.isArray(fieldValue)) {
            (parsed.state as Record<string, unknown>)[fieldName] = new Set(fieldValue);
          }
        }
      }

      return parsed;
    },

    setItem: (name: string, value: StorageValue<S>): void => {
      localStorage.setItem(name, JSON.stringify(value));
    },

    removeItem: (name: string): void => {
      localStorage.removeItem(name);
    },
  };
}
