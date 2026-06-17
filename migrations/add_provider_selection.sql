-- ============================================
-- Provider Selection Feature Migration
-- ============================================
-- Description: Adds provider and model selection fields to chat_sessions table
-- Author: OHM Implementation Plan
-- Date: 2024
-- ============================================

-- Add provider/model selection fields to chat_sessions
ALTER TABLE chat_sessions 
  ADD COLUMN IF NOT EXISTS selected_provider TEXT DEFAULT 'openrouter',
  ADD COLUMN IF NOT EXISTS selected_model TEXT,
  ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_provider 
  ON chat_sessions(selected_provider);

-- Add comments for documentation
COMMENT ON COLUMN chat_sessions.selected_provider IS 
  'User-selected LLM provider (openrouter, groq, aiml)';
COMMENT ON COLUMN chat_sessions.selected_model IS 
  'Specific model ID (e.g., nvidia/nemotron-3-ultra-550b-a55b:free)';
COMMENT ON COLUMN chat_sessions.provider_metadata IS 
  'Additional provider-specific configuration (JSON)';

-- Backfill existing sessions with default provider
UPDATE chat_sessions 
  SET selected_provider = 'openrouter'
  WHERE selected_provider IS NULL;

-- ============================================
-- Verification Queries (for testing)
-- ============================================
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'chat_sessions' 
-- AND column_name IN ('selected_provider', 'selected_model', 'provider_metadata');
