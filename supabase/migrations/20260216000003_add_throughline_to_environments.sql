-- Migration: Add throughline text column to daggerheart_environments
-- NULL default for existing rows; generated content will populate this later

ALTER TABLE daggerheart_environments
ADD COLUMN throughline text DEFAULT NULL;
