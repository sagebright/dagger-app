/**
 * Credit management routes for Sage Codex API
 *
 * Provides endpoints for credit balance, packages, checkout,
 * transaction history, and Stripe customer portal.
 * All routes require authentication (requireAuth middleware applied upstream).
 *
 * Routes:
 *   GET    /api/credits/balance      - Current credit balance
 *   GET    /api/credits/packages     - Available credit packages
 *   POST   /api/credits/checkout     - Create Stripe checkout session
 *   GET    /api/credits/transactions - Transaction history
 *   POST   /api/credits/portal       - Create Stripe customer portal session
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import {
  getOrCreateBalance,
  getTransactionHistory,
} from '../services/credits.js';
import {
  getCreditPackages,
  createCheckoutSession,
  createPortalSession,
} from '../services/stripe.js';
import { config } from '../config.js';

const router: RouterType = Router();

// =============================================================================
// Constants
// =============================================================================

// Derive frontend URL from the first allowed origin (single-origin in this project)
const FRONTEND_BASE_URL = config.allowedOrigins.split(',')[0].trim();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/credits/balance
 *
 * Returns the authenticated user's current credit balance.
 */
router.get('/balance', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const result = await getOrCreateBalance(userId);

  if (result.error || !result.data) {
    res.status(500).json({ error: result.error ?? 'Failed to fetch balance' });
    return;
  }

  res.json({
    balance: result.data.balance,
    lifetimeCredits: result.data.lifetime_credits,
  });
});

/**
 * GET /api/credits/packages
 *
 * Returns the available credit packages with pricing.
 */
router.get('/packages', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const packages = getCreditPackages();
  res.json({ packages });
});

/**
 * POST /api/credits/checkout
 *
 * Creates a Stripe Checkout session for a credit package purchase.
 * Body: { packageId: string }
 * Returns: { url: string }
 */
router.post('/checkout', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const email = req.user?.email;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  if (!email) {
    res.status(400).json({ error: 'User email is required for checkout' });
    return;
  }

  const { packageId } = req.body;
  if (!packageId || typeof packageId !== 'string') {
    res
      .status(400)
      .json({ error: 'packageId is required and must be a string' });
    return;
  }

  const packages = getCreditPackages();
  const selectedPackage = packages.find((pkg) => pkg.id === packageId);
  if (!selectedPackage) {
    res.status(400).json({
      error: `Invalid package: "${packageId}". Use GET /api/credits/packages to see available options.`,
    });
    return;
  }

  try {
    const session = await createCheckoutSession({
      userId,
      email,
      priceId: selectedPackage.priceId,
      credits: selectedPackage.credits,
      successUrl: `${FRONTEND_BASE_URL}/settings?checkout=success`,
      cancelUrl: `${FRONTEND_BASE_URL}/settings?checkout=cancelled`,
    });

    res.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Stripe checkout failed';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/credits/transactions
 *
 * Returns the user's credit transaction history, most recent first.
 * Query: ?limit=20 (optional, default 20)
 */
router.get('/transactions', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const limit = parseInt(String(req.query.limit ?? '20'), 10);
  const safeLimit = isNaN(limit) || limit < 1 ? 20 : Math.min(limit, 100);

  const result = await getTransactionHistory(userId, safeLimit);

  if (result.error) {
    res.status(500).json({ error: result.error });
    return;
  }

  res.json({ transactions: result.data ?? [] });
});

/**
 * POST /api/credits/portal
 *
 * Creates a Stripe Billing Portal session for the authenticated user.
 * Returns: { url: string }
 */
router.post('/portal', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const email = req.user?.email;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  if (!email) {
    res.status(400).json({ error: 'User email is required for portal access' });
    return;
  }

  try {
    const session = await createPortalSession(
      userId,
      email,
      `${FRONTEND_BASE_URL}/settings`
    );

    res.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create portal session';
    res.status(500).json({ error: message });
  }
});

export default router;
