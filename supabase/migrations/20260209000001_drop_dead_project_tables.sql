-- Migration: Drop dead project tables (archon_* and dndchat_*)
-- Purpose: Remove unused tables from dead projects to reduce attack surface
-- This runs BEFORE enabling RLS to minimize unprotected tables.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- Drop all archon_* tables
  FOR tbl IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'archon_%'
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', tbl);
    RAISE NOTICE 'Dropped table: %', tbl;
  END LOOP;

  -- Drop all dndchat_* tables
  FOR tbl IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'dndchat_%'
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', tbl);
    RAISE NOTICE 'Dropped table: %', tbl;
  END LOOP;
END $$;
