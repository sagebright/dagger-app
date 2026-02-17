/**
 * Authentication page for Sage Codex
 *
 * Provides login and signup forms in the dark design system.
 * Toggling between login and signup is handled via local state.
 * Redirects to the main app on successful authentication.
 */

import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'login' | 'signup';

/**
 * Full-screen authentication page with centered card layout.
 *
 * Uses CSS custom properties from globals.css for consistent dark theming.
 */
export function AuthPage() {
  const { user, isLoading, error, login, signup, clearError } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect authenticated users away from auth page
  if (user && !isLoading) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (mode === 'login') {
      await login(email, password);
    } else {
      await signup(email, password);
    }
  };

  const toggleMode = () => {
    clearError();
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
  };

  const isLogin = mode === 'login';
  const heading = isLogin ? 'Enter the Codex' : 'Open the Codex';
  const subtitle = isLogin
    ? 'Sign in to continue your adventure'
    : 'Create an account to begin';
  const buttonLabel = isLogin ? 'Sign In' : 'Create Account';
  const toggleLabel = isLogin
    ? "Don't have an account?"
    : 'Already have an account?';
  const toggleAction = isLogin ? 'Sign Up' : 'Sign In';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>{heading}</h1>
          <p style={styles.subtitle}>{subtitle}</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sage@example.com"
              required
              autoComplete="email"
              style={styles.input}
              className="focus-ring"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'}
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              style={styles.input}
              className="focus-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="footer-button"
            style={styles.submitButton}
          >
            {isLoading ? 'Working...' : buttonLabel}
          </button>
        </form>

        {/* Toggle */}
        <div style={styles.toggleRow}>
          <span style={styles.toggleText}>{toggleLabel}</span>
          <button
            type="button"
            onClick={toggleMode}
            style={styles.toggleButton}
          >
            {toggleAction}
          </button>
        </div>
      </div>

      {/* Branding */}
      <div style={styles.branding}>
        <span className="font-serif" style={styles.brandName}>
          Sage Codex
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Inline Styles (using design tokens via CSS custom properties)
// =============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    padding: 24,
  },

  card: {
    width: '100%',
    maxWidth: 400,
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-medium)',
    padding: 32,
  },

  header: {
    textAlign: 'center' as const,
    marginBottom: 28,
  },

  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: 24,
    fontWeight: 600,
    color: 'var(--accent-gold)',
    marginBottom: 8,
    marginTop: 0,
  },

  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    margin: 0,
  },

  errorBanner: {
    padding: '10px 14px',
    marginBottom: 20,
    background: 'rgba(219, 126, 126, 0.1)',
    border: '1px solid rgba(219, 126, 126, 0.3)',
    borderRadius: 'var(--radius-sm)',
    color: '#db7e7e',
    fontSize: 13,
    lineHeight: 1.5,
  },

  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 18,
  },

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },

  input: {
    padding: '10px 14px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },

  submitButton: {
    marginTop: 8,
  },

  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },

  toggleText: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },

  toggleButton: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-gold)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'var(--font-sans)',
  },

  branding: {
    marginTop: 32,
    textAlign: 'center' as const,
  },

  brandName: {
    fontSize: 13,
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
};
