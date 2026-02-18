-- Migration: Create credit system tables
-- Foundation for credit-based payment system: balances, transactions, and Stripe customer mapping.
-- All access via service_role through the API — no anon policies.

BEGIN;

-- =============================================================================
-- credit_balances: One row per user tracking current and lifetime credit totals
-- =============================================================================
CREATE TABLE credit_balances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE,
  balance           INTEGER NOT NULL DEFAULT 0
                      CHECK (balance >= 0),
  lifetime_credits  INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup by user
CREATE INDEX idx_credit_balances_user_id ON credit_balances (user_id);

-- =============================================================================
-- credit_transactions: Audit log of every credit change (purchase or deduction)
-- Signed amount: positive = purchase/grant, negative = deduction
-- =============================================================================
CREATE TYPE credit_transaction_type AS ENUM (
  'purchase',
  'deduction',
  'grant',
  'refund',
  'expiration'
);

CREATE TABLE credit_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  amount            INTEGER NOT NULL,
  balance_after     INTEGER NOT NULL,
  transaction_type  credit_transaction_type NOT NULL,
  description       TEXT,
  idempotency_key   TEXT UNIQUE,
  stripe_session_id TEXT,
  session_id        UUID REFERENCES sage_sessions (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User transaction history lookups
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions (user_id);

-- Stripe webhook deduplication
CREATE INDEX idx_credit_transactions_stripe_session_id
  ON credit_transactions (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- Idempotency key lookups for deduction deduplication
CREATE INDEX idx_credit_transactions_idempotency_key
  ON credit_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- =============================================================================
-- stripe_customers: Maps internal user IDs to Stripe customer IDs
-- =============================================================================
CREATE TABLE stripe_customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE,
  stripe_customer_id  TEXT NOT NULL UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup by Stripe customer ID (webhook processing)
CREATE INDEX idx_stripe_customers_stripe_customer_id
  ON stripe_customers (stripe_customer_id);

COMMIT;
