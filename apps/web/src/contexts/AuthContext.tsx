/**
 * Authentication context provider for Sage Codex
 *
 * Manages user authentication state using Supabase Auth via the backend API.
 * Provides login, signup, logout, and session restoration functionality.
 *
 * The frontend communicates with the backend auth routes (/api/auth/*) rather
 * than directly with Supabase, keeping the service role key server-side only.
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

import {
  AuthContext,
  type AuthState,
  type AuthSession,
  type AuthContextValue,
} from './auth-context-value';

const TOKEN_STORAGE_KEY = 'sage_codex_token';
const REFRESH_STORAGE_KEY = 'sage_codex_refresh';

// =============================================================================
// API Helpers
// =============================================================================

interface ApiAuthResponse {
  user?: { id: string; email: string };
  session?: AuthSession;
  error?: string;
  message?: string;
}

async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<ApiAuthResponse> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const body = (await response.json()) as ApiAuthResponse;

  if (!response.ok) {
    throw new Error(body.error ?? `Request failed with status ${response.status}`);
  }

  return body;
}

// =============================================================================
// Provider
// =============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  /** Persist tokens to localStorage */
  const saveTokens = useCallback((session: AuthSession) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, session.access_token);
    localStorage.setItem(REFRESH_STORAGE_KEY, session.refresh_token);
  }, []);

  /** Clear tokens from localStorage */
  const clearTokens = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_STORAGE_KEY);
  }, []);

  /** Restore session from stored token on mount */
  useEffect(() => {
    let aborted = false;

    const restoreSession = async () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const data = await authFetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (aborted) return;

        if (data.user) {
          setState({
            user: data.user,
            session: {
              access_token: token,
              refresh_token: localStorage.getItem(REFRESH_STORAGE_KEY) ?? '',
            },
            isLoading: false,
            error: null,
          });
        } else {
          clearTokens();
          setState({ user: null, session: null, isLoading: false, error: null });
        }
      } catch {
        if (aborted) return;

        // Access token expired — try refresh before clearing
        const refreshToken = localStorage.getItem(REFRESH_STORAGE_KEY);
        if (refreshToken) {
          try {
            const refreshData = await authFetch('/api/auth/refresh', {
              method: 'POST',
              body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (aborted) return;

            if (refreshData.user && refreshData.session) {
              saveTokens(refreshData.session);
              setState({
                user: refreshData.user,
                session: refreshData.session,
                isLoading: false,
                error: null,
              });
              return;
            }
          } catch {
            if (aborted) return;
          }
        }

        clearTokens();
        setState({ user: null, session: null, isLoading: false, error: null });
      }
    };

    restoreSession();
    return () => { aborted = true; };
  }, [clearTokens, saveTokens]);

  /** Sign up with email and password */
  const signup = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await authFetch('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (data.user && data.session) {
          saveTokens(data.session);
          setState({
            user: data.user,
            session: data.session,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Signup failed';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    },
    [saveTokens]
  );

  /** Log in with email and password */
  const login = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await authFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (data.user && data.session) {
          saveTokens(data.session);
          setState({
            user: data.user,
            session: data.session,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    },
    [saveTokens]
  );

  /** Log out and clear session */
  const logout = useCallback(async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Logout best-effort: clear local state regardless
    }

    clearTokens();
    setState({ user: null, session: null, isLoading: false, error: null });
  }, [clearTokens]);

  /** Clear the current error */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      signup,
      logout,
      clearError,
    }),
    [state, login, signup, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
