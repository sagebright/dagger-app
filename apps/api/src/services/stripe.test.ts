/**
 * Tests for Stripe service
 *
 * Validates the singleton Stripe client, customer management,
 * checkout/portal session creation, and webhook verification.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =============================================================================
// Mocks — must be declared before imports that use them
// =============================================================================

/** Shared mock instance returned by `new Stripe(...)` */
const mockStripeInstance = {
  customers: {
    create: vi.fn(),
    list: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
};

vi.mock('stripe', () => {
  // Use a real function so `new Stripe(...)` works
  function StripeMock() {
    return mockStripeInstance;
  }
  return { default: StripeMock };
});

vi.mock('../config.js', () => ({
  config: {
    stripe: {
      secretKey: 'sk_test_fake_key',
      webhookSecret: 'whsec_test_fake_secret',
      prices: {
        oneCredit: 'price_1_credit',
        fiveCredits: 'price_5_credits',
        fifteenCredits: 'price_15_credits',
      },
    },
  },
}));

vi.mock('./supabase.js', () => ({
  getSupabase: vi.fn(),
}));

// Imports after mocks
import {
  getStripe,
  resetStripeClient,
  getCreditPackages,
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
} from './stripe.js';
import { getSupabase } from './supabase.js';

// =============================================================================
// Helpers
// =============================================================================

function createChainableMock(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

// =============================================================================
// getStripe Tests
// =============================================================================

describe('getStripe', () => {
  beforeEach(() => {
    resetStripeClient();
  });

  it('returns a Stripe client instance', () => {
    const client = getStripe();
    expect(client).toBeDefined();
    expect(client.customers).toBeDefined();
    expect(client.checkout).toBeDefined();
  });

  it('returns the same instance on repeated calls (singleton)', () => {
    const first = getStripe();
    const second = getStripe();
    expect(first).toBe(second);
  });
});

// =============================================================================
// getCreditPackages Tests
// =============================================================================

describe('getCreditPackages', () => {
  it('returns three credit packages', () => {
    const packages = getCreditPackages();
    expect(packages).toHaveLength(3);
  });

  it('each package has required fields', () => {
    const packages = getCreditPackages();
    for (const pkg of packages) {
      expect(pkg).toHaveProperty('id');
      expect(pkg).toHaveProperty('name');
      expect(pkg).toHaveProperty('credits');
      expect(pkg).toHaveProperty('priceId');
      expect(pkg).toHaveProperty('priceInCents');
    }
  });

  it('maps price IDs from config', () => {
    const packages = getCreditPackages();
    const priceIds = packages.map((p) => p.priceId);
    expect(priceIds).toContain('price_1_credit');
    expect(priceIds).toContain('price_5_credits');
    expect(priceIds).toContain('price_15_credits');
  });
});

// =============================================================================
// getOrCreateStripeCustomer Tests
// =============================================================================

describe('getOrCreateStripeCustomer', () => {
  beforeEach(() => {
    resetStripeClient();
    vi.mocked(mockStripeInstance.customers.create).mockReset();
  });

  it('returns existing Stripe customer ID from database', async () => {
    const existingCustomer = {
      user_id: 'user-1',
      stripe_customer_id: 'cus_existing123',
    };

    const chain = createChainableMock({ data: existingCustomer, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await getOrCreateStripeCustomer('user-1', 'user@example.com');
    expect(result).toBe('cus_existing123');
  });

  it('creates new Stripe customer when none exists in database', async () => {
    // First call: lookup returns null
    const lookupChain = createChainableMock({ data: null, error: null });

    // Second call: insert succeeds
    const insertChain = createChainableMock({
      data: { user_id: 'user-1', stripe_customer_id: 'cus_new456' },
      error: null,
    });

    let callCount = 0;
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? lookupChain : insertChain;
      }),
    } as never);

    mockStripeInstance.customers.create.mockResolvedValue({
      id: 'cus_new456',
    } as never);

    const result = await getOrCreateStripeCustomer('user-1', 'user@example.com');
    expect(result).toBe('cus_new456');
  });

  it('handles race condition by returning existing customer on unique constraint error', async () => {
    // First call: lookup returns null
    const lookupChain = createChainableMock({ data: null, error: null });

    // Second call: insert fails with unique constraint
    const insertChain = createChainableMock({
      data: null,
      error: { message: 'duplicate key value violates unique constraint', code: '23505' },
    });

    // Third call: re-lookup succeeds
    const reLookupChain = createChainableMock({
      data: { user_id: 'user-1', stripe_customer_id: 'cus_race789' },
      error: null,
    });

    let callCount = 0;
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return lookupChain;
        if (callCount === 2) return insertChain;
        return reLookupChain;
      }),
    } as never);

    mockStripeInstance.customers.create.mockResolvedValue({
      id: 'cus_new_race',
    } as never);

    const result = await getOrCreateStripeCustomer('user-1', 'user@example.com');
    expect(result).toBe('cus_race789');
  });
});

