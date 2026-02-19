-- Create optimized functions for usage tracking and retrieval
-- These functions work directly with the subscriptions table usage columns

-- Function to get current usage for a user
CREATE OR REPLACE FUNCTION get_user_usage_stats(p_user_id UUID)
RETURNS TABLE(
    documents_processed INTEGER,
    api_calls_made INTEGER,
    storage_used_gb NUMERIC,
    document_limit INTEGER,
    api_calls_limit INTEGER,
    storage_limit_gb INTEGER,
    plan_name TEXT,
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end TIMESTAMP WITH TIME ZONE,
    usage_percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_subscription RECORD;
BEGIN
    -- Get current active subscription with usage data
    SELECT s.id, s.plan_id, s.current_period_start, s.current_period_end,
           s.documents_used, s.api_calls_used, s.storage_used_gb,
           sp.name, sp.document_limit, sp.api_calls_limit, sp.storage_limit_gb
    INTO current_subscription
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.user_id = p_user_id AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- Return zero usage if no subscription
        RETURN QUERY SELECT 0, 0, 0.00::NUMERIC, 0, 0, 0, 'No Plan'::TEXT, 
                           NOW()::TIMESTAMP WITH TIME ZONE, NOW()::TIMESTAMP WITH TIME ZONE, 0.00::NUMERIC;
        RETURN;
    END IF;
    
    -- Calculate usage percentage based on document limit
    RETURN QUERY SELECT 
        COALESCE(current_subscription.documents_used, 0),
        COALESCE(current_subscription.api_calls_used, 0),
        COALESCE(current_subscription.storage_used_gb, 0.00),
        current_subscription.document_limit,
        current_subscription.api_calls_limit,
        current_subscription.storage_limit_gb,
        current_subscription.name,
        current_subscription.current_period_start,
        current_subscription.current_period_end,
        CASE 
            WHEN current_subscription.document_limit > 0 THEN
                ROUND((COALESCE(current_subscription.documents_used, 0)::NUMERIC / current_subscription.document_limit::NUMERIC) * 100, 2)
            ELSE 0.00
        END;
END;
$$;

-- Function to increment document usage
CREATE OR REPLACE FUNCTION increment_document_usage(p_user_id UUID, p_increment INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the active subscription's document usage
    UPDATE subscriptions 
    SET documents_used = COALESCE(documents_used, 0) + p_increment,
        updated_at = NOW()
    WHERE user_id = p_user_id 
      AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active subscription found for user';
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to increment document usage: %', SQLERRM;
END;
$$;

-- Function to increment API usage
CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id UUID, p_increment INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the active subscription's API usage
    UPDATE subscriptions 
    SET api_calls_used = COALESCE(api_calls_used, 0) + p_increment,
        updated_at = NOW()
    WHERE user_id = p_user_id 
      AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active subscription found for user';
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to increment API usage: %', SQLERRM;
END;
$$;

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_storage_usage(p_user_id UUID, p_storage_gb NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the active subscription's storage usage
    UPDATE subscriptions 
    SET storage_used_gb = p_storage_gb,
        updated_at = NOW()
    WHERE user_id = p_user_id 
      AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active subscription found for user';
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to update storage usage: %', SQLERRM;
END;
$$;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limits(p_user_id UUID)
RETURNS TABLE(
    documents_at_limit BOOLEAN,
    api_calls_at_limit BOOLEAN,
    storage_at_limit BOOLEAN,
    current_usage JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usage_stats RECORD;
BEGIN
    -- Get current usage stats
    SELECT * INTO usage_stats
    FROM get_user_usage_stats(p_user_id)
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT TRUE, TRUE, TRUE, '{}'::JSONB;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT
        (usage_stats.document_limit > 0 AND usage_stats.documents_processed >= usage_stats.document_limit),
        (usage_stats.api_calls_limit > 0 AND usage_stats.api_calls_made >= usage_stats.api_calls_limit),
        (usage_stats.storage_limit_gb > 0 AND usage_stats.storage_used_gb >= usage_stats.storage_limit_gb),
        jsonb_build_object(
            'documents_used', usage_stats.documents_processed,
            'document_limit', usage_stats.document_limit,
            'api_calls_made', usage_stats.api_calls_made,
            'api_calls_limit', usage_stats.api_calls_limit,
            'storage_used_gb', usage_stats.storage_used_gb,
            'storage_limit_gb', usage_stats.storage_limit_gb,
            'plan_name', usage_stats.plan_name,
            'usage_percentage', usage_stats.usage_percentage
        );
END;
$$;

-- Function to reset usage for new billing period
CREATE OR REPLACE FUNCTION reset_usage_for_billing_period(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Reset usage counters for the active subscription
    UPDATE subscriptions 
    SET documents_used = 0,
        api_calls_used = 0,
        storage_used_gb = 0.00,
        updated_at = NOW()
    WHERE user_id = p_user_id 
      AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active subscription found for user';
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to reset usage: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_usage_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_document_usage(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_api_usage(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_storage_usage(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_usage_for_billing_period(UUID) TO authenticated;
