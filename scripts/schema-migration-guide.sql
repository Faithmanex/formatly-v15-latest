-- =====================================================
-- SCHEMA MIGRATION GUIDE
-- Instructions for migrating from old schema to optimized unified schema
-- =====================================================

-- STEP 1: Run the consolidated optimized schema
-- This will create the new unified_usage_tracking table and functions
-- File: scripts/consolidated-optimized-schema.sql

-- STEP 2: Migrate existing data (OPTIONAL - for production systems)
-- This preserves existing usage data by migrating it to the new unified system

-- Migrate data from old usage_stats table (if it exists)
INSERT INTO public.unified_usage_tracking (
  user_id, 
  plan_id, 
  documents_processed, 
  api_calls_made, 
  storage_used_gb,
  billing_period_start,
  billing_period_end,
  reset_reason,
  created_at,
  updated_at
)
SELECT 
  us.user_id,
  COALESCE(s.plan_id, (SELECT id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1)) as plan_id,
  us.documents_processed,
  us.api_calls_made,
  us.storage_used_gb,
  us.period_start::timestamp with time zone,
  us.period_end::timestamp with time zone,
  'data_migration' as reset_reason,
  us.created_at,
  us.updated_at
FROM public.usage_stats us
LEFT JOIN public.subscriptions s ON s.user_id = us.user_id AND s.status = 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.unified_usage_tracking uut 
  WHERE uut.user_id = us.user_id 
    AND uut.billing_period_start = us.period_start::timestamp with time zone
    AND uut.billing_period_end = us.period_end::timestamp with time zone
)
ON CONFLICT (user_id, plan_id, billing_period_start, billing_period_end) DO NOTHING;

-- Migrate data from old user_plan_usage table (if it exists)
INSERT INTO public.unified_usage_tracking (
  user_id, 
  plan_id, 
  documents_processed, 
  api_calls_made, 
  storage_used_gb,
  billing_period_start,
  billing_period_end,
  last_reset_date,
  reset_reason,
  created_at,
  updated_at
)
SELECT 
  upu.user_id,
  upu.plan_id,
  upu.documents_used,
  0 as api_calls_made,
  0.00 as storage_used_gb,
  COALESCE(s.current_period_start, date_trunc('month', CURRENT_TIMESTAMP)) as billing_period_start,
  COALESCE(s.current_period_end, date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month - 1 second') as billing_period_end,
  upu.last_reset_date,
  'plan_migration' as reset_reason,
  upu.created_at,
  upu.updated_at
FROM public.user_plan_usage upu
LEFT JOIN public.subscriptions s ON s.user_id = upu.user_id AND s.plan_id = upu.plan_id AND s.status = 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.unified_usage_tracking uut 
  WHERE uut.user_id = upu.user_id 
    AND uut.plan_id = upu.plan_id
    AND uut.billing_period_start >= date_trunc('month', CURRENT_TIMESTAMP)
)
ON CONFLICT (user_id, plan_id, billing_period_start, billing_period_end) DO NOTHING;

-- STEP 3: Verify migration (OPTIONAL)
-- Check that data was migrated correctly
SELECT 
  'unified_usage_tracking' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(billing_period_start) as earliest_period,
  MAX(billing_period_end) as latest_period
FROM public.unified_usage_tracking

UNION ALL

SELECT 
  'legacy_usage_stats_view' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(period_start::timestamp with time zone) as earliest_period,
  MAX(period_end::timestamp with time zone) as latest_period
FROM public.legacy_usage_stats;

-- STEP 4: Update application code
-- The lib/database.ts file has been updated to use the new unified functions
-- All existing API calls will continue to work through the updated service functions

-- STEP 5: Clean up old tables (ONLY AFTER CONFIRMING MIGRATION SUCCESS)
-- WARNING: This will permanently delete old data. Only run after thorough testing.

-- DROP TABLE IF EXISTS public.usage_stats CASCADE;
-- DROP TABLE IF EXISTS public.usage_tracking CASCADE;
-- DROP TABLE IF EXISTS public.user_plan_usage CASCADE;

-- STEP 6: Performance optimization
-- The new schema includes optimized indexes, but you may want to analyze performance
ANALYZE public.unified_usage_tracking;
ANALYZE public.subscriptions;
ANALYZE public.subscription_plans;

-- Create additional indexes if needed for your specific query patterns
-- CREATE INDEX IF NOT EXISTS idx_unified_usage_recent 
--   ON public.unified_usage_tracking (user_id, billing_period_end DESC) 
--   WHERE billing_period_end > CURRENT_TIMESTAMP - interval '3 months';

-- BENEFITS OF THE NEW UNIFIED SCHEMA:
-- 1. Single source of truth for all usage tracking
-- 2. Plan-specific usage tracking prevents gaming
-- 3. Billing period awareness for accurate resets
-- 4. Better performance with optimized indexes
-- 5. Comprehensive audit trail with reset reasons
-- 6. Backward compatibility through legacy views
-- 7. Enhanced security with proper RLS policies
