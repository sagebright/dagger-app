/**
 * Tests for Stripe webhook route
 *
 * Validates webhook signature verification, credit fulfillment on
 * checkout.session.completed, idempotency for duplicate deliveries,
 * and rejection of invalid/missing metadata.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock dependencies before imports
vi.mock('../services/stripe.js', () => ({
  constructWebhookEvent: vi.fn(),
}));

vi.mock('../services/credits.js', () => ({
  addCredits: vi.fn(),
}));

import stripeWebhookRouter from './stripe-webhook.js';
import { constructWebhookEvent } from '../services/stripe.js';
import { addCredits } from '../services/credits.js';

// =============================================================================
// Test App Setup
// =============================================================================

function createTestApp() {
  const app = express();
  // Webhook route must use raw body (simulated via text/plain in tests)
  app.use(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhookRouter
  );
  return app;
}

// =============================================================================
// POST /api/stripe/webhook
// =============================================================================

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('signature');
  });

  it('returns 400 when signature verification fails', async () => {
    vi.mocked(constructWebhookEvent).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'invalid_sig')
      .send('{}');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('signature');
  });

  it('fulfills credits on checkout.session.completed', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            userId: 'user-123',
            credits: '3',
          },
        },
      },
    };

    vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent as never);
    vi.mocked(addCredits).mockResolvedValue({
      data: { success: true, new_balance: 3, transaction_id: 'tx-1' },
      error: null,
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid_sig')
      .send(JSON.stringify(mockEvent));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(addCredits).toHaveBeenCalledWith(
      'user-123',
      3,
      'cs_test_123',
      'Credit purchase: 3 credits',
      'stripe_cs_test_123'
    );
  });

  it('handles duplicate webhook delivery without double-crediting', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            userId: 'user-123',
            credits: '3',
          },
        },
      },
    };

    vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent as never);
    vi.mocked(addCredits).mockResolvedValue({
      data: { success: true, idempotent: true },
      error: null,
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid_sig')
      .send(JSON.stringify(mockEvent));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it('returns 400 when checkout metadata is missing userId', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            credits: '3',
          },
        },
      },
    };

    vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent as never);

    const app = createTestApp();
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid_sig')
      .send(JSON.stringify(mockEvent));

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('metadata');
  });

  it('returns 400 when checkout metadata is missing credits', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            userId: 'user-123',
          },
        },
      },
    };

    vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent as never);

    const app = createTestApp();
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid_sig')
      .send(JSON.stringify(mockEvent));

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('metadata');
  });

  it('returns 200 for unhandled event types', async () => {
    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: { object: {} },
    };

    vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent as never);

    const app = createTestApp();
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid_sig')
      .send(JSON.stringify(mockEvent));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it('returns 500 when credit fulfillment fails', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            userId: 'user-123',
            credits: '3',
          },
        },
      },
    };

    vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent as never);
    vi.mocked(addCredits).mockResolvedValue({
      data: null,
      error: 'Database error',
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid_sig')
      .send(JSON.stringify(mockEvent));

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('fulfillment');
  });
});
