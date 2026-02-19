-- Migration script to update documents table schema
-- 1. Adds tracked_changes column (boolean, default false)
-- 2. Removes headings_count and references_count columns
-- 3. Removes report_only column if it still exists

BEGIN;

-- Add tracked_changes column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'tracked_changes') THEN
        ALTER TABLE documents ADD COLUMN tracked_changes BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Drop headings_count column if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'headings_count') THEN
        ALTER TABLE documents DROP COLUMN headings_count;
    END IF;
END $$;

-- Drop references_count column if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'references_count') THEN
        ALTER TABLE documents DROP COLUMN references_count;
    END IF;
END $$;

-- Drop report_only column if it exists (cleanup)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'report_only') THEN
        ALTER TABLE documents DROP COLUMN report_only;
    END IF;
END $$;

COMMIT;

-- Verify changes
SELECT 
    column_name, 
    data_type, 
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'documents' 
    AND column_name IN ('tracked_changes', 'headings_count', 'references_count', 'report_only');
