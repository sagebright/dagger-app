-- Migration: Enable RLS on user-generated tables with NO anon access
-- These tables are only accessed through the bridge server (service_role key).
-- service_role bypasses RLS, so no policies needed for bridge access.
-- The anon role gets NO policies = zero access via direct anon key.

BEGIN;

-- daggerheart_custom_frames (user-generated custom frames, has user_id column)
ALTER TABLE daggerheart_custom_frames ENABLE ROW LEVEL SECURITY;
-- No anon policies intentionally. All access via service_role through bridge.

-- daggerheart_web_adventures (session-based adventure persistence)
ALTER TABLE daggerheart_web_adventures ENABLE ROW LEVEL SECURITY;
-- No anon policies intentionally. All access via service_role through bridge.

COMMIT;
