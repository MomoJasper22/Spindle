-- ============================================================================
-- Migration 005: Non-Destructive Avatar Focal Position & Zoom Metadata
-- Project: Spindle
-- ============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_position JSONB NOT NULL DEFAULT '{"x":50,"y":50,"zoom":1}'::jsonb;
