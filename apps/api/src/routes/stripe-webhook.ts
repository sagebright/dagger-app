/**
 * Stripe webhook route for Sage Codex API
 *
 * Handles Stripe webhook events for credit fulfillment.
 * This route does NOT use requireAuth — Stripe calls it directly.
 *
 * CRITICAL: Must be registered BEFORE express.json() middleware
 * because Stripe signature verification requires the raw request body.
 *
 * Supported events:
 *   checkout.session.completed — Fulfills credits after successful payment
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { constructWebhookEvent } from '../services/stripe.js';
import { addCredits } from '../services/credits.js';

const router: RouterType = Router();

// =============================================================================
// Types
// =============================================================================

interface CheckoutMetadata {
  userId: string;
  credits: number;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Validate that checkout session metadata contains required fields.
 *
 * Returns the validated metadata or an error message.
 */
function validateCheckoutMetadata(
  metadata: Record<string, string> | null | undefined
): { valid: true; data: CheckoutMetadata } | { valid: false; error: string } {
  if (!metadata?.userId || !metadata?.credits) {
    return {
      valid: false,
      error: 'Checkout session missing required metadata (userId, credits)',
    };
  }

  const credits = parseInt(metadata.credits, 10);
  if (isNaN(credits) || credits <= 0) {
    return {
      valid: false,
      error: 'Checkout session metadata has invalid credits value',
    };
  }

  return {
    valid: true,
    data: { userId: metadata.userId, credits },
  };
}

/**
 * Fulfill credits for a completed checkout session.
 *
 * Uses the Stripe session ID as the idempotency key prefix
 * to prevent double-crediting on webhook retries.
 */
async function fulfillCheckoutCredits(
  sessionId: string,
  userId: string,
  credits: number
): Promise<{ success: boolean; error?: string }> {
  const idempotencyKey = `stripe_${sessionId}`;
  const description = `Credit purchase: ${credits} credits`;

  const result = await addCredits(
    userId,
    credits,
    sessionId,
    description,
    idempotencyKey
  );

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

// =============================================================================
// Route
// =============================================================================

/**
 * POST /api/stripe/webhook
 *
 * Receives and processes Stripe webhook events.
 * Requires raw body for signature verification.
 */
router.post('/', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!signature) {
    res
      .status(400)
      .json({ error: 'Missing stripe-signature header' });
    return;
  }

  // Verify signature and parse event
  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error(`[stripe-webhook] Signature verification failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    res
      .status(400)
      .json({ error: 'Webhook signature verification failed' });
    return;
  }

  console.log(`[stripe-webhook] Received event: ${event.type} (${event.id})`);

  // Handle supported event types
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id: string;
      metadata: Record<string, string>;
    };

    const validation = validateCheckoutMetadata(session.metadata);
    if (!validation.valid) {
      console.warn(`[stripe-webhook] Invalid metadata for session ${session.id}: ${validation.error}`);
      res.status(400).json({ error: validation.error });
      return;
    }

    const fulfillment = await fulfillCheckoutCredits(
      session.id,
      validation.data.userId,
      validation.data.credits
    );

    if (!fulfillment.success) {
      console.error(`[stripe-webhook] Credit fulfillment failed for user=${validation.data.userId} credits=${validation.data.credits} session=${session.id}: ${fulfillment.error}`);
      res
        .status(500)
        .json({ error: `Credit fulfillment failed: ${fulfillment.error}` });
      return;
    }

    console.log(`[stripe-webhook] Credits fulfilled: user=${validation.data.userId} credits=${validation.data.credits} session=${session.id}`);
  }

  // Log unhandled event types for debugging
  if (event.type !== 'checkout.session.completed') {
    console.warn(`[stripe-webhook] Unhandled event type: ${event.type}`);
  }

  // Acknowledge receipt for all events (including unhandled types)
  res.json({ received: true });
});

export default router;
