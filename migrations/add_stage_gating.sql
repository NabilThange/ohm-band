-- ============================================================
-- OHM: Stage-Gated Agent Architecture Migration
-- Adds project_stage, stage_override, auto_orchestration,
-- and stage_history to chat_sessions
-- ============================================================

-- 1. Add stage tracking columns
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS project_stage TEXT
    NOT NULL DEFAULT 'planning'
    CHECK (project_stage IN ('planning', 'design', 'build', 'fix')),
  ADD COLUMN IF NOT EXISTS stage_override BOOLEAN
    NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_orchestration BOOLEAN
    NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS stage_history JSONB
    DEFAULT '[]'::jsonb;

-- 2. Index for fast stage queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_stage
  ON chat_sessions (project_stage);

-- 3. Backfill: all existing chats start in planning (already the default)
-- No action needed — DEFAULT 'planning' covers existing rows on next UPDATE.
-- If rows were inserted before this migration, run:
-- UPDATE chat_sessions SET project_stage = 'planning' WHERE project_stage IS NULL;
