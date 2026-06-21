-- ============================================
-- INVESTIGATION: approval_gates table
-- ============================================
-- This table is the ONLY one with RLS already enabled
-- That suggests active development, not dead code
-- ============================================

-- Check if there are any rows
SELECT COUNT(*) as row_count FROM approval_gates;

-- Check foreign key references
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name = 'approval_gates' OR ccu.table_name = 'approval_gates');

-- Check existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'approval_gates';

-- Table structure (psql meta-command replaced with SQL)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'approval_gates'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- DECISION TREE
-- ============================================
/*
IF row_count > 0 OR git history shows recent work on approval_gates:
    → KEEP the table, it's in active use
    
IF row_count = 0 AND no recent git history:
    → Check with team: is this a planned feature?
    → If yes: KEEP and document
    → If no: DROP with this migration:
*/

-- OPTIONAL: Drop approval_gates (only if confirmed unused)
-- DROP TABLE IF EXISTS approval_gates CASCADE;
