#!/usr/bin/env npx tsx
/**
 * Setup E2E Test User
 *
 * Creates a dedicated test user in Supabase Auth for Tier 2 integration tests.
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from apps/api/.env,
 * then uses auth.admin.createUser() to provision the account.
 *
 * Usage:
 *   npx tsx apps/web/scripts/setup-e2e-user.ts
 *
 * Output:
 *   Prints the credentials to copy into apps/web/.env.e2e
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

// =============================================================================
// Constants
// =============================================================================

const TEST_USER_EMAIL = 'e2e-test@sage-codex.local';
const PASSWORD_LENGTH = 24;
const INITIAL_CREDITS = 100;
const API_ENV_PATH = resolve(import.meta.dirname ?? '.', '../../api/.env');

// =============================================================================
// Env Parsing
// =============================================================================

function loadApiEnv(): Record<string, string> {
  let raw: string;
  try {
    raw = readFileSync(API_ENV_PATH, 'utf-8');
  } catch {
    console.error(`\nError: Could not read ${API_ENV_PATH}`);
    console.error('Make sure apps/api/.env exists with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n');
    process.exit(1);
  }

  const env: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    env[key] = value;
  }
  return env;
}

// =============================================================================
// Credit Provisioning
// =============================================================================

async function getUserId(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  const { data } = await supabase.auth.admin.listUsers();
  const user = data?.users.find((u) => u.email === email);
  return user?.id ?? null;
}

async function grantCredits(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  /* Check existing balance */
  const { data: existing } = await supabase
    .from('credit_balances')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  const currentBalance = (existing as { balance: number } | null)?.balance ?? 0;

  if (currentBalance >= INITIAL_CREDITS) {
    console.log(`Credits: ${currentBalance} (already sufficient)\n`);
    return;
  }

  const toAdd = INITIAL_CREDITS - currentBalance;

  const { data: rpcResult, error: rpcError } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: toAdd,
    p_stripe_session_id: `e2e-setup-${Date.now()}`,
    p_description: 'E2E test user initial credits',
    p_idempotency_key: null,
  });

  if (rpcError) {
    console.error(`Warning: Failed to grant credits: ${rpcError.message}`);
    console.error('You may need to grant credits manually.\n');
    return;
  }

  const result = rpcResult as { new_balance?: number };
  console.log(`Credits: ${result.new_balance ?? toAdd} (granted ${toAdd})\n`);
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const apiEnv = loadApiEnv();

  const supabaseUrl = apiEnv.SUPABASE_URL;
  const serviceRoleKey = apiEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('\nError: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in apps/api/.env\n');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const password = randomBytes(PASSWORD_LENGTH).toString('base64url').slice(0, PASSWORD_LENGTH);

  console.log(`\nCreating E2E test user: ${TEST_USER_EMAIL}`);
  console.log(`Supabase project: ${supabaseUrl}\n`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes('already been registered') || error.status === 422) {
      console.log('User already exists. Updating password...\n');

      /* Find existing user to get their ID */
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users.find((u) => u.email === TEST_USER_EMAIL);

      if (existing) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
          password,
        });

        if (updateError) {
          console.error(`Failed to update password: ${updateError.message}`);
          process.exit(1);
        }

        console.log('Password updated successfully.\n');
      } else {
        console.error('Could not find existing user to update. Create manually in Supabase dashboard.\n');
        process.exit(1);
      }
    } else {
      console.error(`Failed to create user: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log(`User created: ${data.user.id}\n`);
  }

  /* Grant initial credits so E2E tests can create sessions */
  const userId = data?.user?.id ?? await getUserId(supabase, TEST_USER_EMAIL);
  if (userId) {
    await grantCredits(supabase, userId);
  }

  console.log('--- Add these to apps/web/.env.e2e ---\n');
  console.log(`E2E_SUPABASE_URL=${supabaseUrl}`);
  console.log('E2E_SUPABASE_ANON_KEY=<your-supabase-anon-public-key>');
  console.log(`E2E_TEST_USER_EMAIL=${TEST_USER_EMAIL}`);
  console.log(`E2E_TEST_USER_PASSWORD=${password}`);
  console.log('');
}

main();
