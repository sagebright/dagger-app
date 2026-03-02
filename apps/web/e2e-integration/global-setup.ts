/**
 * Tier 2 E2E global setup
 *
 * Validates that the real API server is reachable before running any
 * integration specs. Throws to skip the entire suite when the backend
 * is unavailable, providing a clear diagnostic message.
 *
 * Also ensures the test user has enough credits to run the full suite
 * (each session creation deducts one credit).
 *
 * Runs once before all specs via playwright.integration.config.ts globalSetup.
 */

import { createClient } from '@supabase/supabase-js';

const API_PORT = process.env.API_PORT ?? '3001';
const API_HEALTH_URL = `http://localhost:${API_PORT}/api/health`;
const HEALTH_CHECK_TIMEOUT_MS = 5_000;

/** Minimum credits the test user should have before the suite starts */
const MIN_CREDITS = 50;

/**
 * Fetch the API health endpoint with a timeout.
 *
 * Returns true when the server responds with status "ok",
 * false for any network or response error.
 */
async function checkApiHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    HEALTH_CHECK_TIMEOUT_MS
  );

  try {
    const response = await fetch(API_HEALTH_URL, {
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `[global-setup] API health check returned HTTP ${response.status}`
      );
      return false;
    }

    const body = await response.json();
    return body.status === 'ok';
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error(
      `[global-setup] API health check failed: ${message}`
    );
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ensure the test user has enough credits to run the full suite.
 *
 * Signs in via Supabase, checks the credit balance, and tops up if low.
 * Uses the Supabase `add_credits` RPC (SECURITY DEFINER) which runs
 * with elevated privileges regardless of the calling role.
 *
 * Best-effort: logs warnings and continues if credit top-up fails,
 * since the test user may already have sufficient credits.
 */
async function ensureTestCredits(): Promise<void> {
  const url = process.env.E2E_SUPABASE_URL;
  const anonKey = process.env.E2E_SUPABASE_ANON_KEY;
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;

  if (!url || !anonKey || !email || !password) {
    console.warn('[global-setup] Skipping credit check: missing E2E env vars');
    return;
  }

  const supabase = createClient(url, anonKey);

  // Sign in as the test user so RPC calls run in their auth context
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    console.warn(`[global-setup] Cannot check credits: auth failed (${authError?.message})`);
    return;
  }

  const userId = authData.user.id;

  // Check current balance
  const { data: balanceRow } = await supabase
    .from('credit_balances')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  const currentBalance = (balanceRow as { balance?: number } | null)?.balance ?? 0;
  console.log(`[global-setup] Test user credit balance: ${currentBalance}`);

  if (currentBalance >= MIN_CREDITS) {
    await supabase.auth.signOut();
    return;
  }

  // Top up credits via the add_credits RPC
  const topUp = MIN_CREDITS - currentBalance;
  const sessionId = `e2e_topup_${Date.now()}`;

  const { error: rpcError } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: topUp,
    p_stripe_session_id: sessionId,
    p_description: 'E2E test credit top-up',
    p_idempotency_key: null,
  });

  if (rpcError) {
    console.warn(`[global-setup] Credit top-up failed (non-fatal): ${rpcError.message}`);
  } else {
    console.log(`[global-setup] Added ${topUp} credits to test user (new balance: ${MIN_CREDITS})`);
  }

  await supabase.auth.signOut();
}

/**
 * Clean up any leftover active sessions from previous test runs.
 *
 * Uses the API server's /api/sessions endpoint to list and delete
 * active sessions. This prevents 409 conflicts in the first test.
 */
async function cleanupLeftoverSessions(): Promise<void> {
  const url = process.env.E2E_SUPABASE_URL;
  const anonKey = process.env.E2E_SUPABASE_ANON_KEY;
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;

  if (!url || !anonKey || !email || !password) {
    return;
  }

  const supabase = createClient(url, anonKey);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.session) {
    console.warn(`[global-setup] Cannot clean up sessions: auth failed`);
    return;
  }

  const token = authData.session.access_token;
  const apiBase = `http://localhost:${API_PORT}`;

  try {
    const listRes = await fetch(`${apiBase}/api/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listRes.ok) return;

    const body = (await listRes.json()) as {
      sessions: Array<{ id: string; is_active: boolean }>;
    };

    let cleaned = 0;
    for (const session of body.sessions) {
      if (session.is_active) {
        const deleteRes = await fetch(`${apiBase}/api/session/${session.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (deleteRes.ok || deleteRes.status === 404) {
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      console.log(`[global-setup] Cleaned up ${cleaned} leftover active session(s)`);
    }
  } catch {
    /* Best-effort */
  }

  await supabase.auth.signOut();
}

/**
 * Playwright globalSetup entry point.
 *
 * Throws an error to abort the test run when the API is unreachable.
 */
export default async function globalSetup(): Promise<void> {
  console.log(`[global-setup] Checking API health at ${API_HEALTH_URL} ...`);

  const isHealthy = await checkApiHealth();

  if (!isHealthy) {
    throw new Error(
      `[global-setup] API server is not reachable at ${API_HEALTH_URL}. ` +
        'Start the API with `pnpm --filter api dev` or set API_PORT if using a non-default port.'
    );
  }

  console.log('[global-setup] API server is healthy. Proceeding with integration tests.');

  // Ensure test user has credits and no leftover sessions
  await ensureTestCredits();
  await cleanupLeftoverSessions();
}
