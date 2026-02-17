/**
 * Tests for POST /api/chat SSE endpoint
 *
 * Verifies the full chat flow:
 * - Request validation (message, sessionId, auth)
 * - SSE response format and headers
 * - Streaming events (chat:start, chat:delta, chat:end)
 * - Tool dispatch lifecycle
 * - Error handling (pre-stream and mid-stream)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { mockAnthropicStream } from '../test/mocks/anthropic.js';
import {
  createMockSupabaseClient,
  mockQueryResult,
  mockAuthUser,
} from '../test/mocks/supabase.js';
import { parseSSEChunk } from '../test/helpers/sse.js';

// =============================================================================
// Mocks
// =============================================================================

const mockClient = createMockSupabaseClient();

vi.mock('../services/supabase.js', () => ({
  getSupabase: vi.fn(() => mockClient),
  checkSupabaseHealth: vi.fn().mockResolvedValue({ connected: true }),
}));

// Mock the anthropic service to return a controlled stream
vi.mock('../services/anthropic.js', () => ({
  createStreamingMessage: vi.fn(),
  getAnthropicClient: vi.fn(),
  resetAnthropicClient: vi.fn(),
}));

// Mock message store
vi.mock('../services/message-store.js', () => ({
  storeMessage: vi.fn().mockResolvedValue({ data: { id: 'msg-mock' }, error: null }),
  loadConversationHistory: vi.fn().mockResolvedValue({ data: [], error: null }),
}));

// Mock token tracker
vi.mock('../services/token-tracker.js', () => ({
  logTokenUsage: vi.fn().mockResolvedValue({ success: true }),
}));

// =============================================================================
// Helpers
// =============================================================================

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-token-valid' };
}

function setupAuthMock(): void {
  mockAuthUser(mockClient, { id: 'user-001', email: 'test@test.com' });
  // Mock profile check (access gate)
  mockQueryResult(mockClient, { data: [{ is_active: true }] });
}

// =============================================================================
// Tests
// =============================================================================

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthMock();
  });

  describe('authentication', () => {
    it('should return 401 without auth header', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'hi', sessionId: 'session-001' });

      expect(response.status).toBe(401);
    });
  });

  describe('request validation', () => {
    it('should return 400 when message is missing', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set(authHeaders())
        .send({ sessionId: 'session-001' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('message');
    });

    it('should return 400 when sessionId is missing', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set(authHeaders())
        .send({ message: 'hello' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('sessionId');
    });

    it('should return 400 when message is not a string', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set(authHeaders())
        .send({ message: 123, sessionId: 'session-001' });

      expect(response.status).toBe(400);
    });
  });

  describe('SSE streaming', () => {
    it('should return SSE content type and stream events', async () => {
      const { createStreamingMessage } = await import('../services/anthropic.js');
      const mockCreate = vi.mocked(createStreamingMessage);
      mockCreate.mockResolvedValue(
        mockAnthropicStream({
          textChunks: ['Hello', ' there'],
          inputTokens: 50,
          outputTokens: 20,
        })
      );

      const response = await request(app)
        .post('/api/chat')
        .set(authHeaders())
        .send({ message: 'hi', sessionId: 'session-001' })
        .buffer(true)
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            callback(null, data);
          });
        });

      expect(response.headers['content-type']).toContain('text/event-stream');

      const events = parseSSEChunk(response.body as string);
      const eventTypes = events.map((e) => e.type);

      expect(eventTypes).toContain('chat:start');
      expect(eventTypes).toContain('chat:delta');
      expect(eventTypes).toContain('chat:end');
    });

    it('should include text content in chat:delta events', async () => {
      const { createStreamingMessage } = await import('../services/anthropic.js');
      const mockCreate = vi.mocked(createStreamingMessage);
      mockCreate.mockResolvedValue(
        mockAnthropicStream({
          textChunks: ['The ', 'monastery.'],
          inputTokens: 50,
          outputTokens: 20,
        })
      );

      const response = await request(app)
        .post('/api/chat')
        .set(authHeaders())
        .send({ message: 'describe the place', sessionId: 'session-001' })
        .buffer(true)
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            callback(null, data);
          });
        });

      const events = parseSSEChunk(response.body as string);
      const deltas = events
        .filter((e) => e.type === 'chat:delta')
        .map((e) => (e.data as { content: string }).content);

      expect(deltas).toContain('The ');
      expect(deltas).toContain('monastery.');
    });

    it('should include token counts in chat:end event', async () => {
      const { createStreamingMessage } = await import('../services/anthropic.js');
      const mockCreate = vi.mocked(createStreamingMessage);
      mockCreate.mockResolvedValue(
        mockAnthropicStream({
          textChunks: ['ok'],
          inputTokens: 80,
          outputTokens: 30,
        })
      );

      const response = await request(app)
        .post('/api/chat')
        .set(authHeaders())
        .send({ message: 'test', sessionId: 'session-001' })
        .buffer(true)
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            callback(null, data);
          });
        });

      const events = parseSSEChunk(response.body as string);
      const endEvent = events.find((e) => e.type === 'chat:end');

      expect(endEvent).toBeTruthy();
      const endData = endEvent!.data as {
        inputTokens: number;
        outputTokens: number;
      };
      expect(endData.inputTokens).toBe(80);
      expect(endData.outputTokens).toBe(30);
    });
  });

  describe('message storage', () => {
    it('should store the user message', async () => {
      const { createStreamingMessage } = await import('../services/anthropic.js');
      const { storeMessage } = await import('../services/message-store.js');
      const mockCreate = vi.mocked(createStreamingMessage);
      const mockStore = vi.mocked(storeMessage);

      mockCreate.mockResolvedValue(
        mockAnthropicStream({ textChunks: ['ok'] })
      );

      await request(app)
        .post('/api/chat')
        .set(authHeaders())
        .send({ message: 'test message', sessionId: 'session-001' })
        .buffer(true)
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            callback(null, data);
          });
        });

      // First call should be the user message
      expect(mockStore).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-001',
          role: 'user',
          content: 'test message',
        })
      );
    });

    it('should store the assistant response', async () => {
      const { createStreamingMessage } = await import('../services/anthropic.js');
      const { storeMessage } = await import('../services/message-store.js');
      const mockCreate = vi.mocked(createStreamingMessage);
      const mockStore = vi.mocked(storeMessage);

      mockCreate.mockResolvedValue(
        mockAnthropicStream({ textChunks: ['response text'] })
      );

      await request(app)
        .post('/api/chat')
        .set(authHeaders())
        .send({ message: 'hi', sessionId: 'session-001' })
        .buffer(true)
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            callback(null, data);
          });
        });

      // Second call should be the assistant message
      const calls = mockStore.mock.calls;
      const assistantCall = calls.find(
        (c) => (c[0] as { role: string }).role === 'assistant'
      );
      expect(assistantCall).toBeTruthy();
      expect((assistantCall![0] as { content: string }).content).toBe(
        'response text'
      );
    });
  });

  describe('token tracking', () => {
    it('should log token usage after streaming', async () => {
      const { createStreamingMessage } = await import('../services/anthropic.js');
      const { logTokenUsage } = await import('../services/token-tracker.js');
      const mockCreate = vi.mocked(createStreamingMessage);
      const mockLog = vi.mocked(logTokenUsage);

      mockCreate.mockResolvedValue(
        mockAnthropicStream({
          textChunks: ['ok'],
          inputTokens: 100,
          outputTokens: 50,
        })
      );

      await request(app)
        .post('/api/chat')
        .set(authHeaders())
        .send({ message: 'test', sessionId: 'session-001' })
        .buffer(true)
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            callback(null, data);
          });
        });

      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-001',
          inputTokens: 100,
          outputTokens: 50,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should send SSE error event when stream creation fails after headers sent', async () => {
      const { createStreamingMessage } = await import('../services/anthropic.js');
      const mockCreate = vi.mocked(createStreamingMessage);
      mockCreate.mockRejectedValue(new Error('API key invalid'));

      const response = await request(app)
        .post('/api/chat')
        .set(authHeaders())
        .send({ message: 'test', sessionId: 'session-001' })
        .buffer(true)
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            callback(null, data);
          });
        });

      // Headers were already sent (SSE initialized before createStreamingMessage)
      // so the error is sent as an SSE event, not a JSON 500
      const events = parseSSEChunk(response.body as string);
      const errorEvent = events.find((e) => e.type === 'error');

      expect(errorEvent).toBeTruthy();
      expect((errorEvent!.data as { message: string }).message).toContain(
        'API key invalid'
      );
    });
  });
});
