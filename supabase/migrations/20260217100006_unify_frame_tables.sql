-- Migration: Frame table unification
-- Adds a `source` column to daggerheart_frames to distinguish between
-- official frames (from source books) and custom user-created frames.
-- This prepares for eventual consolidation where both official and custom
-- frames can be queried from a single table.

BEGIN;

-- Add source column to daggerheart_frames
-- 'official' = from published Daggerheart source books
-- 'custom' = user-created frames (future: migrated from daggerheart_custom_frames)
ALTER TABLE daggerheart_frames
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'official'
    CHECK (source IN ('official', 'custom'));

-- Backfill existing rows as 'official'
UPDATE daggerheart_frames SET source = 'official' WHERE source IS NULL;

-- Add index for filtering by source
CREATE INDEX IF NOT EXISTS idx_frames_source ON daggerheart_frames (source);

COMMIT;
