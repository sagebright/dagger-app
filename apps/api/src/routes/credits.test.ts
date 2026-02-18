/**
 * Tests for credit management routes
 *
 * Validates credit balance, packages, checkout, transactions,
 * and customer portal endpoints. Uses supertest for HTTP-level
 * testing against the Express app.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// Mock dependencies before imports
vi.mock('../services/credits.js', () => ({
  getOrCreateBalance: vi.fn(),
  getTransactionHistory: vi.fn(),
  hasCredits: vi.fn(),
}));

vi.mock('../services/stripe.js', () => ({
  getCreditPackages: vi.fn(),
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
}));

import creditRouter from './credits.js';
import {
  getOrCreateBalance,
  getTransactionHistory,
} from '../services/credits.js';
import {
  getCreditPackages,
  createCheckoutSession,
  createPortalSession,
} from '../services/stripe.js';

// =============================================================================
// Test App Setup
// =============================================================================

function mockAuth(userId: string, email = 'test@example.com') {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: userId, email } as never;
    next();
  };
}

function createTestApp(userId = 'user-123', email = 'test@example.com') {
  const app = express();
  app.use(express.json());
  app.use(mockAuth(userId, email));
  app.use('/api/credits', creditRouter);
  return app;
}

function createUnauthenticatedApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/credits', creditRouter);
  return app;
}

// =============================================================================
// GET /api/credits/balance
// =============================================================================

describe('GET /api/credits/balance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const app = createUnauthenticatedApp();
    const res = await request(app).get('/api/credits/balance');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('User not authenticated');
  });

  it('returns balance and lifetime_credits on success', async () => {
    vi.mocked(getOrCreateBalance).mockResolvedValue({
      data: {
        id: 'bal-1',
        user_id: 'user-123',
        balance: 5,
        lifetime_credits: 10,
        created_at: '2026-01-01',
        updated_at: '2026-01-15',
      },
      error: null,
    });

    const app = createTestApp();
    const res = await request(app).get('/api/credits/balance');

    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(5);
    expect(res.body.lifetimeCredits).toBe(10);
  });

  it('returns 500 when balance lookup fails', async () => {
    vi.mocked(getOrCreateBalance).mockResolvedValue({
      data: null,
      error: 'Database connection failed',
    });

    const app = createTestApp();
    const res = await request(app).get('/api/credits/balance');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Database connection failed');
  });
});

// =============================================================================
// GET /api/credits/packages
// =============================================================================

describe('GET /api/credits/packages', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const app = createUnauthenticatedApp();
    const res = await request(app).get('/api/credits/packages');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('User not authenticated');
  });

  it('returns available credit packages', async () => {
    const packages = [
      {
        id: 'starter',
        name: 'Starter Pack',
        credits: 3,
        priceInCents: 499,
        description: '3 adventure credits',
        priceId: 'price_starter',
      },
    ];

    vi.mocked(getCreditPackages).mockReturnValue(packages);

    const app = createTestApp();
    const res = await request(app).get('/api/credits/packages');

    expect(res.status).toBe(200);
    expect(res.body.packages).toHaveLength(1);
    expect(res.body.packages[0].credits).toBe(3);
  });
});

// =============================================================================
// POST /api/credits/checkout
// =============================================================================

describe('POST /api/credits/checkout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const app = createUnauthenticatedApp();
    const res = await request(app)
      .post('/api/credits/checkout')
      .send({ packageId: 'starter' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('User not authenticated');
  });

  it('returns 400 when packageId is missing', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/credits/checkout')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('packageId');
  });

  it('returns 400 when packageId is invalid', async () => {
    vi.mocked(getCreditPackages).mockReturnValue([
      {
        id: 'starter',
        name: 'Starter',
        credits: 3,
        priceInCents: 499,
        description: '3 credits',
        priceId: 'price_starter',
      },
    ]);

    const app = createTestApp();
    const res = await request(app)
      .post('/api/credits/checkout')
      .send({ packageId: 'nonexistent' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid package');
  });

  it('returns checkout URL on success', async () => {
    vi.mocked(getCreditPackages).mockReturnValue([
      {
        id: 'starter',
        name: 'Starter',
        credits: 3,
        priceInCents: 499,
        description: '3 credits',
        priceId: 'price_starter',
      },
    ]);

    vi.mocked(createCheckoutSession).mockResolvedValue({
      url: 'https://checkout.stripe.com/session_123',
    } as never);

    const app = createTestApp();
    const res = await request(app)
      .post('/api/credits/checkout')
      .send({ packageId: 'starter' });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://checkout.stripe.com/session_123');
  });

  it('returns 500 when checkout session creation fails', async () => {
    vi.mocked(getCreditPackages).mockReturnValue([
      {
        id: 'starter',
        name: 'Starter',
        credits: 3,
        priceInCents: 499,
        description: '3 credits',
        priceId: 'price_starter',
      },
    ]);

    vi.mocked(createCheckoutSession).mockRejectedValue(
      new Error('Stripe API error')
    );

    const app = createTestApp();
    const res = await request(app)
      .post('/api/credits/checkout')
      .send({ packageId: 'starter' });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Stripe');
  });
});

// =============================================================================
// GET /api/credits/transactions
// =============================================================================

describe('GET /api/credits/transactions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const app = createUnauthenticatedApp();
    const res = await request(app).get('/api/credits/transactions');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('User not authenticated');
  });

  it('returns transaction history', async () => {
    const transactions = [
      {
        id: 'tx-1',
        user_id: 'user-123',
        amount: 3,
        balance_after: 3,
        transaction_type: 'purchase',
        description: 'Starter Pack',
        created_at: '2026-01-15',
      },
    ];

    vi.mocked(getTransactionHistory).mockResolvedValue({
      data: transactions,
      error: null,
    });

    const app = createTestApp();
    const res = await request(app).get('/api/credits/transactions');

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].amount).toBe(3);
  });

  it('returns 500 when transaction lookup fails', async () => {
    vi.mocked(getTransactionHistory).mockResolvedValue({
      data: null,
      error: 'Database error',
    });

    const app = createTestApp();
    const res = await request(app).get('/api/credits/transactions');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Database error');
  });
});

// =============================================================================
// POST /api/credits/portal
// =============================================================================

describe('POST /api/credits/portal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const app = createUnauthenticatedApp();
    const res = await request(app).post('/api/credits/portal');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('User not authenticated');
  });

  it('returns portal URL on success', async () => {
    vi.mocked(createPortalSession).mockResolvedValue({
      url: 'https://billing.stripe.com/portal_123',
    } as never);

    const app = createTestApp();
    const res = await request(app).post('/api/credits/portal');

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://billing.stripe.com/portal_123');
  });

  it('returns 500 when portal session creation fails', async () => {
    vi.mocked(createPortalSession).mockRejectedValue(
      new Error('Stripe portal error')
    );

    const app = createTestApp();
    const res = await request(app).post('/api/credits/portal');

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('portal');
  });
});
