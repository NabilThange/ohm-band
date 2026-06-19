-- Migration: Fix existing conversation_summary artifacts
-- This migrates data from the 'content' text field to 'content_json' jsonb field
-- Run this ONCE after deploying the code fixes

-- Step 1: Migrate existing summaries from content to content_json
UPDATE artifact_versions av
SET content_json = content::jsonb
WHERE content IS NOT NULL 
  AND content_json IS NULL
  AND artifact_id IN (
    SELECT id FROM artifacts WHERE type = 'conversation_summary'
  );

-- Step 2: Clear the old content field after migration (optional, keeps data clean)
-- Uncomment if you want to remove the text duplicates
-- UPDATE artifact_versions av
-- SET content = NULL
-- WHERE content_json IS NOT NULL
--   AND artifact_id IN (
--     SELECT id FROM artifacts WHERE type = 'conversation_summary'
--   );

-- Verification query - run this to confirm migration
SELECT 
  a.chat_id,
  av.version_number,
  av.content IS NOT NULL as has_text_content,
  av.content_json IS NOT NULL as has_json_content,
  av.created_at
FROM artifacts a
JOIN artifact_versions av ON a.id = av.artifact_id
WHERE a.type = 'conversation_summary'
ORDER BY a.created_at DESC, av.version_number ASC;
