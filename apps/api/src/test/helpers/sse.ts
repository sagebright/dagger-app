/**
 * SSE (Server-Sent Events) stream test utilities
 *
 * Provides helpers for testing SSE endpoints:
 * - Collect events from a response stream into an array
 * - Wait for a specific event type
 * - Assert event sequences match expected patterns
 *
 * Usage:
 *   import { collectSSEEvents, waitForEvent, assertEventSequence } from '../test/helpers/sse';
 *
 *   const events = await collectSSEEvents(response);
 *   assertEventSequence(events, ['stream_start', 'text_delta', 'stream_end']);
 */

// =============================================================================
// Types
// =============================================================================

/** A parsed SSE event with type, data, and optional fields */
export interface SSEEvent {
  /** The event type (from the `event:` field, defaults to 'message') */
  type: string;
  /** The parsed data payload (JSON-parsed if possible, raw string otherwise) */
  data: unknown;
  /** The raw data string before parsing */
  rawData: string;
  /** Optional event ID from the `id:` field */
  id?: string;
  /** Optional retry interval from the `retry:` field */
  retry?: number;
}

/** Configuration for collectSSEEvents */
interface CollectConfig {
  /** Maximum time to wait for events in milliseconds (default: 5000) */
  timeoutMs?: number;
  /** Stop collecting after receiving an event with this type */
  stopOnType?: string;
  /** Maximum number of events to collect */
  maxEvents?: number;
}

/** Configuration for waitForEvent */
interface WaitConfig {
  /** Maximum time to wait in milliseconds (default: 5000) */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5000;

// =============================================================================
// SSE Parsing
// =============================================================================

/**
 * Parse a raw SSE text chunk into individual events.
 *
 * SSE format:
 *   event: type\n
 *   data: payload\n
 *   id: optional-id\n
 *   \n
 */
export function parseSSEChunk(chunk: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const rawEvents = chunk.split('\n\n').filter((block) => block.trim().length > 0);

  for (const rawEvent of rawEvents) {
    let eventType = 'message';
    let dataLines: string[] = [];
    let eventId: string | undefined;
    let retry: number | undefined;

    const lines = rawEvent.split('\n');
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice('event:'.length).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice('data:'.length).trim());
      } else if (line.startsWith('id:')) {
        eventId = line.slice('id:'.length).trim();
      } else if (line.startsWith('retry:')) {
        const retryValue = parseInt(line.slice('retry:'.length).trim(), 10);
        if (!isNaN(retryValue)) {
          retry = retryValue;
        }
      }
    }

    if (dataLines.length === 0) continue;

    const rawData = dataLines.join('\n');
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(rawData);
    } catch {
      parsedData = rawData;
    }

    events.push({
      type: eventType,
      data: parsedData,
      rawData,
      ...(eventId !== undefined && { id: eventId }),
      ...(retry !== undefined && { retry }),
    });
  }

  return events;
}

// =============================================================================
// Event Collection
// =============================================================================

/**
 * Collect SSE events from a readable stream (e.g., supertest response body).
 *
 * Reads the response body as text and parses SSE events from it.
 * Supports both Node.js ReadableStream and plain string bodies.
 */
export async function collectSSEEvents(
  responseBody: string | NodeJS.ReadableStream | ReadableStream<Uint8Array>,
  config: CollectConfig = {}
): Promise<SSEEvent[]> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    stopOnType,
    maxEvents,
  } = config;

  // If the body is already a string, parse directly
  if (typeof responseBody === 'string') {
    const allEvents = parseSSEChunk(responseBody);
    return applyCollectLimits(allEvents, { stopOnType, maxEvents });
  }

  // Read from a stream
  return new Promise<SSEEvent[]>((resolve, reject) => {
    const events: SSEEvent[] = [];
    let buffer = '';

    const timeout = setTimeout(() => {
      resolve(events);
    }, timeoutMs);

    const onData = (chunk: Buffer | string) => {
      buffer += chunk.toString();
      const parsed = parseSSEChunk(buffer);
      buffer = '';

      for (const event of parsed) {
        events.push(event);

        if (stopOnType && event.type === stopOnType) {
          clearTimeout(timeout);
          resolve(events);
          return;
        }

        if (maxEvents && events.length >= maxEvents) {
          clearTimeout(timeout);
          resolve(events);
          return;
        }
      }
    };

    const onEnd = () => {
      clearTimeout(timeout);
      // Parse any remaining buffer
      if (buffer.trim().length > 0) {
        events.push(...parseSSEChunk(buffer));
      }
      resolve(events);
    };

    const onError = (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    };

    if ('on' in responseBody && typeof responseBody.on === 'function') {
      // Node.js ReadableStream
      responseBody.on('data', onData);
      responseBody.on('end', onEnd);
      responseBody.on('error', onError);
    } else {
      // Web ReadableStream
      const reader = (responseBody as ReadableStream<Uint8Array>).getReader();
      const decoder = new TextDecoder();

      const readChunk = (): void => {
        reader.read().then(({ done, value }) => {
          if (done) {
            onEnd();
            return;
          }
          onData(decoder.decode(value, { stream: true }));
          readChunk();
        }).catch(onError);
      };

      readChunk();
    }
  });
}

