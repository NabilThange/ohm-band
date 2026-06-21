-- ============================================
-- MIGRATION 001: RLS POLICIES
-- CRITICAL SECURITY FIX - Apply this FIRST
-- ============================================
-- Description: Enable Row Level Security on core tables with full CRUD policies
-- Risk: HIGH if misconfigured - test thoroughly before production
-- Rollback: See rollback section at bottom
-- ============================================

-- ============================================
-- CHATS TABLE
-- ============================================

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own chats
CREATE POLICY "Users can view own chats" ON chats
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create chats for themselves
CREATE POLICY "Users can insert own chats" ON chats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own chats
CREATE POLICY "Users can update own chats" ON chats
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own chats
CREATE POLICY "Users can delete own chats" ON chats
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view messages from their chats
CREATE POLICY "Users can view messages from own chats" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- INSERT: Users can insert messages into their chats
CREATE POLICY "Users can insert messages into own chats" ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update messages in their chats
CREATE POLICY "Users can update messages in own chats" ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete messages from their chats
CREATE POLICY "Users can delete messages from own chats" ON messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- ============================================
-- CHAT_SESSIONS TABLE
-- ============================================

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view sessions from their chats
CREATE POLICY "Users can view sessions from own chats" ON chat_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_sessions.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- INSERT: Users can insert sessions for their chats
CREATE POLICY "Users can insert sessions for own chats" ON chat_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_sessions.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update sessions for their chats
CREATE POLICY "Users can update sessions for own chats" ON chat_sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_sessions.chat_id 
      AND chats.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_sessions.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete sessions for their chats
CREATE POLICY "Users can delete sessions for own chats" ON chat_sessions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_sessions.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- ============================================
-- PROJECTS TABLE
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create projects for themselves
CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own projects
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own projects
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ARTIFACTS TABLE
-- ============================================

ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view artifacts from their chats
CREATE POLICY "Users can view artifacts from own chats" ON artifacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = artifacts.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- INSERT: Users can insert artifacts into their chats
CREATE POLICY "Users can insert artifacts into own chats" ON artifacts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = artifacts.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update artifacts in their chats
CREATE POLICY "Users can update artifacts in own chats" ON artifacts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = artifacts.chat_id 
      AND chats.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = artifacts.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete artifacts from their chats
CREATE POLICY "Users can delete artifacts from own chats" ON artifacts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = artifacts.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- ============================================
-- ARTIFACT_VERSIONS TABLE
-- ============================================

ALTER TABLE artifact_versions ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view versions from artifacts in their chats
CREATE POLICY "Users can view versions from own artifacts" ON artifact_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM artifacts 
      JOIN chats ON chats.id = artifacts.chat_id
      WHERE artifacts.id = artifact_versions.artifact_id
      AND chats.user_id = auth.uid()
    )
  );

-- INSERT: Users can insert versions for their artifacts
CREATE POLICY "Users can insert versions for own artifacts" ON artifact_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM artifacts 
      JOIN chats ON chats.id = artifacts.chat_id
      WHERE artifacts.id = artifact_versions.artifact_id
      AND chats.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update versions of their artifacts
CREATE POLICY "Users can update versions of own artifacts" ON artifact_versions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM artifacts 
      JOIN chats ON chats.id = artifacts.chat_id
      WHERE artifacts.id = artifact_versions.artifact_id
      AND chats.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM artifacts 
      JOIN chats ON chats.id = artifacts.chat_id
      WHERE artifacts.id = artifact_versions.artifact_id
      AND chats.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete versions of their artifacts
CREATE POLICY "Users can delete versions of own artifacts" ON artifact_versions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM artifacts 
      JOIN chats ON chats.id = artifacts.chat_id
      WHERE artifacts.id = artifact_versions.artifact_id
      AND chats.user_id = auth.uid()
    )
  );

-- ============================================
-- DIAGRAM_QUEUE TABLE
-- ============================================

