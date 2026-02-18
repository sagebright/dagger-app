/**
 * Credit service for Sage Codex API
 *
 * Manages user credit balances and transactions via Supabase.
 * Uses atomic PostgreSQL functions (add_credits, deduct_credit)
 * for safe concurrent operations with idempotency protection.
 *
 * All operations use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
 * See MEMORY.md for the rationale on service_role usage.
 */

import { getSupabase } from './supabase.js';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TRANSACTION_LIMIT = 20;
const UNIQUE_CONSTRAINT_CODE = '23505';

// =============================================================================
// Types (database row shapes)
// =============================================================================

interface CreditBalanceRow {
  id: string;
  user_id: string;
  balance: number;
  lifetime_credits: number;
  created_at: string;
  updated_at: string;
}

interface RpcResult {
  success: boolean;
  new_balance?: number;
  transaction_id?: string;
  idempotent?: boolean;
  error?: string;
}

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// =============================================================================
// Balance Management
// =============================================================================

/**
 * Get or create a credit balance row for a user.
 *
 * Lookup flow:
 * 1. Query credit_balances by user_id
 * 2. If not found, insert a new row with zero balance
 * 3. If insert fails due to race condition (unique constraint),
 *    re-fetch the existing row
 */
export async function getOrCreateBalance(
  userId: string
): Promise<ServiceResult<CreditBalanceRow>> {
  const supabase = getSupabase();

  // Step 1: Look up existing balance
  const { data: existing, error: lookupError } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (lookupError) {
    return { data: null, error: lookupError.message };
  }

  if (existing) {
    return { data: existing as CreditBalanceRow, error: null };
  }

  // Step 2: Insert new balance row
  const { data: inserted, error: insertError } = await supabase
    .from('credit_balances')
    .insert({ user_id: userId, balance: 0, lifetime_credits: 0 })
    .select()
    .single();

  // Step 3: Handle race condition on unique constraint
  if (insertError?.code === UNIQUE_CONSTRAINT_CODE) {
    const { data: reFetched, error: reFetchError } = await supabase
      .from('credit_balances')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (reFetchError) {
      return { data: null, error: reFetchError.message };
    }
    return { data: reFetched as CreditBalanceRow, error: null };
  }

  if (insertError) {
    return { data: null, error: insertError.message };
  }

  return { data: inserted as CreditBalanceRow, error: null };
}

// =============================================================================
// Credit Operations (via PostgreSQL RPC)
// =============================================================================

/**
 * Add credits to a user's balance via the add_credits PostgreSQL function.
 *
 * Idempotent: duplicate calls with the same stripe_session_id return the
 * existing transaction without double-crediting.
 *
 * @param userId - User receiving credits
 * @param amount - Number of credits to add (must be positive)
 * @param stripeSessionId - Stripe Checkout session ID for deduplication
 * @param description - Human-readable reason for the credit addition
 * @param idempotencyKey - Optional custom idempotency key
 */
export async function addCredits(
  userId: string,
  amount: number,
  stripeSessionId: string,
  description = 'Credit purchase',
  idempotencyKey: string | null = null
): Promise<ServiceResult<RpcResult>> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_stripe_session_id: stripeSessionId,
    p_description: description,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as RpcResult, error: null };
}

/**
 * Deduct one credit from a user's balance via the deduct_credit PostgreSQL function.
 *
 * Idempotent: duplicate calls with the same (userId, sessionId) pair
 * return the existing transaction without double-deducting.
 *
 * @param userId - User spending the credit
 * @param sessionId - Sage session consuming the credit
 * @param description - Human-readable reason for the deduction
 */
export async function deductCredit(
  userId: string,
  sessionId: string,
  description = 'Adventure session credit'
): Promise<ServiceResult<RpcResult>> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc('deduct_credit', {
    p_user_id: userId,
    p_session_id: sessionId,
    p_description: description,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as RpcResult, error: null };
}

// =============================================================================
// Transaction History
// =============================================================================

/**
 * Get recent credit transactions for a user, ordered most-recent-first.
 *
 * @param userId - User whose transactions to retrieve
 * @param limit - Maximum number of transactions (default: 20)
 */
export async function getTransactionHistory(
  userId: string,
  limit = DEFAULT_TRANSACTION_LIMIT
): Promise<ServiceResult<unknown[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}

// =============================================================================
// Credit Checks
// =============================================================================

/**
 * Check whether a user has at least one available credit.
 *
 * Returns false on any error (fail-closed for credit checks).
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('credit_balances')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return (data as { balance: number }).balance > 0;
}