// =============================================================================
// createCheckoutSession Tests
// =============================================================================

describe('createCheckoutSession', () => {
  beforeEach(() => {
    resetStripeClient();
    vi.mocked(mockStripeInstance.checkout.sessions.create).mockReset();
  });

  it('creates a Stripe Checkout session with correct parameters', async () => {
    const existingCustomer = {
      user_id: 'user-1',
      stripe_customer_id: 'cus_checkout123',
    };
    const chain = createChainableMock({ data: existingCustomer, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    mockStripeInstance.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test_session',
      url: 'https://checkout.stripe.com/pay/cs_test_session',
    } as never);

    const result = await createCheckoutSession({
      userId: 'user-1',
      email: 'user@example.com',
      priceId: 'price_1_credit',
      credits: 3,
      successUrl: 'https://app.example.com/success',
      cancelUrl: 'https://app.example.com/cancel',
    });

    expect(result.id).toBe('cs_test_session');
    expect(result.url).toBe('https://checkout.stripe.com/pay/cs_test_session');
    expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        customer: 'cus_checkout123',
        success_url: 'https://app.example.com/success',
        cancel_url: 'https://app.example.com/cancel',
      })
    );
  });
});

// =============================================================================
// createPortalSession Tests
// =============================================================================

describe('createPortalSession', () => {
  beforeEach(() => {
    resetStripeClient();
    vi.mocked(mockStripeInstance.billingPortal.sessions.create).mockReset();
  });

  it('creates a billing portal session', async () => {
    const existingCustomer = {
      user_id: 'user-1',
      stripe_customer_id: 'cus_portal123',
    };
    const chain = createChainableMock({ data: existingCustomer, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    mockStripeInstance.billingPortal.sessions.create.mockResolvedValue({
      id: 'bps_test',
      url: 'https://billing.stripe.com/session/bps_test',
    } as never);

    const result = await createPortalSession(
      'user-1',
      'user@example.com',
      'https://app.example.com/account'
    );

    expect(result.url).toBe('https://billing.stripe.com/session/bps_test');
    expect(mockStripeInstance.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_portal123',
        return_url: 'https://app.example.com/account',
      })
    );
  });
});

// =============================================================================
// constructWebhookEvent Tests
// =============================================================================

describe('constructWebhookEvent', () => {
  beforeEach(() => {
    resetStripeClient();
    vi.mocked(mockStripeInstance.webhooks.constructEvent).mockReset();
  });

  it('delegates to Stripe webhooks.constructEvent', () => {
    const mockEvent = { id: 'evt_test', type: 'checkout.session.completed' };
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as never);

    const result = constructWebhookEvent('raw_body', 'sig_header');

    expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith(
      'raw_body',
      'sig_header',
      'whsec_test_fake_secret'
    );
    expect(result).toEqual(mockEvent);
  });

  it('throws when signature verification fails', () => {
    mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Webhook signature verification failed');
    });

    expect(() => constructWebhookEvent('bad_body', 'bad_sig')).toThrow(
      'Webhook signature verification failed'
    );
  });
});
