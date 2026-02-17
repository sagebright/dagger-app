-- Migration: Create sage_messages table
-- Stores conversation history between users and the Sage.
-- Messages are ordered by created_at within each session.

BEGIN;

CREATE TABLE sage_messages (
  -- Core identity
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sage_sessions(id) ON DELETE CASCADE,

  -- Message content
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,

  -- Optional structured metadata (tool calls, stage transitions, etc.)
  metadata        JSONB,

  -- Timestamp
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Index for fetching conversation history in order
CREATE INDEX idx_sage_messages_session_id_created ON sage_messages (session_id, created_at);

COMMIT;
