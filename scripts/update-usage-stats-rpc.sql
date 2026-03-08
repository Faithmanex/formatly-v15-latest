-- Drop the existing get_user_usage_stats function
DROP FUNCTION IF EXISTS public.get_user_usage_stats(UUID);

-- Function to get user usage statistics (billing source of truth)
CREATE OR REPLACE FUNCTION public.get_user_usage_stats(user_uuid UUID)
RETURNS TABLE (
    documents_used BIGINT,
    documents_limit INT,
    plan_name TEXT,
    usage_percentage NUMERIC,
    next_reset_date TIMESTAMPTZ,
    billing_cycle TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.documents_used::BIGINT,
        s.document_limit,
        p.name as plan_name,
        CASE 
            WHEN s.document_limit > 0 THEN ROUND((s.documents_used::FLOAT / s.document_limit * 100)::NUMERIC, 2)
            ELSE 0::NUMERIC
        END as usage_percentage,
        s.current_period_end,
        s.billing_cycle::TEXT
    FROM subscriptions s
    JOIN subscription_plans p ON s.plan_id = p.id
    WHERE s.user_id = user_uuid AND s.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_usage_stats(UUID) TO authenticated;

-- COMMENT ON FUNCTION
COMMENT ON FUNCTION public.get_user_usage_stats(UUID) IS 'Returns the current usage stats for a user based on their active subscription documents_used column.';
