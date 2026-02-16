-- Migration: Create daggerheart_locations table
-- A self-contained location sourcebook table modeled after the Sablewood PDF.
-- Each row is a complete location with geography, settlements, factions, loot,
-- adversaries, and environments — everything needed to run adventures in that setting.

BEGIN;

CREATE TABLE daggerheart_locations (
  -- Core identity
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  tier            INTEGER NOT NULL,
  themes          TEXT[] DEFAULT '{}',
  concept         TEXT NOT NULL,
  description     TEXT NOT NULL,

  -- Narrative structure (JSONB arrays)
  distinctions    JSONB DEFAULT '[]',
  gm_principles   JSONB DEFAULT '[]',
  landmarks       JSONB DEFAULT '[]',
  settlements     JSONB DEFAULT '[]',
  factions        JSONB DEFAULT '[]',

  -- Resources (d12 roll tables + rumors)
  moments_of_hope TEXT[] DEFAULT '{}',
  moments_of_fear TEXT[] DEFAULT '{}',
  rumors          TEXT[] DEFAULT '{}',

  -- Game content (JSONB)
  loot            JSONB DEFAULT '{}',
  adversaries     JSONB DEFAULT '[]',
  environments    JSONB DEFAULT '[]',

  -- Standard columns (matching existing reference tables)
  searchable_text TEXT,
  embedding       TEXT,
  source_book     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_locations_tier ON daggerheart_locations (tier);
CREATE INDEX idx_locations_themes ON daggerheart_locations USING GIN (themes);

-- RLS: public read access (matching other reference tables)
ALTER TABLE daggerheart_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_locations FOR SELECT TO anon USING (true);

COMMIT;
