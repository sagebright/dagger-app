/**
 * Credit state store for the Sage Codex frontend
 *
 * Manages credit balance, purchasable packages, and transaction history.
 * Communicates with the backend credit API endpoints:
 *   GET  /api/credits/balance
 *   GET  /api/credits/packages
 *   POST /api/credits/checkout
 *   GET  /api/credits/transactions
 *   POST /api/credits/portal
 */

import { create } from 'zustand';
import type {
  CreditBalanceResponse,
  CreditTransaction,
  CreditPackage,
} from '@sage-codex/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface CreditStoreState {
  /** Current credit balance */
  balance: number;
  /** Lifetime credits purchased/granted */
  lifetimeCredits: number;
  /** Transaction history (most recent first) */
  transactions: CreditTransaction[];
  /** Available credit packages for purchase */
  packages: CreditPackage[];
  /** Whether any credit data is currently loading */
  isLoading: boolean;
  /** Current error message, if any */
  error: string | null;

  // ----- Actions -----

  /** Fetch the user's current credit balance */
  fetchBalance: (token: string) => Promise<void>;
  /** Fetch available credit packages */
  fetchPackages: (token: string) => Promise<void>;
  /** Fetch transaction history */
  fetchTransactions: (token: string) => Promise<void>;
  /** Create a Stripe Checkout session and return the redirect URL */
  createCheckout: (token: string, packageId: string) => Promise<string | null>;
  /** Create a Stripe Customer Portal session and return the redirect URL */
  createPortal: (token: string) => Promise<string | null>;
  /** Clear the current error message */
  clearError: () => void;
  /** Reset the store to initial state */
  reset: () => void;
}

// =============================================================================
// API Helpers
// =============================================================================

async function creditFetch<T>(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    const body = await response.json();

    if (!response.ok) {
      return { data: null, error: body.error ?? `Request failed (${response.status})` };
    }

    return { data: body as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: message };
  }
}

// =============================================================================
// Initial State
// =============================================================================

const INITIAL_STATE: Pick<
  CreditStoreState,
  'balance' | 'lifetimeCredits' | 'transactions' | 'packages' | 'isLoading' | 'error'
> = {
  balance: 0,
  lifetimeCredits: 0,
  transactions: [],
  packages: [],
  isLoading: false,
  error: null,
};

// =============================================================================
// Store
// =============================================================================

export const useCreditStore = create<CreditStoreState>((set) => ({
  ...INITIAL_STATE,

  fetchBalance: async (token) => {
    set({ isLoading: true, error: null });

    const result = await creditFetch<CreditBalanceResponse>(
      '/api/credits/balance',
      token
    );

    if (result.error) {
      set({ isLoading: false, error: result.error });
      return;
    }

    set({
      balance: result.data?.balance ?? 0,
      lifetimeCredits: result.data?.lifetimeCredits ?? 0,
      isLoading: false,
    });
  },

  fetchPackages: async (token) => {
    const result = await creditFetch<{ packages: CreditPackage[] }>(
      '/api/credits/packages',
      token
    );

    if (result.error) {
      set({ error: result.error });
      return;
    }

    set({ packages: result.data?.packages ?? [] });
  },

  fetchTransactions: async (token) => {
    const result = await creditFetch<{ transactions: CreditTransaction[] }>(
      '/api/credits/transactions',
      token
    );

    if (result.error) {
      set({ error: result.error });
      return;
    }

    set({ transactions: result.data?.transactions ?? [] });
  },

  createCheckout: async (token, packageId) => {
    set({ error: null });

    const result = await creditFetch<{ url: string }>(
      '/api/credits/checkout',
      token,
      {
        method: 'POST',
        body: JSON.stringify({ packageId }),
      }
    );

    if (result.error) {
      set({ error: result.error });
      return null;
    }

    return result.data?.url ?? null;
  },

  createPortal: async (token) => {
    set({ error: null });

    const result = await creditFetch<{ url: string }>(
      '/api/credits/portal',
      token,
      { method: 'POST' }
    );

    if (result.error) {
      set({ error: result.error });
      return null;
    }

    return result.data?.url ?? null;
  },

  clearError: () => set({ error: null }),

  reset: () => set({ ...INITIAL_STATE }),
}));
