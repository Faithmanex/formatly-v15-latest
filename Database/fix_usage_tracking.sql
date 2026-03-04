-- Migration: Fix Usage Tracking and Limit Enforcement
-- Date: 2026-03-04
-- Purpose: Unify usage tracking to rely on subscriptions table and add missing increment functions.

-- 0. Drop existing functions to avoid return type mismatch errors
DROP FUNCTION IF EXISTS public.get_user_usage_stats(uuid);
DROP FUNCTION IF EXISTS public.check_usage_limits(uuid);
DROP FUNCTION IF EXISTS public.increment_document_usage(uuid, integer);
DROP FUNCTION IF EXISTS public.track_document_usage(uuid);

-- 1. Fix get_user_usage_stats to use subscriptions table
CREATE OR REPLACE FUNCTION public.get_user_usage_stats(user_uuid uuid)
 RETURNS TABLE(
   documents_used integer, 
   api_calls_used integer, 
   storage_used_gb numeric, 
   documents_limit integer, 
   api_calls_limit integer, 
   storage_limit_gb numeric, 
   plan_name text, 
   next_reset_date timestamp with time zone, 
   billing_cycle text,
   usage_percentage numeric
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_subscription RECORD;
BEGIN
  -- Get the user's active subscription and plan details
  SELECT 
    s.documents_used,
    s.api_calls_used,
    s.storage_used_gb,
    sp.document_limit as documents_limit,
    sp.api_calls_limit as api_calls_limit,
    sp.storage_limit_gb as storage_limit_gb,
    sp.name as plan_name,
    s.current_period_end as next_reset_date,
    s.billing_cycle,
    CASE 
      WHEN sp.document_limit > 0 THEN 
        ROUND((COALESCE(s.documents_used, 0)::numeric / sp.document_limit::numeric) * 100, 2)
      WHEN sp.document_limit = -1 THEN 0
      ELSE 0
    END as usage_percentage
  INTO v_subscription
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON s.plan_id = sp.id
  WHERE s.user_id = user_uuid AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- If subscription found, return it
  IF FOUND THEN
    RETURN QUERY SELECT 
      v_subscription.documents_used,
      v_subscription.api_calls_used,
      v_subscription.storage_used_gb,
      v_subscription.documents_limit,
      v_subscription.api_calls_limit,
      v_subscription.storage_limit_gb,
      v_subscription.plan_name,
      v_subscription.next_reset_date,
      v_subscription.billing_cycle,
      v_subscription.usage_percentage;
  ELSE
    -- Fallback for users with no active subscription record
    RETURN QUERY SELECT 
      0, 
      0, 
      0.00::numeric, 
      3, -- Default Free limit
      100, 
      1.00::numeric, 
      'Free'::text, 
      (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::timestamp with time zone, 
      'monthly'::text,
      0::numeric;
  END IF;
END;
$function$;

-- 2. Add missing increment_document_usage function
CREATE OR REPLACE FUNCTION public.increment_document_usage(p_user_id uuid, p_increment integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.subscriptions 
    SET documents_used = COALESCE(documents_used, 0) + p_increment,
        updated_at = NOW()
    WHERE user_id = p_user_id 
      AND status = 'active';
    
    RETURN FOUND;
END;
$function$;

-- 2b. Add missing update_storage_usage function
CREATE OR REPLACE FUNCTION public.update_storage_usage(p_user_id uuid, p_storage_gb numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.subscriptions 
    SET storage_used_gb = COALESCE(storage_used_gb, 0) + p_storage_gb,
        updated_at = NOW()
    WHERE user_id = p_user_id 
      AND status = 'active';
    
    RETURN FOUND;
END;
$function$;

-- 3. Add alias for track_document_usage if needed by code
CREATE OR REPLACE FUNCTION public.track_document_usage(user_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    PERFORM public.increment_document_usage(user_uuid, 1);
END;
$function$;

-- 4. Fix check_usage_limits to use the new stats
CREATE OR REPLACE FUNCTION public.check_usage_limits(p_user_id uuid)
 RETURNS TABLE(documents_at_limit boolean, api_calls_at_limit boolean, storage_at_limit boolean, current_usage jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    usage_stats RECORD;
BEGIN
    -- Get current usage stats
    SELECT * INTO usage_stats
    FROM public.get_user_usage_stats(p_user_id)
    LIMIT 1;
    
    RETURN QUERY SELECT
        (usage_stats.documents_limit > 0 AND usage_stats.documents_used >= usage_stats.documents_limit),
        (usage_stats.api_calls_limit > 0 AND usage_stats.api_calls_used >= usage_stats.api_calls_limit),
        (usage_stats.storage_limit_gb > 0 AND usage_stats.storage_used_gb >= usage_stats.storage_limit_gb),
        jsonb_build_object(
            'documents_used', usage_stats.documents_used,
            'document_limit', usage_stats.documents_limit,
            'api_calls_made', usage_stats.api_calls_used,
            'api_calls_limit', usage_stats.api_calls_limit,
            'storage_used_gb', usage_stats.storage_used_gb,
            'storage_limit_gb', usage_stats.storage_limit_gb,
            'plan_name', usage_stats.plan_name,
            'usage_percentage', usage_stats.usage_percentage
        );
END;
$function$;
