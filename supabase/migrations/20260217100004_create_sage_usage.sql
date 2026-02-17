-- Migration: Create sage_usage table
-- Tracks Anthropic API token usage per session for cost visibility.
-- One row per API call, aggregated for session-level reporting.

BEGIN;

CREATE TABLE sage_usage (
  -- Core identity
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sage_sessions(id) ON DELETE CASCADE,

  -- API call details
  model           TEXT NOT NULL,
  input_tokens    INTEGER NOT NULL DEFAULT 0,
  output_tokens   INTEGER NOT NULL DEFAULT 0,

  -- Context for grouping (which stage/operation triggered the call)
  stage           TEXT,
  operation       TEXT,

  -- Timestamp
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Index for session-level aggregation
CREATE INDEX idx_sage_usage_session_id ON sage_usage (session_id);

COMMIT;
