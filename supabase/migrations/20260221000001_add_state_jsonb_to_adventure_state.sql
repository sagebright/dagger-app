-- Migration: Add state JSONB column to sage_adventure_state
--
-- The application code (state-mapper, context-assembler, component/frame/scene
-- routes) reads and writes a unified `state` JSONB blob containing the full
-- adventure state (spark, components, frame, sceneArcs, inscribedScenes, etc.).
-- This column was referenced in code but never created in the original migration.

BEGIN;

ALTER TABLE sage_adventure_state
  ADD COLUMN IF NOT EXISTS state JSONB DEFAULT '{}';

-- Service role needs access to read/write this column.
-- RLS policies already grant service_role full access via the existing
-- policies from 20260219000001, so no additional policy is needed.

COMMIT;
