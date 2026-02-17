/**
 * Session management page for Sage Codex
 *
 * Provides a session picker UI: start new adventure or resume existing.
 * Loads session state from the server on page load.
 * Redirects to the main adventure view once a session is active.
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { STAGES } from '@dagger-app/shared-types';
import type { Stage } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

interface SessionSummary {
  id: string;
  user_id: string;
  title: string;
  stage: Stage;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SessionDetail {
  session: SessionSummary;
  adventureState: {
    id: string;
    session_id: string;
    components: Record<string, unknown>;
    frame: Record<string, unknown> | null;
    outline: Record<string, unknown> | null;
    scenes: Record<string, unknown>[];
  };
}

// =============================================================================
// API Helpers
// =============================================================================

async function apiFetch<T>(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    const body = await response.json();

    if (!response.ok) {
      return { data: null, error: body.error ?? `Request failed (${response.status})` };
    }

    return { data: body as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: message };
  }
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function findStageLabel(stageId: Stage): string {
  return STAGES.find((s) => s.id === stageId)?.label ?? stageId;
}

// =============================================================================
// Component
// =============================================================================

export function SessionPage() {
  const { session: authSession, logout } = useAuth();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSession, setActiveSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const token = authSession?.access_token ?? '';

  /** Load sessions list and check for active session */
  const loadSessions = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    const result = await apiFetch<{ sessions: SessionSummary[] }>(
      '/api/sessions',
      token
    );

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    const sessionList = result.data?.sessions ?? [];
    setSessions(sessionList);

    // Check if there's an active session and load it
    const active = sessionList.find((s) => s.is_active);
    if (active) {
      const detailResult = await apiFetch<SessionDetail>(
        `/api/session/${active.id}`,
        token
      );
      if (detailResult.data) {
        setActiveSession(detailResult.data);
      }
    }

    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  /** Create a new session */
  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim() || isCreating) return;

    setIsCreating(true);
    setError(null);

    const result = await apiFetch<SessionDetail>('/api/session', token, {
      method: 'POST',
      body: JSON.stringify({ title: newTitle.trim() }),
    });

    if (result.error) {
      setError(result.error);
      setIsCreating(false);
      return;
    }

    if (result.data) {
      setActiveSession(result.data);
      setNewTitle('');
      await loadSessions();
    }

    setIsCreating(false);
  };

  /** Resume an existing session */
  const handleResume = async (sessionId: string) => {
    setError(null);

    const result = await apiFetch<SessionDetail>(
      `/api/session/${sessionId}`,
      token
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data) {
      setActiveSession(result.data);
    }
  };

  /** Abandon the active session */
  const handleAbandon = async (sessionId: string) => {
    setError(null);

    const result = await apiFetch<SessionSummary>(
      `/api/session/${sessionId}`,
      token,
      { method: 'DELETE' }
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    setActiveSession(null);
    await loadSessions();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.centered}>
            <div className="thinking-dots">
              <div className="thinking-dot" />
              <div className="thinking-dot" />
              <div className="thinking-dot" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveSession = activeSession !== null;
  const pastSessions = sessions.filter((s) => !s.is_active);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <span className="font-serif" style={styles.brandName}>
          Sage Codex
        </span>
        <button
          onClick={logout}
          style={styles.logoutButton}
          type="button"
        >
          Sign Out
        </button>
      </header>

      <div style={styles.content}>
        {/* Error */}
        {error && (
          <div style={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        {/* Active Session */}
        {hasActiveSession && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Active Session</h2>
            <div className="detail-card detail-card--gold" style={styles.activeCard}>
              <div style={styles.sessionHeader}>
                <h3 style={styles.sessionTitle}>
                  {activeSession.session.title}
                </h3>
                <span className="entity-tag role-leader" style={{ fontSize: 11 }}>
                  {findStageLabel(activeSession.session.stage)}
                </span>
              </div>
              <p style={styles.sessionMeta}>
                Created {formatDate(activeSession.session.created_at)}
              </p>
              <div style={styles.actionRow}>
                <button
                  className="footer-button"
                  style={styles.resumeButton}
                  onClick={() => handleResume(activeSession.session.id)}
                  type="button"
                >
                  Continue Adventure
                </button>
                <button
                  onClick={() => handleAbandon(activeSession.session.id)}
                  style={styles.abandonButton}
                  type="button"
                >
                  Abandon
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Session Form */}
        {!hasActiveSession && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Begin a New Tale</h2>
            <form onSubmit={handleCreate} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label htmlFor="session-title" style={styles.label}>
                  Adventure Title
                </label>
                <input
                  id="session-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="The Hollow Vigil..."
                  required
                  style={styles.input}
                  className="focus-ring"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating || !newTitle.trim()}
                className="footer-button"
              >
                {isCreating ? 'Opening the Codex...' : 'Open the Codex'}
              </button>
            </form>
          </div>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Past Sessions</h2>
            <div style={styles.sessionList}>
              {pastSessions.map((s) => (
                <div key={s.id} className="detail-card" style={styles.pastCard}>
                  <div style={styles.sessionHeader}>
                    <span style={styles.pastTitle}>{s.title}</span>
                    <span style={styles.pastStage}>
                      {findStageLabel(s.stage)}
                    </span>
                  </div>
                  <span style={styles.pastDate}>
                    {formatDate(s.updated_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Inline Styles (using design tokens via CSS custom properties)
// =============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' },
  card: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' },
  brandName: { fontSize: 16, fontWeight: 600, color: 'var(--accent-gold)' },
  logoutButton: { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '6px 12px' },
  content: { maxWidth: 560, margin: '0 auto', padding: '32px 24px' },
  errorBanner: { padding: '10px 14px', marginBottom: 20, background: 'rgba(219, 126, 126, 0.1)', border: '1px solid rgba(219, 126, 126, 0.3)', borderRadius: 'var(--radius-sm)', color: '#db7e7e', fontSize: 13, lineHeight: 1.5 },
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--accent-gold)', marginBottom: 16, marginTop: 0 },
  activeCard: { padding: '20px' },
  sessionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sessionTitle: { fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
  sessionMeta: { fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px 0' },
  actionRow: { display: 'flex', gap: 12, alignItems: 'center' },
  resumeButton: { flex: 1 },
  abandonButton: { background: 'none', border: '1px solid rgba(219, 126, 126, 0.3)', color: '#db7e7e', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '8px 16px', borderRadius: 'var(--radius-sm)' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' },
  input: { padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 15, outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' },
  sessionList: { display: 'flex', flexDirection: 'column', gap: 8 },
  pastCard: { padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  pastTitle: { fontSize: 14, color: 'var(--text-primary)' },
  pastStage: { fontSize: 11, color: 'var(--text-muted)' },
  pastDate: { fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 12 },
};
