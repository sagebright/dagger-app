/**
 * Frontend SSE mock for useSageStream hook testing
 *
 * Provides a mock EventSource that simulates Server-Sent Events
 * in the browser environment for testing streaming responses.
 *
 * Usage:
 *   import { MockEventSource, createSSEResponse } from '../test/helpers/sse-mock';
 *
 *   // Replace global EventSource before test
 *   Object.defineProperty(globalThis, 'EventSource', { value: MockEventSource });
 *
 *   // Simulate events in test
 *   const source = MockEventSource.getLastInstance();
 *   source.simulateEvent('text_delta', { content: 'Hello' });
 *   source.simulateEvent('stream_end', {});
 */

import { vi } from 'vitest';

// =============================================================================
// Types
// =============================================================================

/** A parsed SSE event for frontend consumption */
export interface ParsedSSEEvent {
  type: string;
  data: unknown;
  lastEventId?: string;
}

/** Configuration for creating a mock SSE stream */
interface SSEStreamConfig {
  /** Events to emit in sequence */
  events: Array<{ type: string; data: unknown; delayMs?: number }>;
  /** Whether to auto-close after all events */
  autoClose?: boolean;
}

// =============================================================================
// MockEventSource
// =============================================================================

/**
 * Mock EventSource class for testing SSE connections in the browser.
 *
 * Simulates the browser's EventSource API with test helpers for
 * injecting events and controlling the connection lifecycle.
 */
export class MockEventSource {
  static instances: MockEventSource[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  url: string;
  readyState: number = MockEventSource.CONNECTING;
  withCredentials: boolean;

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  close: () => void = vi.fn(() => {
    this.readyState = MockEventSource.CLOSED;
  });

  private eventListeners: Map<string, Array<(event: MessageEvent) => void>> = new Map();

  constructor(url: string, options?: { withCredentials?: boolean }) {
    this.url = url;
    this.withCredentials = options?.withCredentials ?? false;
    MockEventSource.instances.push(this);

    // Simulate async connection (like real EventSource)
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      this.onopen?.({} as Event);
    }, 0);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void): void {
    const listeners = this.eventListeners.get(type) ?? [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void): void {
    const listeners = this.eventListeners.get(type) ?? [];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  // =========================================================================
  // Test Helpers
  // =========================================================================

  /** Simulate receiving a named event */
  simulateEvent(type: string, data: unknown): void {
    const messageEvent = new MessageEvent(type, {
      data: typeof data === 'string' ? data : JSON.stringify(data),
    });

    // Dispatch to type-specific listeners
    const listeners = this.eventListeners.get(type) ?? [];
    for (const listener of listeners) {
      listener(messageEvent);
    }

    // Dispatch to onmessage if the type is 'message'
    if (type === 'message' && this.onmessage) {
      this.onmessage(messageEvent);
    }
  }

  /** Simulate a connection error */
  simulateError(): void {
    this.readyState = MockEventSource.CLOSED;
    this.onerror?.({} as Event);
  }

  /** Simulate server closing the connection */
  simulateClose(): void {
    this.readyState = MockEventSource.CLOSED;
    this.onerror?.({ type: 'error' } as Event);
  }

  /** Reset all mock instances (call in afterEach) */
  static reset(): void {
    MockEventSource.instances = [];
  }

  /** Get the most recent EventSource instance */
  static getLastInstance(): MockEventSource | undefined {
    return MockEventSource.instances[MockEventSource.instances.length - 1];
  }
}

// =============================================================================
// SSE Response Builder
// =============================================================================

/**
 * Create a mock fetch Response that returns SSE-formatted text.
 *
 * Useful for testing fetch-based SSE implementations (as opposed to EventSource).
 * Returns a Response with a ReadableStream body in SSE format.
 */
export function createSSEResponse(config: SSEStreamConfig): Response {
  const { events, autoClose = true } = config;

  const sseText = events
    .map((event) => {
      const dataStr = typeof event.data === 'string'
        ? event.data
        : JSON.stringify(event.data);
      return `event: ${event.type}\ndata: ${dataStr}\n\n`;
    })
    .join('');

  const finalText = autoClose
    ? sseText + 'event: done\ndata: {}\n\n'
    : sseText;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(finalText));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * Create a mock fetch Response that streams SSE events with delays.
 *
 * Simulates real streaming behavior by introducing delays between events.
 */
export function createDelayedSSEResponse(config: SSEStreamConfig): Response {
  const { events, autoClose = true } = config;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const event of events) {
        if (event.delayMs) {
          await new Promise((resolve) => setTimeout(resolve, event.delayMs));
        }
        const dataStr = typeof event.data === 'string'
          ? event.data
          : JSON.stringify(event.data);
        const chunk = `event: ${event.type}\ndata: ${dataStr}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      }

      if (autoClose) {
        controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * Collect events from a ReadableStream in SSE format.
 *
 * Frontend equivalent of the API SSE helper, designed for testing
 * client-side streaming consumption.
 */
export async function collectStreamEvents(
  response: Response
): Promise<ParsedSSEEvent[]> {
  const text = await response.text();
  const events: ParsedSSEEvent[] = [];

  const rawEvents = text.split('\n\n').filter((block) => block.trim().length > 0);
  for (const rawEvent of rawEvents) {
    let eventType = 'message';
    let dataLine = '';

    const lines = rawEvent.split('\n');
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice('event:'.length).trim();
      } else if (line.startsWith('data:')) {
        dataLine = line.slice('data:'.length).trim();
      }
    }

    if (!dataLine) continue;

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(dataLine);
    } catch {
      parsedData = dataLine;
    }

    events.push({ type: eventType, data: parsedData });
  }

  return events;
}
