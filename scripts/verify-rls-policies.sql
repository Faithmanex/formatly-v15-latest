-- New script to verify Row Level Security is enabled and policies exist

-- Check if RLS is enabled on critical tables
DO $$
DECLARE
  table_record RECORD;
  missing_rls TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check each critical table for RLS
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'documents', 'subscriptions', 'notifications', 'user_preferences', 'formatting_styles')
  LOOP
    -- Check if RLS is enabled
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = table_record.tablename 
      AND rowsecurity = true
    ) THEN
      missing_rls := array_append(missing_rls, table_record.tablename);
      RAISE WARNING 'RLS NOT ENABLED on table: %', table_record.tablename;
    ELSE
      RAISE NOTICE 'RLS enabled on table: %', table_record.tablename;
    END IF;
  END LOOP;

  -- Report results
  IF array_length(missing_rls, 1) > 0 THEN
    RAISE EXCEPTION 'SECURITY ALERT: RLS not enabled on tables: %', array_to_string(missing_rls, ', ');
  ELSE
    RAISE NOTICE 'SUCCESS: RLS is enabled on all critical tables';
  END IF;
END $$;

-- Verify policies exist for each table
DO $$
DECLARE
  table_record RECORD;
  policy_count INTEGER;
  tables_without_policies TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'documents', 'subscriptions', 'notifications', 'user_preferences', 'formatting_styles')
  LOOP
    -- Count policies for this table
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = table_record.tablename;

    IF policy_count = 0 THEN
      tables_without_policies := array_append(tables_without_policies, table_record.tablename);
      RAISE WARNING 'NO POLICIES found for table: %', table_record.tablename;
    ELSE
      RAISE NOTICE 'Table % has % policies', table_record.tablename, policy_count;
    END IF;
  END LOOP;

  -- Report results
  IF array_length(tables_without_policies, 1) > 0 THEN
    RAISE EXCEPTION 'SECURITY ALERT: No RLS policies on tables: %', array_to_string(tables_without_policies, ', ');
  ELSE
    RAISE NOTICE 'SUCCESS: All critical tables have RLS policies';
  END IF;
END $$;

-- List all RLS policies for audit
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify user_id columns exist for RLS filtering
DO $$
DECLARE
  table_record RECORD;
  missing_user_id TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('documents', 'subscriptions', 'notifications', 'user_preferences')
  LOOP
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = table_record.tablename 
      AND column_name = 'user_id'
    ) THEN
      missing_user_id := array_append(missing_user_id, table_record.tablename);
      RAISE WARNING 'NO user_id column in table: %', table_record.tablename;
    END IF;
  END LOOP;

  IF array_length(missing_user_id, 1) > 0 THEN
    RAISE EXCEPTION 'SECURITY ALERT: Missing user_id column in tables: %', array_to_string(missing_user_id, ', ');
  ELSE
    RAISE NOTICE 'SUCCESS: All user-scoped tables have user_id column';
  END IF;
END $$;

-- Test RLS by attempting to query as different users (simulation)
-- This would need to be run with actual user contexts in production
RAISE NOTICE 'RLS VERIFICATION COMPLETE - Review warnings and exceptions above';
