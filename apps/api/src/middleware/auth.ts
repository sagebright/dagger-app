/**
 * Authentication middleware for Sage Codex API
 *
 * Validates Supabase JWT tokens from the Authorization header and
 * checks the access gate (is_active flag) on user profiles.
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Validate token via Supabase auth.getUser()
 * 3. Check user profile is_active flag (access gate)
 * 4. Attach user to request object for downstream handlers
 */

import type { Request, Response, NextFunction } from 'express';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '../services/supabase.js';

/** Extend Express Request to include authenticated user */
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Extract Bearer token from the Authorization header.
 *
 * Returns the token string or an error message describing what went wrong.
 */
function extractBearerToken(
  authHeader: string | undefined
): { token: string } | { error: string; status: number } {
  if (!authHeader) {
    return { error: 'Authorization header is required', status: 401 };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization header must use Bearer scheme', status: 401 };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { error: 'Authorization token is required', status: 401 };
  }

  return { token };
}

/**
 * Check if a user's profile has is_active=true in the profiles table.
 *
 * If no profile row exists, the user is treated as active (new users
 * who haven't had a profile row created yet should not be blocked).
 */
async function checkAccessGate(userId: string): Promise<boolean> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', userId)
    .single();

  // No profile row found: treat as active (new user)
  if (error || !data) {
    return true;
  }

  return data.is_active !== false;
}

/**
 * Express middleware that requires a valid Supabase JWT.
 *
 * On success, attaches the authenticated user to `req.user`.
 * On failure, responds with 401 (unauthenticated) or 403 (inactive).
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const tokenResult = extractBearerToken(req.headers.authorization);

  if ('error' in tokenResult) {
    res.status(tokenResult.status).json({ error: tokenResult.error });
    return;
  }

  const supabase = getSupabase();

  const { data, error } = await supabase.auth.getUser(tokenResult.token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const isActive = await checkAccessGate(data.user.id);
  if (!isActive) {
    res.status(403).json({
      error: 'Account is inactive. Contact an administrator for access.',
    });
    return;
  }

  req.user = data.user;
  next();
}
