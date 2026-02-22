-- Migration: Create dashboard_projects and dashboard_features tables
--
-- Persistent cloud storage for project/feature data with ingredient fields,
-- state tracking, and RLS. Part of the brainwalks dashboard pipeline.
--
-- RLS: service_role full access, no anon policies (local app, API mediates access).

BEGIN;

-- =============================================================================
-- dashboard_projects: Tracks projects with ingredient fields and state
-- =============================================================================
CREATE TABLE dashboard_projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  scope_level       TEXT CHECK (scope_level IN ('small', 'medium', 'large')),
  energy_type       TEXT CHECK (energy_type IN ('create', 'clean', 'solve', 'sharpen')),
  value_type        TEXT CHECK (value_type IN ('economic', 'personal', 'learning')),
  value_intensity   TEXT CHECK (value_intensity IN ('low', 'medium', 'high')),
  momentum_state    TEXT NOT NULL DEFAULT 'fresh'
                      CHECK (momentum_state IN ('fresh', 'active', 'paused', 'stalled')),
  lifecycle_state   TEXT NOT NULL DEFAULT 'ideation'
                      CHECK (lifecycle_state IN ('ideation', 'confirmed_plan', 'execution', 'shipped', 'archived')),
  next_step         TEXT,
  source_plan_path  TEXT,
  state_changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- State-based query indexes
CREATE INDEX idx_dashboard_projects_momentum_state
  ON dashboard_projects (momentum_state);

CREATE INDEX idx_dashboard_projects_lifecycle_state
  ON dashboard_projects (lifecycle_state);

CREATE INDEX idx_dashboard_projects_state_changed_at
  ON dashboard_projects (state_changed_at);

-- RLS: service_role full access
ALTER TABLE dashboard_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON dashboard_projects;
CREATE POLICY "service_role_all" ON dashboard_projects
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- dashboard_features: Tracks features within projects with optional overrides
-- =============================================================================
CREATE TABLE dashboard_features (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES dashboard_projects(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  scope_level       TEXT CHECK (scope_level IN ('small', 'medium', 'large')),
  energy_type       TEXT CHECK (energy_type IN ('create', 'clean', 'solve', 'sharpen')),
  momentum_state    TEXT NOT NULL DEFAULT 'fresh'
                      CHECK (momentum_state IN ('fresh', 'active', 'paused', 'stalled')),
  lifecycle_state   TEXT NOT NULL DEFAULT 'ideation'
                      CHECK (lifecycle_state IN ('ideation', 'confirmed_plan', 'execution', 'shipped', 'archived')),
  next_step         TEXT,
  state_changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- State-based query indexes
CREATE INDEX idx_dashboard_features_momentum_state
  ON dashboard_features (momentum_state);

CREATE INDEX idx_dashboard_features_lifecycle_state
  ON dashboard_features (lifecycle_state);

CREATE INDEX idx_dashboard_features_state_changed_at
  ON dashboard_features (state_changed_at);

-- FK lookup index
CREATE INDEX idx_dashboard_features_project_id
  ON dashboard_features (project_id);

-- RLS: service_role full access
ALTER TABLE dashboard_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON dashboard_features;
CREATE POLICY "service_role_all" ON dashboard_features
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
