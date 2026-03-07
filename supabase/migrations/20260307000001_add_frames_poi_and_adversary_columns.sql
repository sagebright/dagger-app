-- Add points_of_interest and suggested_adversaries columns to daggerheart_frames
-- These support the enhanced /generate-frames skill (Steps 16-17)

ALTER TABLE daggerheart_frames
ADD COLUMN IF NOT EXISTS points_of_interest JSONB DEFAULT '[]'::jsonb;

ALTER TABLE daggerheart_frames
ADD COLUMN IF NOT EXISTS suggested_adversaries JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN daggerheart_frames.points_of_interest IS 'Lightweight narrative seeds: [{name, description, significance, danger_level}]';
COMMENT ON COLUMN daggerheart_frames.suggested_adversaries IS 'Thematic adversary links: [{name, rationale, adversary_id}]';
