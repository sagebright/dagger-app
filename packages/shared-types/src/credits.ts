/**
 * Credit System Types
 *
 * Type definitions for the credit-based payment system including:
 * - Credit balances and transaction records
 * - Credit packages for purchase
 * - PostgreSQL function return types (deduct_credit, add_credits)
 * - API response types for credit endpoints
 */

// =============================================================================
// Database Row Types
// =============================================================================

/**
 * A user's credit balance row from the credit_balances table
 */
export interface CreditBalance {
  /** Row identifier */
  id: string;
  /** The user who owns this balance */
  userId: string;
  /** Current available credit count (always >= 0 in the database) */
  balance: number;
  /** Total credits ever purchased/granted */
  lifetimeCredits: number;
  /** When the balance row was created */
  createdAt: string;
  /** When the balance was last modified */
  updatedAt: string;
}

/**
 * Valid transaction type values matching the credit_transaction_type enum
 */
export type CreditTransactionType =
  | 'purchase'
  | 'deduction'
  | 'grant'
  | 'refund'
  | 'expiration';

/** All valid transaction types as a runtime array for validation */
export const CREDIT_TRANSACTION_TYPES: readonly CreditTransactionType[] = [
  'purchase',
  'deduction',
  'grant',
  'refund',
  'expiration',
] as const;

/**
 * A single credit transaction row from the credit_transactions table.
 *
 * Signed amount convention:
 *   positive = credits added (purchase, grant, refund)
 *   negative = credits removed (deduction, expiration)
 */
export interface CreditTransaction {
  /** Row identifier */
  id: string;
  /** The user this transaction belongs to */
  userId: string;
  /** Signed credit amount (positive = add, negative = deduct) */
  amount: number;
  /** Balance snapshot after this transaction */
  balanceAfter: number;
  /** What triggered this transaction */
  transactionType: CreditTransactionType;
  /** Human-readable description */
  description: string | null;
  /** Prevents duplicate processing (deterministic key) */
  idempotencyKey: string | null;
  /** Stripe Checkout session that funded this transaction */
  stripeSessionId: string | null;
  /** Sage session that consumed this credit (deductions only) */
  sessionId: string | null;
  /** When the transaction occurred */
  createdAt: string;
}

// =============================================================================
// Credit Packages (Stripe Product Catalog)
// =============================================================================

/**
 * A purchasable credit package shown on the pricing page
 */
export interface CreditPackage {
  /** Unique package identifier (e.g., 'starter', 'adventurer') */
  id: string;
  /** Display name */
  name: string;
  /** Number of credits in the package */
  credits: number;
  /** Price in cents (USD) for Stripe */
  priceInCents: number;
  /** User-facing description */
  description: string;
}

/** Predefined credit packages available for purchase */
export const CREDIT_PACKAGES: readonly CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 3,
    priceInCents: 499,
    description: '3 adventure credits',
  },
  {
    id: 'adventurer',
    name: 'Adventurer Pack',
    credits: 10,
    priceInCents: 1499,
    description: '10 adventure credits',
  },
  {
    id: 'guild',
    name: 'Guild Pack',
    credits: 25,
    priceInCents: 2999,
    description: '25 adventure credits',
  },
] as const;

// =============================================================================
// PostgreSQL Function Return Types
// =============================================================================

/**
 * Return shape from the deduct_credit() PostgreSQL function.
 *
 * On success: { success: true, newBalance, transactionId }
 * On failure: { success: false, newBalance: 0, error: 'insufficient_credits' }
 */
export type DeductCreditResult =
  | {
      success: true;
      newBalance: number;
      transactionId: string;
    }
  | {
      success: false;
      newBalance: number;
      error: string;
    };

/**
 * Return shape from the add_credits() PostgreSQL function.
 *
 * On success: { success: true, newBalance, transactionId }
 * On failure: { success: false, error: 'amount_must_be_positive' }
 */
export type AddCreditsResult =
  | {
      success: true;
      newBalance: number;
      transactionId: string;
    }
  | {
      success: false;
      error: string;
    };

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Response from GET /api/credits/balance
 */
export interface CreditBalanceResponse {
  /** Current available credits */
  balance: number;
  /** Total credits ever received */
  lifetimeCredits: number;
}

/**
 * Response from GET /api/credits/transactions
 */
export interface CreditTransactionListResponse {
  /** Transaction records (most recent first) */
  transactions: CreditTransaction[];
  /** Total number of transactions for pagination */
  total: number;
}
