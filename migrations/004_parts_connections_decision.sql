-- ============================================
-- DECISION: parts & connections tables
-- ============================================
-- These tables exist but are bypassed - data stored in JSON instead
-- You need to choose ONE pattern, not maintain both
-- ============================================

-- ============================================
-- CURRENT STATE
-- ============================================
-- ✅ BOM data: stored in artifact_versions.content_json (ACTIVE)
-- ❌ parts table: exists, has insert function, but NEVER CALLED (0 rows)
--
-- ✅ Wiring data: stored in artifact_versions.content_json (ACTIVE)  
-- ❌ connections table: exists but NEVER USED (0 rows)

-- ============================================
-- OPTION A: Keep JSON-only (recommended for MVP)
-- ============================================
-- Pros: 
--   - Already working
--   - Simpler codebase
--   - Faster development
--   - No schema changes needed when adding BOM fields
--
-- Cons:
--   - Cannot query "all projects using ESP32" without parsing JSON
--   - Cannot aggregate costs across projects
--   - Cannot build parts inventory system
--
-- ⚠️ DECISION POINT: Uncomment ONLY if you choose Option A
--
-- DROP TABLE IF EXISTS parts CASCADE;
-- DROP TABLE IF EXISTS connections CASCADE;
--
-- Also remove from lib/db/components.ts:
-- async addPartToProject() // DELETE THIS FUNCTION

-- ============================================
-- OPTION B: Migrate to relational (if you need queries)
-- ============================================
-- Pros:
--   - Can query parts across projects
--   - Can build inventory/procurement features
--   - Can validate part compatibility
--   - Better for multi-project analytics
--
-- Cons:
--   - Need to write migration logic
--   - Need to maintain sync between JSON and tables
--   - More complex codebase
--
-- Action: KEEP tables, write migration, update code

/*
-- If choosing Option B, you'll need:

-- 1. Add RLS policies for parts and connections
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view parts from own projects" ON parts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = parts.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- (Similar policies for INSERT, UPDATE, DELETE)
-- (Repeat for connections table)

-- 2. Write sync function to populate from JSON
CREATE OR REPLACE FUNCTION sync_parts_from_artifact(artifact_version_id UUID)
RETURNS void AS $$
DECLARE
  v_artifact_id UUID;
  v_project_id UUID;
  part_record JSONB;
BEGIN
  -- Get artifact and project IDs
  SELECT a.id, a.project_id INTO v_artifact_id, v_project_id
  FROM artifact_versions av
  JOIN artifacts a ON a.id = av.artifact_id
  WHERE av.id = artifact_version_id;
  
  -- Delete existing parts for this artifact
  DELETE FROM parts WHERE artifact_id = v_artifact_id;
  
  -- Insert parts from JSON
  FOR part_record IN 
    SELECT jsonb_array_elements(content_json->'parts')
    FROM artifact_versions
    WHERE id = artifact_version_id
  LOOP
    INSERT INTO parts (
      project_id, artifact_id, name, part_number, 
      category, quantity, price, supplier
    ) VALUES (
      v_project_id,
      v_artifact_id,
      part_record->>'name',
      part_record->>'part_number',
      part_record->>'category',
      (part_record->>'quantity')::int,
      (part_record->>'price')::numeric,
      part_record->>'supplier'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Update artifact creation code to call sync function
-- (In lib/db/artifacts.ts after createVersion)
-- await supabase.rpc('sync_parts_from_artifact', { artifact_version_id: version.id })
*/

-- ============================================
-- RECOMMENDED CHOICE: Option A (Drop tables)
-- ============================================
-- Unless you have a specific need for cross-project part queries,
-- stick with JSON storage. It's working, it's simple, and you can
-- always migrate later if needed. YAGNI principle.

-- When to reconsider Option B:
-- - Need to build a parts inventory system
-- - Need to track part usage across projects
-- - Need to generate procurement reports
-- - Need to suggest alternative parts based on usage patterns
-- - Have >100 projects and need analytics