ALTER TABLE diagram_queue ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view queue entries from their chats
CREATE POLICY "Users can view queue entries from own chats" ON diagram_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = diagram_queue.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- INSERT: Users can insert queue entries for their chats
CREATE POLICY "Users can insert queue entries for own chats" ON diagram_queue
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = diagram_queue.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- UPDATE: Cron jobs need to update queue status (service_role bypass)
-- Users can update queue entries from their chats
CREATE POLICY "Users can update queue entries from own chats" ON diagram_queue
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = diagram_queue.chat_id 
      AND chats.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = diagram_queue.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete queue entries from their chats
CREATE POLICY "Users can delete queue entries from own chats" ON diagram_queue
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = diagram_queue.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- ============================================
-- DIAGRAM_CACHE TABLE (Public Read, Service Write)
-- ============================================

ALTER TABLE diagram_cache ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can read cache (diagrams are not user-specific)
CREATE POLICY "Anyone can read diagram cache" ON diagram_cache
  FOR SELECT
  USING (true);

-- INSERT: Only service_role can insert cache entries
-- (No user policy - handled by service_role in cron)

-- UPDATE: Only service_role can update cache statistics
-- (No user policy - handled by service_role in cron)

-- DELETE: Only service_role can cleanup old cache
-- (No user policy - handled by service_role in cron)

-- ============================================
-- COMPONENT_TEMPLATES TABLE (Public Read)
-- ============================================

ALTER TABLE component_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can read component catalog
CREATE POLICY "Anyone can read component templates" ON component_templates
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Only admins (handle via service_role or admin flag)
-- For now: no user-level write policies

-- ============================================
-- TESTING CHECKLIST
-- ============================================

-- BEFORE deploying to production:
-- [ ] Test: Create a new chat as logged-in user
-- [ ] Test: View chat list
-- [ ] Test: Send messages
-- [ ] Test: Update chat title
-- [ ] Test: Archive/unarchive chat
-- [ ] Test: Create artifacts (BOM, wiring, code)
-- [ ] Test: Create projects
-- [ ] Test: Diagram generation pipeline
-- [ ] Test: Cannot see other users' chats
-- [ ] Test: Cannot modify other users' data
-- [ ] Test: Component template search works
-- [ ] Test: Diagram cache reads work

-- ============================================
-- ROLLBACK (if something breaks)
-- ============================================
/*
-- Disable RLS on all tables
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE component_templates DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view own chats" ON chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON chats;

DROP POLICY IF EXISTS "Users can view messages from own chats" ON messages;
DROP POLICY IF EXISTS "Users can insert messages into own chats" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own chats" ON messages;
DROP POLICY IF EXISTS "Users can delete messages from own chats" ON messages;

DROP POLICY IF EXISTS "Users can view sessions from own chats" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert sessions for own chats" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update sessions for own chats" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete sessions for own chats" ON chat_sessions;

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

DROP POLICY IF EXISTS "Users can view artifacts from own chats" ON artifacts;
DROP POLICY IF EXISTS "Users can insert artifacts into own chats" ON artifacts;
DROP POLICY IF EXISTS "Users can update artifacts in own chats" ON artifacts;
DROP POLICY IF EXISTS "Users can delete artifacts from own chats" ON artifacts;

DROP POLICY IF EXISTS "Users can view versions from own artifacts" ON artifact_versions;
DROP POLICY IF EXISTS "Users can insert versions for own artifacts" ON artifact_versions;
DROP POLICY IF EXISTS "Users can update versions of own artifacts" ON artifact_versions;
DROP POLICY IF EXISTS "Users can delete versions of own artifacts" ON artifact_versions;

DROP POLICY IF EXISTS "Users can view queue entries from own chats" ON diagram_queue;
DROP POLICY IF EXISTS "Users can insert queue entries for own chats" ON diagram_queue;
DROP POLICY IF EXISTS "Users can update queue entries from own chats" ON diagram_queue;
DROP POLICY IF EXISTS "Users can delete queue entries from own chats" ON diagram_queue;

DROP POLICY IF EXISTS "Anyone can read diagram cache" ON diagram_cache;
DROP POLICY IF EXISTS "Anyone can read component templates" ON component_templates;
*/
