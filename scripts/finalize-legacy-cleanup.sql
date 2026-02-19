-- Final cleanup script to remove any remaining legacy table references
-- This script should be run after the main cleanup script to ensure complete removal

-- Drop any remaining legacy views or functions that reference old tables
DROP VIEW IF EXISTS public.legacy_usage_stats CASCADE;
DROP VIEW IF EXISTS public.user_plan_assignments CASCADE;

-- Drop any remaining legacy functions that reference old tables
DROP FUNCTION IF EXISTS public.get_or_create_unified_usage(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.reset_usage_for_plan_change(uuid, uuid, uuid, text) CASCADE;

-- Update any remaining database functions to use new table structure
-- These functions should now use subscription_usage instead of unified_usage_tracking

-- Verify that legacy tables are completely removed
DO $$
BEGIN
    -- Check if legacy tables still exist and drop them
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_usage_tracking') THEN
        DROP TABLE public.unified_usage_tracking CASCADE;
        RAISE NOTICE 'Dropped remaining unified_usage_tracking table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legacy_usage_stats') THEN
        DROP TABLE public.legacy_usage_stats CASCADE;
        RAISE NOTICE 'Dropped remaining legacy_usage_stats table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_plan_assignments') THEN
        DROP TABLE public.user_plan_assignments CASCADE;
        RAISE NOTICE 'Dropped remaining user_plan_assignments table';
    END IF;
    
    RAISE NOTICE 'Legacy table cleanup completed successfully';
END $$;

-- Add final verification query
SELECT 
    'Legacy tables cleanup verification' as status,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name IN ('unified_usage_tracking', 'legacy_usage_stats', 'user_plan_assignments'))
        THEN 'SUCCESS: All legacy tables removed'
        ELSE 'WARNING: Some legacy tables may still exist'
    END as result;
