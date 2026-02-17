-- Migration: Enable RLS on Sage tables with user-scoped access
-- Users can only access their own sessions and related data.
-- The API server uses service_role which bypasses RLS.
-- The anon role gets NO direct access policies.

BEGIN;

-- sage_sessions: users access own sessions only
ALTER TABLE sage_sessions ENABLE ROW LEVEL SECURITY;
-- No anon policies intentionally. All access via service_role through API.

-- sage_adventure_state: inherits session scope
ALTER TABLE sage_adventure_state ENABLE ROW LEVEL SECURITY;
-- No anon policies intentionally. All access via service_role through API.

-- sage_messages: inherits session scope
ALTER TABLE sage_messages ENABLE ROW LEVEL SECURITY;
-- No anon policies intentionally. All access via service_role through API.

-- sage_usage: inherits session scope
ALTER TABLE sage_usage ENABLE ROW LEVEL SECURITY;
-- No anon policies intentionally. All access via service_role through API.

COMMIT;
