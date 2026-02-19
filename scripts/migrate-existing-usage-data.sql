-- Updated migration script to work with new subscription_usage table instead of user_plan_usage
-- Migrate existing usage data from profiles table to subscription_usage table
-- This script migrates documents_used from profiles to the new subscription-specific tracking

-- Create a temporary function to handle the migration
CREATE OR REPLACE FUNCTION migrate_existing_usage_data()
RETURNS TABLE (
  migrated_users integer,
  skipped_users integer,
  error_count integer,
  migration_summary text
) AS $$
DECLARE
  user_record RECORD;
  current_subscription RECORD;
  migrated_count integer := 0;
  skipped_count integer := 0;
  error_count integer := 0;
  free_plan_id uuid;
BEGIN
  -- Get the free plan ID (assuming there's a free plan)
  SELECT id INTO free_plan_id 
  FROM subscription_plans 
  WHERE LOWER(name) LIKE '%free%' 
  ORDER BY price_monthly ASC 
  LIMIT 1;

  -- If no free plan exists, create a default one for migration purposes
  IF free_plan_id IS NULL THEN
    INSERT INTO subscription_plans (
      name, 
      description, 
      price_monthly, 
      price_yearly, 
      currency, 
      features, 
      document_limit, 
      api_calls_limit, 
      storage_limit_gb,
      priority_support,
      custom_styles,
      team_collaboration,
      is_popular,
      is_active,
      billing_cycles
    ) VALUES (
      'Free',
      'Basic free plan for migration',
      0,
      0,
      'USD',
      ARRAY['Basic document formatting'],
      5,
      100,
      1,
      false,
      false,
      false,
      false,
      true,
      ARRAY['monthly']
    ) RETURNING id INTO free_plan_id;
  END IF;

  -- Loop through all profiles with document usage
  FOR user_record IN 
    SELECT id, documents_used, created_at
    FROM profiles 
    WHERE documents_used > 0
  LOOP
    BEGIN
      -- Check if user already has subscription usage data
      IF EXISTS (
        SELECT 1 FROM subscription_usage 
        WHERE user_id = user_record.id
      ) THEN
        skipped_count := skipped_count + 1;
        CONTINUE;
      END IF;

      -- Get user's current active subscription
      SELECT s.id as subscription_id, s.plan_id, s.current_period_start, s.current_period_end, s.created_at as subscription_created_at
      INTO current_subscription
      FROM subscriptions s
      WHERE s.user_id = user_record.id 
        AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1;

      -- If user has an active subscription, migrate to that subscription
      IF current_subscription.subscription_id IS NOT NULL THEN
        INSERT INTO subscription_usage (
          user_id,
          subscription_id,
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
        ) VALUES (
          user_record.id,
          current_subscription.subscription_id,
          current_subscription.plan_id,
          user_record.documents_used,
          0,
          0.00,
          current_subscription.current_period_start,
          current_subscription.current_period_end,
          COALESCE(current_subscription.subscription_created_at, user_record.created_at),
          'migration',
          user_record.created_at,
          now()
        );
      ELSE
        -- User has no active subscription, create a free subscription and migrate
        INSERT INTO subscriptions (
          user_id,
          plan_id,
          status,
          billing_cycle,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          created_at,
          updated_at
        ) VALUES (
          user_record.id,
          free_plan_id,
          'active',
          'yearly',
          user_record.created_at,
          user_record.created_at + INTERVAL '1 year',
          false,
          user_record.created_at,
          now()
        );
        
        -- Get the newly created subscription ID
        SELECT id INTO current_subscription.subscription_id
        FROM subscriptions
        WHERE user_id = user_record.id AND plan_id = free_plan_id
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- Create usage record for the new subscription
        INSERT INTO subscription_usage (
          user_id,
          subscription_id,
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
        ) VALUES (
          user_record.id,
          current_subscription.subscription_id,
          free_plan_id,
          user_record.documents_used,
          0,
          0.00,
          user_record.created_at,
          user_record.created_at + INTERVAL '1 year',
          user_record.created_at,
          'migration',
          user_record.created_at,
          now()
        );
      END IF;

      migrated_count := migrated_count + 1;

    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      -- Log the error but continue with other users
      RAISE NOTICE 'Error migrating user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;

  -- Return migration summary
  RETURN QUERY SELECT 
    migrated_count,
    skipped_count,
    error_count,
    format('Migration completed: %s users migrated, %s skipped, %s errors', 
           migrated_count, skipped_count, error_count);
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT * FROM migrate_existing_usage_data();

-- Create a verification query to check migration results
CREATE OR REPLACE FUNCTION verify_usage_migration()
RETURNS TABLE (
  total_profiles_with_usage bigint,
  total_subscription_usage_records bigint,
  users_with_both_records bigint,
  users_missing_subscription_usage bigint,
  verification_status text
) AS $$
DECLARE
  profiles_count bigint;
  subscription_usage_count bigint;
  both_records_count bigint;
  missing_count bigint;
BEGIN
  -- Count profiles with usage
  SELECT COUNT(*) INTO profiles_count
  FROM profiles 
  WHERE documents_used > 0;

  -- Count subscription usage records
  SELECT COUNT(*) INTO subscription_usage_count
  FROM subscription_usage;

  -- Count users who have both profile usage and subscription usage
  SELECT COUNT(*) INTO both_records_count
  FROM profiles p
  INNER JOIN subscription_usage su ON p.id = su.user_id
  WHERE p.documents_used > 0;

  -- Count users with profile usage but no subscription usage
  SELECT COUNT(*) INTO missing_count
  FROM profiles p
  LEFT JOIN subscription_usage su ON p.id = su.user_id
  WHERE p.documents_used > 0 AND su.user_id IS NULL;

  RETURN QUERY SELECT 
    profiles_count,
    subscription_usage_count,
    both_records_count,
    missing_count,
    CASE 
      WHEN missing_count = 0 THEN 'Migration successful - all users migrated'
      WHEN missing_count > 0 THEN format('Migration incomplete - %s users missing subscription usage', missing_count)
      ELSE 'Migration status unknown'
    END;
END;
$$ LANGUAGE plpgsql;

-- Run verification
SELECT * FROM verify_usage_migration();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION migrate_existing_usage_data() TO authenticated;
GRANT EXECUTE ON FUNCTION verify_usage_migration() TO authenticated;

-- Final verification and summary
DO $$
DECLARE
  verification_result RECORD;
BEGIN
  SELECT * INTO verification_result FROM verify_usage_migration();
  
  RAISE NOTICE '=== MIGRATION SUMMARY ===';
  RAISE NOTICE 'Profiles with usage: %', verification_result.total_profiles_with_usage;
  RAISE NOTICE 'Subscription usage records: %', verification_result.total_subscription_usage_records;
  RAISE NOTICE 'Successfully migrated: %', verification_result.users_with_both_records;
  RAISE NOTICE 'Missing subscription usage: %', verification_result.users_missing_subscription_usage;
  RAISE NOTICE 'Status: %', verification_result.verification_status;
  RAISE NOTICE '========================';
END $$;
