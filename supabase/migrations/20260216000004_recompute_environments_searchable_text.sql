-- Migration: Recompute searchable_text without *...* markers
-- Format: name + description + impulses + (feature name + feature desc + gm_questions)
-- GM questions are included as plain text (no italic markers)

UPDATE daggerheart_environments
SET searchable_text = (
  name
  || ' '
  || description
  || ' '
  || COALESCE(array_to_string(impulses, ' '), '')
  || ' '
  || COALESCE(
    (
      SELECT string_agg(
        COALESCE(feat->>'name', '')
        || ' '
        || COALESCE(feat->>'desc', '')
        || ' '
        || COALESCE(
          (
            SELECT string_agg(gm_q #>> '{}', ' ')
            FROM jsonb_array_elements(feat->'gm_questions') AS gm_q
          ),
          ''
        ),
        ' '
      )
      FROM unnest(features) AS feat
    ),
    ''
  )
);
