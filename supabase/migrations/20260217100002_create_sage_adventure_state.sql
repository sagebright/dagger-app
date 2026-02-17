-- Migration: Create sage_adventure_state table
-- Stores the evolving adventure content produced during a Sage session.
-- One-to-one relationship with sage_sessions.

BEGIN;

CREATE TABLE sage_adventure_state (
  -- Core identity
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL UNIQUE REFERENCES sage_sessions(id) ON DELETE CASCADE,

  -- Frame selection (Binding stage)
  selected_frame  JSONB,
  frame_confirmed BOOLEAN DEFAULT false,

  -- Outline (Weaving stage)
  outline         JSONB,
  outline_confirmed BOOLEAN DEFAULT false,

  -- Scenes (Inscribing stage) — array of scene objects
  scenes          JSONB[] DEFAULT '{}',
  current_scene_index INTEGER,

  -- Generated content (Inscribing stage)
  npcs            JSONB[] DEFAULT '{}',
  adversaries     JSONB[] DEFAULT '{}',
  items           JSONB[] DEFAULT '{}',
  echoes          JSONB[] DEFAULT '{}',

  -- Export tracking (Delivering stage)
  exported_at     TIMESTAMPTZ,
  export_count    INTEGER DEFAULT 0,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Index for session lookup
CREATE INDEX idx_sage_adventure_state_session_id ON sage_adventure_state (session_id);

COMMIT;
