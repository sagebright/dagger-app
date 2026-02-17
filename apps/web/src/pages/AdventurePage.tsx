/**
 * AdventurePage — Stage router for the active adventure session
 *
 * Loads the active session and renders the appropriate stage page.
 * Currently only supports the Invoking stage. Future stages will be
 * added as they are implemented.
 *
 * Flow:
 * 1. Load the active session from the server
 * 2. Initialize the adventure store with session state
 * 3. Render the stage-appropriate page component
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdventureStore } from '@/stores/adventureStore';
import { useChatStore } from '@/stores/chatStore';
import { InvokingPage } from './InvokingPage';
import { AttuningPage } from './AttuningPage';
import { BindingPage } from './BindingPage';
import { WeavingPage } from './WeavingPage';
import { InscribingPage } from './InscribingPage';
import { DeliveringPage } from './DeliveringPage';
import type { AdventureState, Stage } from '@dagger-app/shared-types';
import { createEmptyAdventureState } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

interface SessionResponse {
  session: {
    id: string;
    stage: Stage;
    title: string;
    is_active: boolean;
  };
  adventureState: {
    id: string;
    session_id: string;
    state?: AdventureState;
  };
}

interface SessionListResponse {
  sessions: Array<{
    id: string;
    stage: Stage;
    is_active: boolean;
  }>;
}

// =============================================================================
// Component
// =============================================================================

export function AdventurePage() {
  const navigate = useNavigate();
  const { session: authSession } = useAuth();
  const token = authSession?.access_token ?? '';

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialize = useAdventureStore((s) => s.initialize);
  const clearMessages = useChatStore((s) => s.clearMessages);

  /** Load the active session and initialize stores */
  const loadActiveSession = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      // Find the active session
      const listRes = await fetch('/api/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!listRes.ok) {
        throw new Error('Failed to load sessions');
      }

      const listData = (await listRes.json()) as SessionListResponse;
      const activeSession = listData.sessions.find((s) => s.is_active);

      if (!activeSession) {
        // No active session — redirect to session picker
        navigate('/');
        return;
      }

      // Load the full session detail
      const detailRes = await fetch(`/api/session/${activeSession.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!detailRes.ok) {
        throw new Error('Failed to load session details');
      }

      const detail = (await detailRes.json()) as SessionResponse;

      // Initialize the adventure store
      const adventureState =
        detail.adventureState.state ?? createEmptyAdventureState();
      adventureState.stage = detail.session.stage;

      initialize(detail.session.id, adventureState);
      clearMessages();

      setSessionId(detail.session.id);
      setStage(detail.session.stage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate, initialize, clearMessages]);

  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="sage-speaking">
          <span className="sage-label">Sage</span>
          <div className="thinking-dots">
            <div className="thinking-dot" />
            <div className="thinking-dot" />
            <div className="thinking-dot" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <p style={{ color: '#db7e7e', marginBottom: 16 }}>{error}</p>
          <button
            className="footer-button"
            style={{ width: 'auto', padding: '8px 24px' }}
            onClick={() => navigate('/')}
            type="button"
          >
            Return to Sessions
          </button>
        </div>
      </div>
    );
  }

  // No session loaded
  if (!sessionId || !stage) {
    return null;
  }

  // Render the appropriate stage page
  switch (stage) {
    case 'invoking':
      return <InvokingPage sessionId={sessionId} />;
    case 'attuning':
      return <AttuningPage sessionId={sessionId} />;
    case 'binding':
      return <BindingPage sessionId={sessionId} />;
    case 'weaving':
      return <WeavingPage sessionId={sessionId} />;
    case 'inscribing':
      return <InscribingPage sessionId={sessionId} />;
    case 'delivering':
      return <DeliveringPage sessionId={sessionId} />;
  }
}
