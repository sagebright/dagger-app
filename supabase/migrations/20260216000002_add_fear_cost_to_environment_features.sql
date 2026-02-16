-- Migration: Add fear_cost integer to each feature in features[] jsonb
-- on daggerheart_environments
--
-- Pattern: Extract from "spend (a|N) Fear" (case-insensitive)
--   "a Fear"  -> fear_cost: 1
--   "N Fear"  -> fear_cost: N
--   no match  -> fear_cost: 0

UPDATE daggerheart_environments
SET features = (
  SELECT array_agg(
    CASE
      WHEN feat->>'desc' ~* 'spend a fear' THEN
        feat || jsonb_build_object('fear_cost', 1)
      WHEN feat->>'desc' ~* 'spend \d+ fear' THEN
        feat || jsonb_build_object(
          'fear_cost',
          (regexp_match(feat->>'desc', 'spend (\d+) fear', 'i'))[1]::int
        )
      ELSE
        feat || jsonb_build_object('fear_cost', 0)
    END
  )
  FROM unnest(features) AS feat
);
