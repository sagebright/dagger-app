/**
 * Tests for StageReview component
 *
 * Validates message fetching, read-only display, and return action.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StageReview } from './StageReview';

// =============================================================================
// Mocks
// =============================================================================

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    session: { access_token: 'test-token', refresh_token: '' },
    isLoading: false,
    error: null,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  }),
}));

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// =============================================================================
// Helpers
// =============================================================================

const MOCK_API_MESSAGES = [
  {
    id: 'msg-1',
    session_id: 'session-1',
    role: 'user',
    content: 'I want a dungeon crawl',
    stage: 'invoking',
    metadata: null,
    created_at: '2026-02-20T00:00:00Z',
  },
  {
    id: 'msg-2',
    session_id: 'session-1',
    role: 'assistant',
    content: 'A dungeon crawl it shall be!',
    stage: 'invoking',
    metadata: null,
    created_at: '2026-02-20T00:00:01Z',
  },
];

function mockSuccessfulFetch() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ messages: MOCK_API_MESSAGES }),
  });
}

function mockFailedFetch(errorMessage: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ error: errorMessage }),
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('StageReview', () => {
  const defaultProps = {
    sessionId: 'session-1',
    stage: 'invoking' as const,
    currentStage: 'binding' as const,
    onReturn: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state initially', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {})); // never resolves
    render(<StageReview {...defaultProps} />);

    expect(screen.getByText('Loading Invoking...')).toBeInTheDocument();
  });

  it('fetches messages for the specified stage', async () => {
    mockSuccessfulFetch();
    render(<StageReview {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/session/session-1/messages?stage=invoking',
        { headers: { Authorization: 'Bearer test-token' } }
      );
    });
  });

  it('renders messages after successful fetch', async () => {
    mockSuccessfulFetch();
    render(<StageReview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('I want a dungeon crawl')).toBeInTheDocument();
    });
    expect(screen.getByText('A dungeon crawl it shall be!')).toBeInTheDocument();
  });

  it('shows the reviewing stage label in the return banner', async () => {
    mockSuccessfulFetch();
    render(<StageReview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Reviewing: Invoking')).toBeInTheDocument();
    });
  });

  it('shows a return button with the current stage name', async () => {
    mockSuccessfulFetch();
    render(<StageReview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Return to Binding')).toBeInTheDocument();
    });
  });

  it('calls onReturn when the return button is clicked', async () => {
    mockSuccessfulFetch();
    const onReturn = vi.fn();
    render(<StageReview {...defaultProps} onReturn={onReturn} />);

    await waitFor(() => {
      expect(screen.getByText('Return to Binding')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Return to Binding'));
    expect(onReturn).toHaveBeenCalledOnce();
  });

  it('shows the read-only indicator instead of chat input', async () => {
    mockSuccessfulFetch();
    render(<StageReview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Viewing Invoking')).toBeInTheDocument();
    });

    // No chat input should be present
    expect(screen.queryByRole('textbox', { name: /chat message input/i })).not.toBeInTheDocument();
  });

  it('shows error state with return button when fetch fails', async () => {
    mockFailedFetch('Session not found');
    render(<StageReview {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Session not found')).toBeInTheDocument();
    });

    // Return button should still be available
    expect(screen.getByText('Return to Binding')).toBeInTheDocument();
  });
});
