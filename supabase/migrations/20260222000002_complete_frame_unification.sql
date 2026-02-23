-- Migration: Complete frame table unification
--
-- Adds all rich schema columns from daggerheart_custom_frames to
-- daggerheart_frames, creating a single unified table for all frame types.
-- Updates the source CHECK constraint to support three sources:
--   official = Core Rules (published Daggerheart source books)
--   sage     = Generated via /generate-frames skill
--   user     = Created by user during an adventure session
--
-- Migrates any existing custom frame data, then drops the old table.

BEGIN;

-- =========================================================================
-- 1. Add rich schema columns to daggerheart_frames
-- =========================================================================

ALTER TABLE daggerheart_frames
  ADD COLUMN IF NOT EXISTS concept TEXT,
  ADD COLUMN IF NOT EXISTS pitch TEXT,
  ADD COLUMN IF NOT EXISTS tone_feel TEXT[],
  ADD COLUMN IF NOT EXISTS complexity_rating INTEGER,
  ADD COLUMN IF NOT EXISTS touchstones TEXT[],
  ADD COLUMN IF NOT EXISTS overview TEXT,
  ADD COLUMN IF NOT EXISTS heritage_classes JSONB,
  ADD COLUMN IF NOT EXISTS player_principles TEXT[],
  ADD COLUMN IF NOT EXISTS gm_principles TEXT[],
  ADD COLUMN IF NOT EXISTS distinctions JSONB,
  ADD COLUMN IF NOT EXISTS inciting_incident TEXT,
  ADD COLUMN IF NOT EXISTS custom_mechanics JSONB,
  ADD COLUMN IF NOT EXISTS session_zero_questions TEXT[],
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Add complexity_rating range constraint
ALTER TABLE daggerheart_frames
  ADD CONSTRAINT chk_complexity_rating
  CHECK (complexity_rating IS NULL OR (complexity_rating >= 1 AND complexity_rating <= 4));

-- =========================================================================
-- 2. Update source CHECK constraint: official | sage | user
-- =========================================================================

-- Drop the old constraint (added by migration 20260217100006)
ALTER TABLE daggerheart_frames
  DROP CONSTRAINT IF EXISTS daggerheart_frames_source_check;

-- Add updated constraint
ALTER TABLE daggerheart_frames
  ADD CONSTRAINT daggerheart_frames_source_check
  CHECK (source IN ('official', 'sage', 'user'));

-- =========================================================================
-- 3. Backfill existing official frames
-- =========================================================================

-- Set overview = description for official frames that don't have overview yet
UPDATE daggerheart_frames
  SET overview = description
  WHERE overview IS NULL AND source = 'official';

-- =========================================================================
-- 4. Migrate custom frames data into unified table
-- =========================================================================

INSERT INTO daggerheart_frames (
  name, description, themes, source,
  concept, pitch, tone_feel, complexity_rating, touchstones,
  overview, heritage_classes, player_principles, gm_principles,
  distinctions, inciting_incident, custom_mechanics, session_zero_questions,
  user_id, source_book, created_at, updated_at
)
SELECT
  title,
  COALESCE(overview, concept, ''),
  themes,
  'user',
  concept,
  pitch,
  tone_feel,
  complexity_rating,
  touchstones,
  overview,
  heritage_classes,
  player_principles,
  gm_principles,
  distinctions,
  inciting_incident,
  custom_mechanics,
  session_zero_questions,
  user_id,
  source_book,
  created_at,
  updated_at
FROM daggerheart_custom_frames;

-- =========================================================================
-- 5. Drop the old custom frames table
-- =========================================================================

DROP TABLE IF EXISTS daggerheart_custom_frames;

COMMIT;
