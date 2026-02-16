-- Migration: Create daggerheart_npcs table
-- Narrative-focused friendly NPCs with optional mechanical features.
-- Adversary stat blocks live in daggerheart_adversaries; this table is for
-- lighter, story-driven characters: allies, quest-givers, bystanders, etc.

BEGIN;

CREATE TABLE daggerheart_npcs (
  -- Core identity
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  tier            INTEGER NOT NULL,
  role            TEXT NOT NULL
                    CHECK (role IN ('ally', 'neutral', 'quest-giver', 'antagonist', 'bystander')),
  description     TEXT NOT NULL,

  -- Narrative detail
  appearance      TEXT NOT NULL,
  personality     TEXT NOT NULL,
  motivations     TEXT[] DEFAULT '{}',
  connections     TEXT[] DEFAULT '{}',
  notable_traits  TEXT[] DEFAULT '{}',

  -- Optional mechanical features (JSONB array of {name, trigger, effect})
  features        JSONB[] DEFAULT '{}',

  -- Search / embedding
  searchable_text TEXT,
  embedding       vector(1024),

  -- Metadata
  source_book     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query filters
CREATE INDEX idx_npcs_tier ON daggerheart_npcs (tier);
CREATE INDEX idx_npcs_role ON daggerheart_npcs (role);

-- RLS: public read access (matching other reference tables)
ALTER TABLE daggerheart_npcs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_npcs FOR SELECT TO anon USING (true);

COMMIT;
