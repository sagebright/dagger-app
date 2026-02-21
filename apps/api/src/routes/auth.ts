/**
 * Authentication routes for Sage Codex API
 *
 * Provides signup, login, logout, and session verification endpoints.
 * Uses Supabase Auth for user management.
 *
 * Routes:
 *   POST /api/auth/signup  - Create a new user account
 *   POST /api/auth/login   - Sign in with email/password
 *   POST /api/auth/logout  - Sign out (invalidate session)
 *   GET  /api/auth/session - Verify current session token
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { createSupabaseAuthClient, getSupabase } from '../services/supabase.js';

const router: RouterType = Router();

const MIN_PASSWORD_LENGTH = 6;

/**
 * Validate that email and password are present and meet minimum requirements.
 *
 * Returns an error message string if validation fails, or null if valid.
 */
function validateCredentials(
  email: unknown,
  password: unknown
): string | null {
  if (!email || !password) {
    return 'Email and password are required';
  }

  if (typeof password === 'string' && password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  return null;
}

/**
 * POST /api/auth/signup
 *
 * Creates a new user account via Supabase Auth.
 * Returns the user object and session tokens on success.
 */
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const validationError = validateCredentials(email, password);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const authClient = createSupabaseAuthClient();

  const { data, error } = await authClient.auth.signUp({
    email: email as string,
    password: password as string,
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({
    user: data.user,
    session: data.session,
  });
});

/**
 * POST /api/auth/login
 *
 * Signs in an existing user with email and password.
 * Returns the user object and session tokens on success.
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const validationError = validateCredentials(email, password);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const authClient = createSupabaseAuthClient();

  const { data, error } = await authClient.auth.signInWithPassword({
    email: email as string,
    password: password as string,
  });

  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  res.json({
    user: data.user,
    session: data.session,
  });
});

/**
 * POST /api/auth/logout
 *
 * Signs out the current user, invalidating their session.
 */
router.post('/logout', async (_req: Request, res: Response) => {
  const authClient = createSupabaseAuthClient();

  const { error } = await authClient.auth.signOut();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ message: 'Logged out successfully' });
});

/**
 * POST /api/auth/refresh
 *
 * Exchanges a refresh token for a new access/refresh token pair.
 * Returns the user object and new session tokens on success.
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    res.status(400).json({ error: 'Refresh token is required' });
    return;
  }

  const authClient = createSupabaseAuthClient();

  const { data, error } = await authClient.auth.refreshSession({ refresh_token });

  if (error || !data.session) {
    res.status(401).json({ error: error?.message ?? 'Failed to refresh session' });
    return;
  }

  res.json({
    user: data.user,
    session: data.session,
  });
});

/**
 * GET /api/auth/session
 *
 * Verifies the current session by validating the Bearer token.
 * Returns the authenticated user if the token is valid.
 */
router.get('/session', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header is required' });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    res.status(401).json({ error: 'Authorization token is required' });
    return;
  }

  const supabase = getSupabase();

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  res.json({ user: data.user });
});

export default router;
