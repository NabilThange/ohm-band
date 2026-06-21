-- ============================================
-- MIGRATION 006: ADD PERFORMANCE INDEXES
-- ============================================
-- Description: Add indexes for frequently queried patterns
-- Risk: LOW - indexes only improve performance
-- Impact: Small temporary load during index creation
-- ============================================

-- ============================================
-- MESSAGES TABLE INDEXES
-- ============================================

-- Chat message lookups (most common query)
-- Used by: lib/db/chat.ts getMessages(), frontend message list
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_sequence 
  ON messages(chat_id, sequence_number);

-- Message sequence lookup (for getNextSequenceNumber)
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_max_sequence 
  ON messages(chat_id, sequence_number DESC);

-- Full-text search on message content (already has tsvector column)
CREATE INDEX IF NOT EXISTS idx_messages_content_search 
  ON messages USING gin(content_search);

-- ============================================
-- CHATS TABLE INDEXES
-- ============================================

-- Chat list for user (most common frontend query)
-- Filters out archived chats, orders by recency
CREATE INDEX IF NOT EXISTS idx_chats_user_id_last_message 
  ON chats(user_id, last_message_at DESC) 
  WHERE is_archived = false;

-- All chats including archived (for archive view)
CREATE INDEX IF NOT EXISTS idx_chats_user_id_all 
  ON chats(user_id, last_message_at DESC);

-- Public chat sharing
CREATE INDEX IF NOT EXISTS idx_chats_share_token 
  ON chats(share_token) 
  WHERE share_token IS NOT NULL;

-- ============================================
-- ARTIFACTS TABLE INDEXES
-- ============================================

-- Artifact lookups by chat and type
-- Used by: lib/db/artifacts.ts getLatestArtifact()
CREATE INDEX IF NOT EXISTS idx_artifacts_chat_id_type 
  ON artifacts(chat_id, type, created_at DESC);

-- Artifacts by project
CREATE INDEX IF NOT EXISTS idx_artifacts_project_id 
  ON artifacts(project_id, created_at DESC);

-- ============================================
-- ARTIFACT_VERSIONS TABLE INDEXES
-- ============================================

-- Version lookups (get latest version)
CREATE INDEX IF NOT EXISTS idx_artifact_versions_artifact_id_version 
  ON artifact_versions(artifact_id, version_number DESC);

-- Diagram status tracking (for diagram generation pipeline)
CREATE INDEX IF NOT EXISTS idx_artifact_versions_diagram_status 
  ON artifact_versions(diagram_status, created_at) 
  WHERE diagram_status IN ('pending', 'queued', 'generating');

-- ============================================
-- CHAT_SESSIONS TABLE INDEXES
-- ============================================

-- Session lookup by chat (1:1 relationship, but useful for joins)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_chat_id 
  ON chat_sessions(chat_id);

-- Active sessions by stage (for orchestrator analytics)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_stage 
  ON chat_sessions(project_stage, last_active_at DESC);

-- ============================================
-- PROJECTS TABLE INDEXES
-- ============================================

-- Projects by user
CREATE INDEX IF NOT EXISTS idx_projects_user_id 
  ON projects(user_id, created_at DESC);

-- Projects by status
CREATE INDEX IF NOT EXISTS idx_projects_status 
  ON projects(status, updated_at DESC);

-- ============================================
-- DIAGRAM_QUEUE TABLE INDEXES
-- ============================================

-- Queue processing (most critical for cron job)
CREATE INDEX IF NOT EXISTS idx_diagram_queue_status_created 
  ON diagram_queue(status, created_at) 
  WHERE status IN ('queued', 'processing');

-- Failed queue items (for retry logic)
CREATE INDEX IF NOT EXISTS idx_diagram_queue_failed 
  ON diagram_queue(status, created_at DESC) 
  WHERE status = 'failed';

-- User's diagram generations (for status checking)
CREATE INDEX IF NOT EXISTS idx_diagram_queue_chat_id 
  ON diagram_queue(chat_id, created_at DESC);

-- ============================================
-- DIAGRAM_CACHE TABLE INDEXES
-- ============================================

-- Circuit hash lookup (primary cache key)
CREATE INDEX IF NOT EXISTS idx_diagram_cache_circuit_hash 
  ON diagram_cache(circuit_hash);

-- LRU eviction (cleanup old cache)
CREATE INDEX IF NOT EXISTS idx_diagram_cache_last_accessed 
  ON diagram_cache(last_accessed_at ASC);

-- ============================================
-- COMPONENT_TEMPLATES TABLE INDEXES
-- ============================================

-- Component search (used by: lib/db/components.ts searchTemplates())
CREATE INDEX IF NOT EXISTS idx_component_templates_name 
  ON component_templates(name);

-- Search by category
CREATE INDEX IF NOT EXISTS idx_component_templates_category 
  ON component_templates(category);

-- Full-text search on name and description
CREATE INDEX IF NOT EXISTS idx_component_templates_search 
  ON component_templates USING gin(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- List all indexes in public schema
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index sizes (useful for monitoring)
SELECT 
    schemaname,
    relname AS tablename,
    indexrelname AS indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
