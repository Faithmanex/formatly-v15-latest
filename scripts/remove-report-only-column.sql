-- Migration: Remove report_only column from documents table
-- Date: 2025-01-19
-- Description: This migration removes the deprecated report_only column and its associated index
--              as the application now uses tracked_changes as the primary feature instead of report-only mode.

-- Drop the index first (if it exists)
DROP INDEX IF EXISTS idx_documents_report_only;

-- Drop the report_only column from documents table
ALTER TABLE public.documents 
DROP COLUMN IF EXISTS report_only;

-- Add comment to document the change
COMMENT ON TABLE public.documents IS 'Documents table - Updated to remove report_only column in favor of tracked_changes feature';

-- Verify the column has been removed (this will fail if column still exists, which is good for validation)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'report_only'
    ) THEN
        RAISE EXCEPTION 'Migration failed: report_only column still exists';
    ELSE
        RAISE NOTICE 'Migration successful: report_only column has been removed';
    END IF;
END $$;
