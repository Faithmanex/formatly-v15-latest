-- Fix get_subscription_status RPC function to use subscriptions table instead of profiles
-- This removes references to deleted documents_used and document_limit columns from profiles table

CREATE OR REPLACE FUNCTION get_subscription_status(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'subscription_id', s.id,
    'current_plan', json_build_object(
      'id', cp.id,
      'name', cp.name,
      'document_limit', cp.document_limit,
      'price_monthly', cp.price_monthly,
      'features', cp.features
    ),
    'pending_plan', CASE 
      WHEN s.pending_plan_id IS NOT NULL THEN
        json_build_object(
          'id', pp.id,
          'name', pp.name,
          'document_limit', pp.document_limit,
          'price_monthly', pp.price_monthly,
          'effective_date', s.pending_plan_effective_date,
          'change_reason', s.plan_change_reason
        )
      ELSE NULL
    END,
    'status', s.status,
    'billing_cycle', s.billing_cycle,
    'current_period_start', s.current_period_start,
    'current_period_end', s.current_period_end,
    'cancel_at_period_end', s.cancel_at_period_end,
    -- Changed to use documents_used from subscriptions table instead of profiles table
    'documents_used', s.documents_used,
    'current_document_limit', cp.document_limit
  ) INTO v_result
  FROM subscriptions s
  JOIN subscription_plans cp ON s.plan_id = cp.id
  LEFT JOIN subscription_plans pp ON s.pending_plan_id = pp.id
  WHERE s.user_id = p_user_id 
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  RETURN COALESCE(v_result, '{"error": "No active subscription found"}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_subscription_upgrade to not update profiles.document_limit (removed references)
CREATE OR REPLACE FUNCTION handle_subscription_upgrade(
  p_user_id UUID,
  p_new_plan_id UUID,
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS JSON AS $$
DECLARE
  v_subscription_id UUID;
  v_old_plan_id UUID;
  v_new_plan subscription_plans%ROWTYPE;
  v_result JSON;
BEGIN
  -- Get current subscription
  SELECT id, plan_id INTO v_subscription_id, v_old_plan_id
  FROM subscriptions 
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Get new plan details
  SELECT * INTO v_new_plan
  FROM subscription_plans 
  WHERE id = p_new_plan_id;

  IF v_subscription_id IS NULL THEN
    RAISE EXCEPTION 'No active subscription found for user';
  END IF;

  -- Update subscription immediately for upgrades
  UPDATE subscriptions 
  SET 
    plan_id = p_new_plan_id,
    previous_plan_id = v_old_plan_id,
    plan_change_reason = 'upgrade',
    pending_plan_id = NULL,
    pending_plan_effective_date = NULL,
    billing_cycle = p_billing_cycle::TEXT,
    updated_at = NOW()
  WHERE id = v_subscription_id;

  -- Removed UPDATE to profiles.document_limit - no longer exists

  -- Create notification
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    p_user_id,
    'success',
    'Plan Upgraded Successfully',
    'Your subscription has been upgraded to ' || v_new_plan.name || '. New limits are now active.'
  );

  -- Return result
  SELECT json_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'new_plan_name', v_new_plan.name,
    'new_document_limit', v_new_plan.document_limit,
    'effective_immediately', true
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_subscription_downgrade to not update profiles.document_limit (removed references)
CREATE OR REPLACE FUNCTION handle_subscription_downgrade(
  p_user_id UUID,
  p_new_plan_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_subscription_id UUID;
  v_current_plan_id UUID;
  v_current_period_end TIMESTAMP WITH TIME ZONE;
  v_new_plan subscription_plans%ROWTYPE;
  v_current_plan subscription_plans%ROWTYPE;
  v_result JSON;
BEGIN
  -- Get current subscription
  SELECT id, plan_id, current_period_end 
  INTO v_subscription_id, v_current_plan_id, v_current_period_end
  FROM subscriptions 
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Get plan details
  SELECT * INTO v_new_plan FROM subscription_plans WHERE id = p_new_plan_id;
  SELECT * INTO v_current_plan FROM subscription_plans WHERE id = v_current_plan_id;

  IF v_subscription_id IS NULL THEN
    RAISE EXCEPTION 'No active subscription found for user';
  END IF;

  -- Schedule downgrade for next billing cycle
  UPDATE subscriptions 
  SET 
    pending_plan_id = p_new_plan_id,
    pending_plan_effective_date = v_current_period_end,
    plan_change_reason = 'downgrade',
    updated_at = NOW()
  WHERE id = v_subscription_id;

  -- Create notification
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    p_user_id,
    'info',
    'Downgrade Scheduled',
    'Your subscription will be downgraded to ' || v_new_plan.name || ' on ' || 
    TO_CHAR(v_current_period_end, 'Month DD, YYYY') || '. You''ll keep your current ' || 
    v_current_plan.name || ' benefits until then.'
  );

  -- Return result
  SELECT json_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'current_plan_name', v_current_plan.name,
    'new_plan_name', v_new_plan.name,
    'effective_date', v_current_period_end,
    'scheduled_downgrade', true
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update process_pending_plan_changes to not update profiles.document_limit (removed references)
CREATE OR REPLACE FUNCTION process_pending_plan_changes()
RETURNS JSON AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_subscription RECORD;
  v_new_plan subscription_plans%ROWTYPE;
BEGIN
  -- Process all pending plan changes that are due
  FOR v_subscription IN 
    SELECT s.*, sp.name as current_plan_name
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.pending_plan_id IS NOT NULL 
    AND s.pending_plan_effective_date <= NOW()
    AND s.status = 'active'
  LOOP
    -- Get new plan details
    SELECT * INTO v_new_plan
    FROM subscription_plans 
    WHERE id = v_subscription.pending_plan_id;

    -- Apply the plan change
    UPDATE subscriptions 
    SET 
      previous_plan_id = plan_id,
      plan_id = pending_plan_id,
      pending_plan_id = NULL,
      pending_plan_effective_date = NULL,
      plan_change_reason = 'scheduled_change',
      updated_at = NOW()
    WHERE id = v_subscription.id;

    -- Removed UPDATE to profiles.document_limit - no longer exists

    -- Create notification
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      v_subscription.user_id,
      'info',
      'Plan Change Applied',
      'Your subscription has been changed from ' || v_subscription.current_plan_name || 
      ' to ' || v_new_plan.name || '. New limits are now active.'
    );

    v_processed_count := v_processed_count + 1;
  END LOOP;

  RETURN json_build_object(
    'processed_count', v_processed_count,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
