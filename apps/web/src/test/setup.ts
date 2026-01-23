/**
 * Vitest setup file for web app tests
 *
 * Provides:
 * - localStorage mock with vi.fn() for assertion tracking
 * - crypto.randomUUID mock for deterministic test IDs
 * - React testing cleanup
 * - jest-dom matchers
 *
 * =============================================================================
 * SNAPSHOT TESTING PATTERNS
 * =============================================================================
 *
 * Vitest includes built-in snapshot testing support. Use snapshots for visual
 * regression testing of UI components.
 *
 * FILE NAMING CONVENTION:
 *   ComponentName.snapshot.test.tsx
 *
 * DIRECTORY STRUCTURE:
 *   Vitest automatically creates __snapshots__/ directories next to test files:
 *   src/components/dials/
 *   ├── DialProgressBar.tsx
 *   ├── DialProgressBar.test.tsx         # Unit/behavior tests
 *   ├── DialProgressBar.snapshot.test.tsx # Snapshot tests
 *   └── __snapshots__/
 *       └── DialProgressBar.snapshot.test.tsx.snap
 *
 * WRITING SNAPSHOT TESTS:
 *   ```tsx
 *   import { render } from '@testing-library/react';
 *   import { MyComponent } from './MyComponent';
 *
 *   describe('MyComponent Snapshots', () => {
 *     it('renders default state', () => {
 *       const { container } = render(<MyComponent />);
 *       expect(container.firstChild).toMatchSnapshot();
 *     });
 *
 *     it('renders loading state', () => {
 *       const { container } = render(<MyComponent isLoading />);
 *       expect(container.firstChild).toMatchSnapshot();
 *     });
 *   });
 *   ```
 *
 * COMMANDS:
 *   - Run tests:      pnpm test
 *   - Update snaps:   pnpm test -- -u
 *   - Filter by file: pnpm --filter web test ComponentName.snapshot
 *
 * BEST PRACTICES:
 *   1. Test distinct visual states (empty, partial, complete, error)
 *   2. Keep snapshot tests separate from behavior tests
 *   3. Review snapshot diffs carefully before updating
 *   4. Use descriptive test names for easy identification
 *   5. Avoid snapshots with dynamic data (timestamps, random IDs)
 *
 * WHEN TO UPDATE SNAPSHOTS:
 *   - After intentional UI changes
 *   - NOT when investigating unexpected failures (fix the code instead)
 *
 * =============================================================================
 */

import { cleanup } from '@testing-library/react';
import { afterEach, vi, type Mock } from 'vitest';
import '@testing-library/jest-dom/vitest';

// =============================================================================
// React Cleanup
// =============================================================================

// Automatically clean up after each test
afterEach(() => {
  cleanup();
});

// =============================================================================
// localStorage Mock
// =============================================================================

interface StorageMock {
  store: Record<string, string>;
  getItem: Mock<(key: string) => string | null>;
  setItem: Mock<(key: string, value: string) => void>;
  removeItem: Mock<(key: string) => void>;
  clear: Mock<() => void>;
  key: Mock<(index: number) => string | null>;
  length: number;
}

const createLocalStorageMock = (): StorageMock => {
  let store: Record<string, string> = {};

  const clearFn = vi.fn((): void => {
    store = {};
    mock.store = store;
  });

  const mock: StorageMock = {
    store,
    getItem: vi.fn((key: string): string | null => {
      return store[key] ?? null;
    }),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key];
    }),
    clear: clearFn,
    key: vi.fn((index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };

  return mock;
};

const localStorageMock = createLocalStorageMock();

// Replace global localStorage
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Export for use in tests
export { localStorageMock };

// =============================================================================
// crypto.randomUUID Mock
// =============================================================================

let uuidCounter = 0;

const randomUUIDMock = vi.fn((): string => {
  uuidCounter += 1;
  return `test-uuid-${uuidCounter.toString().padStart(4, '0')}`;
});

// Reset counter between tests
afterEach(() => {
  uuidCounter = 0;
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: randomUUIDMock,
  },
  writable: true,
});

// Export for use in tests
export { randomUUIDMock };

// =============================================================================
// WebSocket Mock
// =============================================================================

/**
 * Mock WebSocket class for testing real-time communication
 * Provides test helpers to simulate server messages and connection events
 */
export class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void = vi.fn();
  close: (code?: number, reason?: string) => void = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: 1000, reason: 'Normal closure' } as CloseEvent);
  });

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);

    // Simulate async connection (like real WebSocket)
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.({} as Event);
    }, 0);
  }

  /** Test helper: simulate receiving a message from the server */
  simulateMessage(data: unknown): void {
    this.onmessage?.({
      data: JSON.stringify(data),
    } as MessageEvent);
  }

  /** Test helper: simulate server closing the connection */
  simulateClose(code = 1000, reason = 'Normal closure'): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason } as CloseEvent);
  }

  /** Test helper: simulate connection error */
  simulateError(): void {
    this.onerror?.({} as Event);
  }

  /** Reset all mock instances (call in afterEach) */
  static reset(): void {
    MockWebSocket.instances = [];
  }

  /** Get the most recent WebSocket instance */
  static getLastInstance(): MockWebSocket | undefined {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1];
  }
}

// Replace global WebSocket
Object.defineProperty(globalThis, 'WebSocket', {
  value: MockWebSocket,
  writable: true,
});

// =============================================================================
// Reset Mocks Between Tests
// =============================================================================

afterEach(() => {
  // Clear localStorage mock store and reset mock call tracking
  localStorageMock.store = {};
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();

  // Clear randomUUID mock
  randomUUIDMock.mockClear();

  // Reset WebSocket mock instances
  MockWebSocket.reset();
});
