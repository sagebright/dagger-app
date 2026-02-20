/**
 * Stripe service for Sage Codex API
 *
 * Provides a singleton Stripe client, credit package definitions,
 * customer management with race-condition handling, and checkout/portal
 * session creation. Follows the singleton pattern from supabase.ts.
 *
 * SECURITY: Stripe secret key and webhook secret must never be
 * exposed to frontend or client code.
 */

import Stripe from 'stripe';
import { config } from '../config.js';
import { getSupabase } from './supabase.js';
import { CREDIT_PACKAGES, type CreditPackage } from '@sage-codex/shared-types';

// =============================================================================
// Types
// =============================================================================

/** A credit package with its associated Stripe price ID */
export interface StripeCreditPackage extends CreditPackage {
  priceId: string;
}

// =============================================================================
// Singleton Client
// =============================================================================

let stripeClient: Stripe | null = null;

/**
 * Get or create the Stripe client singleton.
 *
 * Requires STRIPE_SECRET_KEY to be set in environment.
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = config.stripe.secretKey;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return stripeClient;
}

/**
 * Reset the Stripe client singleton (useful for testing)
 */
export function resetStripeClient(): void {
  stripeClient = null;
}

// =============================================================================
// Credit Packages
// =============================================================================

/** Maps CREDIT_PACKAGES indices to config price keys */
const PRICE_KEY_MAP: readonly ('oneCredit' | 'fiveCredits' | 'fifteenCredits')[] = [
  'oneCredit',
  'fiveCredits',
  'fifteenCredits',
];

/**
 * Get the available credit packages with Stripe price IDs.
 *
 * Merges the shared-types CREDIT_PACKAGES definitions with
 * the Stripe price IDs from config.
 */
export function getCreditPackages(): StripeCreditPackage[] {
  return CREDIT_PACKAGES.map((pkg, index) => ({
    ...pkg,
    priceId: config.stripe.prices[PRICE_KEY_MAP[index]],
  }));
}

// =============================================================================
// Customer Management
// =============================================================================

const UNIQUE_CONSTRAINT_CODE = '23505';

/**
 * Get or create a Stripe customer for a user.
 *
 * Lookup flow:
 * 1. Check stripe_customers table for existing mapping
 * 2. If not found, create Stripe customer via API
 * 3. Insert mapping into stripe_customers table
 * 4. If insert fails due to race condition (unique constraint),
 *    re-fetch the existing mapping
 *
 * @returns The Stripe customer ID (e.g., "cus_...")
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const supabase = getSupabase();

  // Step 1: Look up existing mapping
  const { data: existing } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  // Step 2: Create Stripe customer via API
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  // Step 3: Insert mapping
  const { error: insertError } = await supabase
    .from('stripe_customers')
    .insert({
      user_id: userId,
      stripe_customer_id: customer.id,
    })
    .select()
    .single();

  // Step 4: Handle race condition
  if (insertError?.code === UNIQUE_CONSTRAINT_CODE) {
    const { data: reFetched } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (reFetched?.stripe_customer_id) {
      return reFetched.stripe_customer_id;
    }
  }

  if (insertError && insertError.code !== UNIQUE_CONSTRAINT_CODE) {
    throw new Error(`Failed to save Stripe customer mapping: ${insertError.message}`);
  }

  return customer.id;
}

// =============================================================================
// Checkout & Portal Sessions
// =============================================================================

/** Options for creating a Stripe Checkout session */
export interface CheckoutSessionOptions {
  userId: string;
  email: string;
  priceId: string;
  credits: number;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout session for a one-time credit purchase.
 *
 * The session URL redirects the user to Stripe's hosted checkout page.
 * On completion, Stripe fires a checkout.session.completed webhook
 * that triggers credit fulfillment.
 */
export async function createCheckoutSession(
  options: CheckoutSessionOptions
): Promise<Stripe.Checkout.Session> {
  const { userId, email, priceId, credits, successUrl, cancelUrl } = options;
  const customerId = await getOrCreateStripeCustomer(userId, email);
  const stripe = getStripe();

  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      credits: String(credits),
    },
  });
}

/**
 * Create a Stripe Billing Portal session for payment method management.
 *
 * The portal URL opens Stripe's self-serve portal where users
 * can view invoices and update payment methods.
 */
export async function createPortalSession(
  userId: string,
  email: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const customerId = await getOrCreateStripeCustomer(userId, email);
  const stripe = getStripe();

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// =============================================================================
// Webhook Verification
// =============================================================================

/**
 * Construct and verify a Stripe webhook event from the raw request body.
 *
 * Throws if signature verification fails, preventing webhook spoofing.
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    config.stripe.webhookSecret
  );
}
