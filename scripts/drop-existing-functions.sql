-- Drop existing functions that conflict with new implementation
-- This must be run before create-usage-tracking-functions.sql

-- Drop the existing get_user_usage_stats function
DROP FUNCTION IF EXISTS get_user_usage_stats(uuid);

-- Drop other potentially conflicting functions
DROP FUNCTION IF EXISTS increment_document_usage(uuid);
DROP FUNCTION IF EXISTS update_storage_usage(uuid, numeric);
DROP FUNCTION IF EXISTS increment_api_usage(uuid);
DROP FUNCTION IF EXISTS check_usage_limits(uuid);

-- Drop any functions related to the old subscription_usage table approach
DROP FUNCTION IF EXISTS create_subscription_usage_record(uuid);
DROP FUNCTION IF EXISTS get_subscription_usage_stats(uuid);

-- Clean up any existing triggers that might reference old functions
DROP TRIGGER IF EXISTS update_usage_stats_trigger ON profiles;
DROP TRIGGER IF EXISTS subscription_usage_trigger ON subscription_usage;

COMMIT;
