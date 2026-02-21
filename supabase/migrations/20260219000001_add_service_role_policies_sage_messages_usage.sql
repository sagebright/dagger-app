-- Migration: Add service_role RLS policies to sage_messages and sage_usage
--
-- Problem: RLS is enabled on these tables but no policies existed,
-- blocking all operations when service_role doesn't have BYPASSRLS.
--
-- sage_sessions and sage_adventure_state already have policies from
-- a previous migration. This covers the remaining two sage tables.
--
-- Idempotent: uses DROP POLICY IF EXISTS before CREATE POLICY.

BEGIN;

DROP POLICY IF EXISTS "service_role_all" ON sage_messages;
CREATE POLICY "service_role_all" ON sage_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all" ON sage_usage;
CREATE POLICY "service_role_all" ON sage_usage
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
