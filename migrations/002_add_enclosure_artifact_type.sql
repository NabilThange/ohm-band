-- Migration: Add enclosure artifact type
-- Phase: 1a (safe, additive only)
-- Date: 2025-01-XX

-- The artifacts table has a CHECK constraint that validates the type column
-- We need to drop the old constraint and create a new one that includes 'enclosure'

-- Drop existing check constraint
ALTER TABLE artifacts DROP CONSTRAINT IF EXISTS artifacts_type_check;

-- Add new constraint with 'enclosure' included
ALTER TABLE artifacts ADD CONSTRAINT artifacts_type_check 
  CHECK (type IN (
    'context', 
    'mvp', 
    'prd', 
    'bom', 
    'budget', 
    'wiring', 
    'code', 
    'circuit', 
    'conversation_summary',
    'enclosure'
  ));
