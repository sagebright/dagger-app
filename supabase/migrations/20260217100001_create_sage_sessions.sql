-- Migration: Create sage_sessions table
-- Tracks active Sage Codex sessions between the API and users.
-- Each session represents one adventure creation workflow.

BEGIN;

CREATE TABLE sage_sessions (
  -- Core identity
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID,                -- nullable for anonymous local usage
  title           TEXT NOT NULL DEFAULT 'Untitled Adventure',

  -- Workflow state
  stage           TEXT NOT NULL DEFAULT 'invoking'
                    CHECK (stage IN (
                      'invoking', 'attuning', 'binding',
                      'weaving', 'inscribing', 'delivering'
                    )),
  stage_history   TEXT[] DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,

  -- Component selections (the 8 attuning components as JSONB)
  components      JSONB DEFAULT '{}',
  confirmed_components TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

-- Index for user lookups
CREATE INDEX idx_sage_sessions_user_id ON sage_sessions (user_id);

-- Index for cleanup of expired sessions
CREATE INDEX idx_sage_sessions_expires_at ON sage_sessions (expires_at);

COMMIT;
