-- Update subscriptions table to track usage metrics per user subscription
-- Adding usage tracking columns to subscriptions table instead of separate table

-- First, let's see the current subscriptions table structure and add usage columns
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS documents_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS api_calls_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_used_gb DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_usage_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better performance on usage queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_usage ON subscriptions(user_id, documents_used, api_calls_used);

-- Create function to track document usage
CREATE OR REPLACE FUNCTION track_document_usage(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Update subscription usage
    UPDATE subscriptions 
    SET documents_used = documents_used + 1,
        updated_at = NOW()
    WHERE user_id = user_uuid 
    AND status = 'active';
    
    -- Also update profile for backward compatibility
    UPDATE profiles 
    SET documents_used = documents_used + 1,
        updated_at = NOW()
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track API usage
CREATE OR REPLACE FUNCTION track_api_usage(user_uuid UUID, calls_count INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE subscriptions 
    SET api_calls_used = api_calls_used + calls_count,
        updated_at = NOW()
    WHERE user_id = user_uuid 
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track storage usage
CREATE OR REPLACE FUNCTION track_storage_usage(user_uuid UUID, storage_gb DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE subscriptions 
    SET storage_used_gb = storage_used_gb + storage_gb,
        updated_at = NOW()
    WHERE user_id = user_uuid 
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get comprehensive usage stats
CREATE OR REPLACE FUNCTION get_user_usage_stats(user_uuid UUID)
RETURNS TABLE (
    documents_used INTEGER,
    documents_limit INTEGER,
    api_calls_used INTEGER,
    api_calls_limit INTEGER,
    storage_used_gb DECIMAL,
    storage_limit_gb INTEGER,
    plan_name TEXT,
    billing_cycle TEXT,
    next_reset_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(s.documents_used, 0) as documents_used,
        COALESCE(sp.document_limit, 5) as documents_limit,
        COALESCE(s.api_calls_used, 0) as api_calls_used,
        COALESCE(sp.api_calls_limit, 100) as api_calls_limit,
        COALESCE(s.storage_used_gb, 0.00) as storage_used_gb,
        COALESCE(sp.storage_limit_gb, 1) as storage_limit_gb,
        COALESCE(sp.name, 'Free') as plan_name,
        COALESCE(s.billing_cycle, 'monthly') as billing_cycle,
        CASE 
            WHEN s.billing_cycle = 'yearly' THEN s.last_usage_reset + INTERVAL '1 year'
            ELSE s.last_usage_reset + INTERVAL '1 month'
        END as next_reset_date
    FROM profiles p
    LEFT JOIN subscriptions s ON p.id = s.user_id AND s.status = 'active'
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset usage counters (for billing cycle resets)
CREATE OR REPLACE FUNCTION reset_usage_counters(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE subscriptions 
    SET documents_used = 0,
        api_calls_used = 0,
        storage_used_gb = 0.00,
        last_usage_reset = NOW(),
        updated_at = NOW()
    WHERE user_id = user_uuid 
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migrate existing usage data from profiles to subscriptions
UPDATE subscriptions s
SET documents_used = p.documents_used
FROM profiles p
WHERE s.user_id = p.id 
AND s.status = 'active'
AND p.documents_used > 0;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION track_document_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_api_usage(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION track_storage_usage(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_usage_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_usage_counters(UUID) TO authenticated;
