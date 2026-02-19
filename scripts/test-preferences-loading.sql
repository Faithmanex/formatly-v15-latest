-- Test script to diagnose preferences loading issues
-- This script checks database connectivity, table structure, and data integrity

-- Test 1: Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'custom_styles', 'documents', 'notifications')
ORDER BY table_name;

-- Test 2: Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Test 3: Check if formatting_preferences column exists and has proper structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'formatting_preferences';

-- Test 4: Check RLS policies on profiles table
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
  AND tablename = 'profiles';

-- Test 5: Test basic profile data access
SELECT 
  id,
  email,
  full_name,
  role,
  document_limit,
  documents_used,
  formatting_preferences IS NOT NULL as has_preferences,
  created_at,
  updated_at
FROM profiles 
LIMIT 5;

-- Test 6: Check custom_styles table
SELECT 
  COUNT(*) as total_styles,
  COUNT(CASE WHEN is_global = true THEN 1 END) as global_styles,
  COUNT(CASE WHEN is_default = true THEN 1 END) as default_styles
FROM custom_styles;

-- Test 7: Test the get_user_formatting_preferences function
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'get_user_formatting_preferences';

-- Test 8: Check for any database locks or long-running queries
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state != 'idle';

-- Test 9: Check database connection limits
SELECT 
  setting as max_connections,
  (SELECT count(*) FROM pg_stat_activity) as current_connections
FROM pg_settings 
WHERE name = 'max_connections';

-- Test 10: Test sample formatting preferences retrieval
DO $$
DECLARE
  test_user_id uuid;
  preferences_result jsonb;
BEGIN
  -- Get a sample user ID
  SELECT id INTO test_user_id FROM profiles LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test the function
    SELECT get_user_formatting_preferences(test_user_id) INTO preferences_result;
    
    RAISE NOTICE 'Test user ID: %', test_user_id;
    RAISE NOTICE 'Preferences result: %', preferences_result;
  ELSE
    RAISE NOTICE 'No users found in profiles table';
  END IF;
END $$;

-- Test 11: Check for any foreign key constraints that might cause issues
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('profiles', 'custom_styles', 'documents');

-- Test 12: Performance check - measure query execution time
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
  id,
  formatting_preferences
FROM profiles 
WHERE id = (SELECT id FROM profiles LIMIT 1);

-- Test 13: Check for any triggers that might slow down operations
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
  AND event_object_table IN ('profiles', 'custom_styles');

-- Summary report
SELECT 
  'Database Health Check Complete' as status,
  now() as checked_at;