function applyCollectLimits(
  events: SSEEvent[],
  config: { stopOnType?: string; maxEvents?: number }
): SSEEvent[] {
  const { stopOnType, maxEvents } = config;
  const result: SSEEvent[] = [];

  for (const event of events) {
    result.push(event);

    if (stopOnType && event.type === stopOnType) break;
    if (maxEvents && result.length >= maxEvents) break;
  }

  return result;
}

// =============================================================================
// Event Assertions
// =============================================================================

/**
 * Assert that the collected events match an expected sequence of event types.
 *
 * Example:
 *   assertEventSequence(events, ['stream_start', 'text_delta', 'text_delta', 'stream_end']);
 *
 * Throws a descriptive error if the sequence doesn't match.
 */
export function assertEventSequence(
  events: SSEEvent[],
  expectedTypes: string[]
): void {
  const actualTypes = events.map((e) => e.type);

  if (actualTypes.length !== expectedTypes.length) {
    throw new Error(
      `Event sequence length mismatch.\n` +
      `  Expected ${expectedTypes.length} events: [${expectedTypes.join(', ')}]\n` +
      `  Received ${actualTypes.length} events: [${actualTypes.join(', ')}]`
    );
  }

  for (let i = 0; i < expectedTypes.length; i++) {
    if (actualTypes[i] !== expectedTypes[i]) {
      throw new Error(
        `Event type mismatch at index ${i}.\n` +
        `  Expected: "${expectedTypes[i]}"\n` +
        `  Received: "${actualTypes[i]}"\n` +
        `  Full sequence: [${actualTypes.join(', ')}]`
      );
    }
  }
}

/**
 * Assert that the event sequence contains the expected types in order,
 * but allows additional events between them.
 *
 * Example:
 *   assertEventSubsequence(events, ['stream_start', 'stream_end']);
 *   // Passes even if there are text_delta events in between
 */
export function assertEventSubsequence(
  events: SSEEvent[],
  expectedTypes: string[]
): void {
  const actualTypes = events.map((e) => e.type);
  let expectedIndex = 0;

  for (const actualType of actualTypes) {
    if (expectedIndex < expectedTypes.length && actualType === expectedTypes[expectedIndex]) {
      expectedIndex++;
    }
  }

  if (expectedIndex !== expectedTypes.length) {
    const missingTypes = expectedTypes.slice(expectedIndex);
    throw new Error(
      `Event subsequence not found.\n` +
      `  Expected subsequence: [${expectedTypes.join(', ')}]\n` +
      `  Missing types: [${missingTypes.join(', ')}]\n` +
      `  Actual sequence: [${actualTypes.join(', ')}]`
    );
  }
}

/**
 * Wait for a specific event type in a stream of events.
 *
 * Returns the first event matching the given type, or rejects with timeout.
 */
export async function waitForEvent(
  events: SSEEvent[],
  eventType: string,
  config: WaitConfig = {}
): Promise<SSEEvent> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS } = config;

  // Check already-collected events first
  const found = events.find((e) => e.type === eventType);
  if (found) return found;

  // If not found, poll briefly (useful when events are still being collected)
  return new Promise<SSEEvent>((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const match = events.find((e) => e.type === eventType);
      if (match) {
        resolve(match);
        return;
      }

      if (Date.now() - startTime > timeoutMs) {
        const availableTypes = events.map((e) => e.type);
        reject(new Error(
          `Timed out waiting for event type "${eventType}" after ${timeoutMs}ms.\n` +
          `  Available event types: [${availableTypes.join(', ')}]`
        ));
        return;
      }

      setTimeout(check, 10);
    };

    check();
  });
}

/**
 * Extract all events of a specific type from a collected event list.
 */
export function filterEventsByType(
  events: SSEEvent[],
  eventType: string
): SSEEvent[] {
  return events.filter((e) => e.type === eventType);
}

/**
 * Build a raw SSE string for testing parsers and response handlers.
 *
 * Example:
 *   const raw = buildSSEString('text_delta', { content: 'hello' });
 *   // "event: text_delta\ndata: {\"content\":\"hello\"}\n\n"
 */
export function buildSSEString(
  eventType: string,
  data: unknown,
  id?: string
): string {
  let result = '';
  if (eventType !== 'message') {
    result += `event: ${eventType}\n`;
  }
  if (id) {
    result += `id: ${id}\n`;
  }
  result += `data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n`;
  result += '\n';
  return result;
}
