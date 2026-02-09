-- Migration: Enable RLS on 13 read-only reference tables
-- Policy: Allow public SELECT for anon role (game content is not sensitive)
-- No INSERT/UPDATE/DELETE for anon role
--
-- CRITICAL: ALTER TABLE + CREATE POLICY must be in the same transaction
-- to avoid a window of zero access.

BEGIN;

-- daggerheart_frames
ALTER TABLE daggerheart_frames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_frames FOR SELECT TO anon USING (true);

-- daggerheart_adversaries
ALTER TABLE daggerheart_adversaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_adversaries FOR SELECT TO anon USING (true);

-- daggerheart_items
ALTER TABLE daggerheart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_items FOR SELECT TO anon USING (true);

-- daggerheart_consumables
ALTER TABLE daggerheart_consumables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_consumables FOR SELECT TO anon USING (true);

-- daggerheart_weapons
ALTER TABLE daggerheart_weapons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_weapons FOR SELECT TO anon USING (true);

-- daggerheart_armor
ALTER TABLE daggerheart_armor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_armor FOR SELECT TO anon USING (true);

-- daggerheart_environments
ALTER TABLE daggerheart_environments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_environments FOR SELECT TO anon USING (true);

-- daggerheart_ancestries
ALTER TABLE daggerheart_ancestries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_ancestries FOR SELECT TO anon USING (true);

-- daggerheart_classes
ALTER TABLE daggerheart_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_classes FOR SELECT TO anon USING (true);

-- daggerheart_subclasses
ALTER TABLE daggerheart_subclasses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_subclasses FOR SELECT TO anon USING (true);

-- daggerheart_domains
ALTER TABLE daggerheart_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_domains FOR SELECT TO anon USING (true);

-- daggerheart_abilities
ALTER TABLE daggerheart_abilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_abilities FOR SELECT TO anon USING (true);

-- daggerheart_communities
ALTER TABLE daggerheart_communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access"
  ON daggerheart_communities FOR SELECT TO anon USING (true);

COMMIT;
