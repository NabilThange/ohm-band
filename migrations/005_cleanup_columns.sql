-- ============================================
-- MIGRATION 005: CLEANUP UNUSED COLUMNS
-- ============================================
-- Description: Remove unused columns from active tables
-- Risk: LOW - these columns have no queries against them
-- Prerequisite: Must test all previous migrations first
-- ============================================

-- ============================================
-- MESSAGES TABLE CLEANUP
-- ============================================

-- Re-add/Keep agent_model (used in seeds and typescript definitions)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS agent_model TEXT;

-- Remove intent (always 'FALLBACK', never used for routing)
-- ⚠️ STOP: Run this query FIRST before dropping:
--    SELECT DISTINCT intent, COUNT(*) FROM messages GROUP BY intent;
-- If you see values other than 'FALLBACK', investigate why before dropping!
-- This might indicate broken intent classification, not unused column.
-- Uncomment below only after verifying:
-- ALTER TABLE messages DROP COLUMN IF EXISTS intent;

-- Remove created_artifact_ids (array never read back, use FK from artifacts instead)
ALTER TABLE messages DROP COLUMN IF EXISTS created_artifact_ids;

-- ============================================
-- ARTIFACT_VERSIONS TABLE CLEANUP
-- ============================================

-- Re-add/Keep diagram_svg (actively used by frontend/scripts for SVG schematics)
ALTER TABLE artifact_versions ADD COLUMN IF NOT EXISTS diagram_svg TEXT;

-- Remove diagram_metadata (never queried)
ALTER TABLE artifact_versions DROP COLUMN IF EXISTS diagram_metadata;

-- Remove file_path (rarely set, filename is sufficient)
ALTER TABLE artifact_versions DROP COLUMN IF EXISTS file_path;

-- ============================================
-- PROJECTS TABLE CLEANUP
-- ============================================

-- Remove location (never set in seeds, no UI for it)
ALTER TABLE projects DROP COLUMN IF EXISTS location;

-- ============================================
-- ADD MISSING COLUMN
-- ============================================

-- Add updated_at to chats (other tables have it, this one doesn't)
ALTER TABLE chats ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to auto-update it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check messages columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Should NOT see: intent, created_artifact_ids (agent_model is preserved)

-- Check artifact_versions columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'artifact_versions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Should NOT see: diagram_metadata, file_path (diagram_svg is preserved)

-- Check projects columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Should NOT see: location

-- Check chats has updated_at
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chats' 
AND column_name = 'updated_at';

-- Should see: updated_at | timestamp with time zone
