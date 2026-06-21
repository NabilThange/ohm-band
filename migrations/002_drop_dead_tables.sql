-- ============================================
-- MIGRATION 002: DROP DEAD TABLES
-- SAFE CLEANUP - Apply AFTER testing RLS
-- ============================================
-- Description: Remove 12 completely unused tables
-- Risk: LOW - all tables have 0 rows and 0 code references
-- Prerequisite: MUST run 001_rls_policies.sql first and test
-- Rollback: Restore from Supabase backup
-- ============================================

-- ============================================
-- PRE-FLIGHT CHECK
-- ============================================
-- Run this query first to verify all tables are empty:
/*
SELECT 
    'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'user_quotas', COUNT(*) FROM user_quotas
UNION ALL
SELECT 'artifact_sections', COUNT(*) FROM artifact_sections
UNION ALL
SELECT 'artifact_dependencies', COUNT(*) FROM artifact_dependencies
UNION ALL
SELECT 'budget_snapshots', COUNT(*) FROM budget_snapshots
UNION ALL
SELECT 'attachments', COUNT(*) FROM attachments
UNION ALL
SELECT 'message_feedback', COUNT(*) FROM message_feedback
UNION ALL
SELECT 'agent_executions', COUNT(*) FROM agent_executions
UNION ALL
SELECT 'error_logs', COUNT(*) FROM error_logs
UNION ALL
SELECT 'circuit_verifications', COUNT(*) FROM circuit_verifications
UNION ALL
SELECT 'datasheet_analyses', COUNT(*) FROM datasheet_analyses;
*/

-- Expected result: All counts = 0
-- If ANY table has rows, STOP and investigate

-- ============================================
-- BACKUP REMINDER
-- ============================================
-- [ ] Take a Supabase backup/snapshot before proceeding
-- [ ] Verify you can restore from backup
-- [ ] Confirm RLS is working and tested

-- ============================================
-- DROP UNUSED TABLES
-- ============================================

-- Analytics/Observability (not implemented)
DROP TABLE IF EXISTS agent_executions CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS message_feedback CASCADE;

-- Over-engineered architecture (unused)
DROP TABLE IF EXISTS artifact_sections CASCADE;
DROP TABLE IF EXISTS artifact_dependencies CASCADE;

-- User management (not implemented)
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_quotas CASCADE;

-- Financial tracking (not implemented)
DROP TABLE IF EXISTS budget_snapshots CASCADE;

-- File uploads (not implemented)
DROP TABLE IF EXISTS attachments CASCADE;

-- AI features (not implemented)
DROP TABLE IF EXISTS circuit_verifications CASCADE;
DROP TABLE IF EXISTS datasheet_analyses CASCADE;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- After running, verify tables are gone:
/*
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles', 'user_quotas', 'artifact_sections', 
    'artifact_dependencies', 'budget_snapshots', 
    'attachments', 'message_feedback', 'agent_executions',
    'error_logs', 'circuit_verifications', 'datasheet_analyses'
);
*/

-- Expected result: 0 rows (all tables dropped)

-- ============================================
-- REMAINING TABLES (should be 10-11)
-- ============================================
/*
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
*/

-- Expected tables:
-- 1. artifacts
-- 2. artifact_versions
-- 3. chats
-- 4. chat_sessions
-- 5. component_templates
-- 6. diagram_cache
-- 7. diagram_queue
-- 8. messages
-- 9. projects
-- 10. approval_gates (investigate before dropping)
-- 11. parts (decide: keep or drop)
-- 12. connections (decide: keep or drop)
