-- Migration: Fix credit RLS policies and function security
--
-- Problem: RLS is enabled on credit tables but no policies were defined.
-- This blocks all INSERT/UPDATE operations even when using service_role key.
--
-- Fix:
--   1. Add RLS policies granting service_role full access
--   2. Recreate credit functions with SECURITY DEFINER so they run as
--      the postgres owner (superuser), guaranteeing RLS bypass regardless
--      of the calling role
--   3. Set search_path = public on SECURITY DEFINER functions to prevent
--      search_path injection attacks

BEGIN;

-- =============================================================================
-- RLS Policies: Grant service_role full access to all credit tables
-- Idempotent: DROP IF EXISTS before CREATE
-- =============================================================================
DROP POLICY IF EXISTS "service_role_all" ON credit_balances;
CREATE POLICY "service_role_all" ON credit_balances
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all" ON credit_transactions;
CREATE POLICY "service_role_all" ON credit_transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all" ON stripe_customers;
CREATE POLICY "service_role_all" ON stripe_customers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- Recreate deduct_credit with SECURITY DEFINER
-- =============================================================================
CREATE OR REPLACE FUNCTION deduct_credit(
  p_user_id    UUID,
  p_session_id UUID,
  p_description TEXT DEFAULT 'Adventure session credit'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_idempotency_key TEXT;
  v_existing        RECORD;
  v_new_balance     INTEGER;
  v_transaction_id  UUID;
BEGIN
  -- Build deterministic idempotency key from user + session
  v_idempotency_key := 'deduct:' || p_user_id || ':' || p_session_id;

  -- Check for existing transaction with this idempotency key
  SELECT id, balance_after
    INTO v_existing
    FROM credit_transactions
   WHERE idempotency_key = v_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success',        TRUE,
      'new_balance',    v_existing.balance_after,
      'transaction_id', v_existing.id,
      'idempotent',     TRUE
    );
  END IF;

  -- Atomically decrement balance only if sufficient funds exist
  UPDATE credit_balances
     SET balance    = balance - 1,
         updated_at = now()
   WHERE user_id = p_user_id
     AND balance > 0
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success',     FALSE,
      'new_balance', 0,
      'error',       'insufficient_credits'
    );
  END IF;

  -- Record the transaction
  INSERT INTO credit_transactions (
    user_id, amount, balance_after, transaction_type,
    description, idempotency_key, session_id
  )
  VALUES (
    p_user_id, -1, v_new_balance, 'deduction',
    p_description, v_idempotency_key, p_session_id
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success',        TRUE,
    'new_balance',    v_new_balance,
    'transaction_id', v_transaction_id,
    'idempotent',     FALSE
  );
END;
$$;

-- =============================================================================
-- Recreate add_credits with SECURITY DEFINER
-- =============================================================================
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id           UUID,
  p_amount            INTEGER,
  p_stripe_session_id TEXT,
  p_description       TEXT DEFAULT 'Credit purchase',
  p_idempotency_key   TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key             TEXT;
  v_existing        RECORD;
  v_new_balance     INTEGER;
  v_transaction_id  UUID;
BEGIN
  -- Use provided key or derive from Stripe session ID
  v_key := COALESCE(p_idempotency_key, 'add:' || p_stripe_session_id);

  -- Check for existing transaction with this idempotency key
  SELECT id, balance_after
    INTO v_existing
    FROM credit_transactions
   WHERE idempotency_key = v_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success',        TRUE,
      'new_balance',    v_existing.balance_after,
      'transaction_id', v_existing.id,
      'idempotent',     TRUE
    );
  END IF;

  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error',   'amount_must_be_positive'
    );
  END IF;

  -- Upsert credit balance: create if missing, increment if exists
  INSERT INTO credit_balances (user_id, balance, lifetime_credits)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance          = credit_balances.balance + p_amount,
    lifetime_credits = credit_balances.lifetime_credits + p_amount,
    updated_at       = now()
  RETURNING balance INTO v_new_balance;

  -- Record the transaction
  INSERT INTO credit_transactions (
    user_id, amount, balance_after, transaction_type,
    description, idempotency_key, stripe_session_id
  )
  VALUES (
    p_user_id, p_amount, v_new_balance, 'purchase',
    p_description, v_key, p_stripe_session_id
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success',        TRUE,
    'new_balance',    v_new_balance,
    'transaction_id', v_transaction_id,
    'idempotent',     FALSE
  );
END;
$$;

COMMIT;
