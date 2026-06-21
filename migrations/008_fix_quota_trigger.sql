-- ============================================
-- Migration 008: Fix User Quota Trigger
-- ============================================
-- Problem: check_user_quota() function references dropped user_quotas table
-- Solution: Drop the obsolete trigger and function
-- ============================================

BEGIN;

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_check_quota ON messages;

-- Drop the function
DROP FUNCTION IF EXISTS check_user_quota();

-- Log the cleanup
DO $$
BEGIN
    RAISE NOTICE 'Cleaned up obsolete quota check trigger and function';
    RAISE NOTICE 'user_quotas table was already dropped in migration 002';
END $$;

COMMIT;
