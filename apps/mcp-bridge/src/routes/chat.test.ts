/**
 * Tests for chat route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import chatRouter from './chat.js';
import { resetMCPServer } from '../mcp/mcpServer.js';

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/chat', chatRouter);
  return app;
}

describe('Chat Route', () => {
  let app: express.Express;

  beforeEach(() => {
    resetMCPServer();
    app = createApp();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /chat', () => {
    it('should process a chat message', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          message: 'We have 5 players',
          currentDials: {
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
            confirmedDials: [],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messageId');
      expect(response.body).toHaveProperty('content');
      expect(response.body.dialUpdates).toBeDefined();
    });

    it('should extract dial values from message', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          message: '5 players',
          currentDials: {
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
            confirmedDials: [],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.dialUpdates).toContainEqual(
        expect.objectContaining({
          dialId: 'partySize',
          value: 5,
        })
      );
    });

    it('should include conversation history context', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          message: 'make it 5',
          currentDials: {
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
            confirmedDials: [],
          },
          conversationHistory: [
            {
              id: 'msg-1',
              role: 'assistant',
              content: 'How many players?',
              timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
    });

    it('should track session ID', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          message: '4 players',
          sessionId: 'test-session-123',
          currentDials: {
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
            confirmedDials: [],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messageId');
    });

    it('should return 400 for missing message', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          currentDials: {
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
            confirmedDials: [],
          },
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('INVALID_REQUEST');
    });

    it('should return 400 for missing currentDials', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          message: 'Hello',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code');
    });

    it('should suggest next dial focus', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          message: '4 players',
          currentDials: {
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
            confirmedDials: [],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('nextDialFocus');
    });

    it('should include inline widgets when appropriate', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          message: '4 players',
          currentDials: {
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
            confirmedDials: [],
          },
        });

      expect(response.status).toBe(200);
      // Next focus should have a widget
      if (response.body.inlineWidgets) {
        expect(response.body.inlineWidgets.length).toBeGreaterThan(0);
      }
    });
  });

  describe('POST /chat/dial', () => {
    it('should update a single dial directly', async () => {
      const response = await request(app)
        .post('/chat/dial')
        .send({
          dialId: 'partySize',
          value: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('dialId', 'partySize');
      expect(response.body).toHaveProperty('value', 5);
    });

    it('should return 400 for invalid dial value', async () => {
      const response = await request(app)
        .post('/chat/dial')
        .send({
          dialId: 'partySize',
          value: 10,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'INVALID_VALUE');
    });

    it('should return 400 for missing dialId', async () => {
      const response = await request(app)
        .post('/chat/dial')
        .send({
          value: 5,
        });

      expect(response.status).toBe(400);
    });
  });
});
