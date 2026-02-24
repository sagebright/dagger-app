/**
 * Startup environment variable validation for Sage Codex API
 *
 * Validates required environment variables at boot time with format checks.
 * Logs clear warnings for missing or suspicious values to prevent silent
 * runtime failures (e.g., wrong Supabase key type causing RLS errors).
 *
 * Does NOT prevent server startup — warnings only.
 */

interface EnvCheck {
  name: string;
  required: boolean;
  prefix?: string;
  hint?: string;
}

const ENV_CHECKS: EnvCheck[] = [
  {
    name: 'SUPABASE_URL',
    required: true,
    prefix: 'https://',
    hint: 'Should be your Supabase project URL (e.g., https://xxx.supabase.co)',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    prefix: 'eyJ',
    hint: 'Must be the JWT service role key from Supabase Dashboard > Settings > API (not the Management API secret)',
  },
  {
    name: 'ANTHROPIC_API_KEY',
    required: true,
    prefix: 'sk-ant-',
    hint: 'Anthropic API key from console.anthropic.com (starts with sk-ant-)',
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    prefix: 'sk_',
    hint: 'Should start with sk_test_ or sk_live_ from Stripe Dashboard > Developers > API Keys',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    prefix: 'whsec_',
    hint: 'Should start with whsec_ from Stripe Dashboard or stripe listen CLI',
  },
  {
    name: 'STRIPE_PRICE_1_CREDIT',
    required: true,
    prefix: 'price_',
    hint: 'Stripe Price ID from Dashboard > Products (starts with price_)',
  },
  {
    name: 'STRIPE_PRICE_5_CREDITS',
    required: true,
    prefix: 'price_',
    hint: 'Stripe Price ID from Dashboard > Products (starts with price_)',
  },
  {
    name: 'STRIPE_PRICE_15_CREDITS',
    required: true,
    prefix: 'price_',
    hint: 'Stripe Price ID from Dashboard > Products (starts with price_)',
  },
];

/**
 * Validate environment variables and log warnings for any issues.
 * Call once at startup after dotenv loads.
 */
export function validateEnv(): void {
  let warningCount = 0;

  for (const check of ENV_CHECKS) {
    const value = process.env[check.name];

    if (!value) {
      if (check.required) {
        console.warn(`[env] Missing required variable: ${check.name}`);
        if (check.hint) {
          console.warn(`  -> ${check.hint}`);
        }
        warningCount++;
      }
      continue;
    }

    if (check.prefix && !value.startsWith(check.prefix)) {
      const preview = value.substring(0, 10) + '...';
      console.warn(
        `[env] ${check.name} has unexpected format: starts with "${preview}" (expected "${check.prefix}")`
      );
      if (check.hint) {
        console.warn(`  -> ${check.hint}`);
      }
      warningCount++;
    }
  }

  if (warningCount > 0) {
    console.warn(
      `[env] ${warningCount} environment variable warning(s) found — check apps/api/.env`
    );
  }

  // Log webhook secret prefix so devs can compare against `stripe listen` output
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (whsec) {
    console.log(`[env] Webhook secret: ${whsec.substring(0, 12)}...`);
  }
}
