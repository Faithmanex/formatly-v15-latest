-- Performance optimization script for unified usage tracking
-- This addresses timeout issues and adds proper indexes

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_unified_usage_user_plan 
ON unified_usage_tracking (user_id, plan_id);

CREATE INDEX IF NOT EXISTS idx_unified_usage_billing_period 
ON unified_usage_tracking (user_id, billing_period_start, billing_period_end);

CREATE INDEX IF NOT EXISTS idx_profiles_user_lookup 
ON profiles (id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
ON subscriptions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_lookup 
ON subscriptions (plan_id);

-- Drop existing functions before recreating them to avoid return type conflicts
DROP FUNCTION IF EXISTS get_user_usage_stats(UUID);
DROP FUNCTION IF EXISTS increment_document_usage(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_or_create_unified_usage(UUID, UUID);

-- Optimize the get_user_usage_stats function
CREATE OR REPLACE FUNCTION get_user_usage_stats(p_user_id UUID)
RETURNS TABLE (
  plan_id UUID,
  plan_name TEXT,
  document_limit INTEGER,
  documents_used INTEGER,
  remaining_documents INTEGER,
  usage_percentage NUMERIC,
  billing_period_start DATE,
  billing_period_end DATE,
  days_until_reset INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH current_subscription AS (
    SELECT s.plan_id, s.current_period_start, s.current_period_end
    FROM subscriptions s
    WHERE s.user_id = p_user_id 
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1
  ),
  plan_info AS (
    SELECT sp.id, sp.name, sp.document_limit
    FROM subscription_plans sp
    JOIN current_subscription cs ON sp.id = cs.plan_id
  ),
  usage_info AS (
    SELECT 
      COALESCE(uut.documents_processed, 0) as docs_used
    FROM current_subscription cs
    LEFT JOIN unified_usage_tracking uut ON (
      uut.user_id = p_user_id 
      AND uut.plan_id = cs.plan_id
      AND uut.billing_period_start = cs.current_period_start::DATE
    )
  )
  SELECT 
    pi.id,
    pi.name,
    pi.document_limit,
    ui.docs_used,
    CASE 
      WHEN pi.document_limit = -1 THEN -1
      ELSE GREATEST(0, pi.document_limit - ui.docs_used)
    END,
    CASE 
      WHEN pi.document_limit = -1 THEN 0
      WHEN pi.document_limit = 0 THEN 100
      ELSE ROUND((ui.docs_used::NUMERIC / pi.document_limit::NUMERIC) * 100, 2)
    END,
    cs.current_period_start::DATE,
    cs.current_period_end::DATE,
    GREATEST(0, (cs.current_period_end::DATE - CURRENT_DATE))
  FROM plan_info pi
  CROSS JOIN usage_info ui
  CROSS JOIN current_subscription cs;
END;
$$;

-- Optimize the increment_document_usage function
CREATE OR REPLACE FUNCTION increment_document_usage(
  p_user_id UUID,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_id UUID;
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  -- Get current subscription info
  SELECT s.plan_id, s.current_period_start::DATE, s.current_period_end::DATE
  INTO v_plan_id, v_period_start, v_period_end
  FROM subscriptions s
  WHERE s.user_id = p_user_id 
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'No active subscription found for user';
  END IF;

  -- Insert or update usage record
  INSERT INTO unified_usage_tracking (
    user_id, 
    plan_id, 
    documents_processed, 
    billing_period_start, 
    billing_period_end,
    last_reset_date
  )
  VALUES (
    p_user_id, 
    v_plan_id, 
    p_increment, 
    v_period_start, 
    v_period_end,
    v_period_start
  )
  ON CONFLICT (user_id, plan_id, billing_period_start) 
  DO UPDATE SET 
    documents_processed = unified_usage_tracking.documents_processed + p_increment,
    updated_at = NOW();

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to increment usage: %', SQLERRM;
END;
$$;

-- Create a simple function to get or create usage record
CREATE OR REPLACE FUNCTION get_or_create_unified_usage(
  p_user_id UUID,
  p_plan_id UUID
)
RETURNS TABLE (
  user_id UUID,
  plan_id UUID,
  documents_processed INTEGER,
  last_reset_date DATE,
  billing_period_start DATE,
  billing_period_end DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  -- Get billing period from subscription
  SELECT s.current_period_start::DATE, s.current_period_end::DATE
  INTO v_period_start, v_period_end
  FROM subscriptions s
  WHERE s.user_id = p_user_id AND s.plan_id = p_plan_id AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_period_start IS NULL THEN
    -- Use current month if no subscription found
    v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  END IF;

  -- Insert if not exists
  INSERT INTO unified_usage_tracking (
    user_id, 
    plan_id, 
    documents_processed, 
    billing_period_start, 
    billing_period_end,
    last_reset_date
  )
  VALUES (
    p_user_id, 
    p_plan_id, 
    0, 
    v_period_start, 
    v_period_end,
    v_period_start
  )
  ON CONFLICT (user_id, plan_id, billing_period_start) DO NOTHING;

  -- Return the record
  RETURN QUERY
  SELECT 
    uut.user_id,
    uut.plan_id,
    uut.documents_processed,
    uut.last_reset_date,
    uut.billing_period_start,
    uut.billing_period_end
  FROM unified_usage_tracking uut
  WHERE uut.user_id = p_user_id 
  AND uut.plan_id = p_plan_id 
  AND uut.billing_period_start = v_period_start;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_usage_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_document_usage(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_unified_usage(UUID, UUID) TO authenticated;

-- Update RLS policies for better performance
DROP POLICY IF EXISTS "unified_usage_user_access" ON unified_usage_tracking;
CREATE POLICY "unified_usage_user_access" ON unified_usage_tracking
  FOR ALL USING (auth.uid() = user_id);

-- Analyze tables for better query planning
ANALYZE unified_usage_tracking;
ANALYZE subscriptions;
ANALYZE subscription_plans;
ANALYZE profiles;
