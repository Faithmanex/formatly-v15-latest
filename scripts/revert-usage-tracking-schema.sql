-- =====================================================
-- REVERT SCRIPT FOR SCHEMA CHANGES
-- Run this in your Supabase SQL Editor to undo the usage tracking changes.
-- =====================================================

-- 1. Restore the dropped columns to the profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'documents_used') THEN
    ALTER TABLE public.profiles ADD COLUMN documents_used integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'document_limit') THEN
    ALTER TABLE public.profiles ADD COLUMN document_limit integer DEFAULT 5;
  END IF;
END $$;

-- 2. Restore the original get_user_usage_stats function
DROP FUNCTION IF EXISTS public.get_user_usage_stats(uuid);

CREATE OR REPLACE FUNCTION public.get_user_usage_stats(p_user_id uuid)
RETURNS TABLE (
  plan_id uuid,
  plan_name text,
  document_limit integer,
  documents_used integer,
  api_calls_limit integer,
  api_calls_used integer,
  storage_limit_gb integer,
  storage_used_gb numeric,
  usage_percentage numeric,
  billing_period_start timestamp with time zone,
  billing_period_end timestamp with time zone,
  days_until_reset integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id as plan_id,
    sp.name as plan_name,
    sp.document_limit,
    COALESCE(uut.documents_processed, 0) as documents_used,
    sp.api_calls_limit,
    COALESCE(uut.api_calls_made, 0) as api_calls_used,
    sp.storage_limit_gb,
    COALESCE(uut.storage_used_gb, 0.00) as storage_used_gb,
    CASE 
      WHEN sp.document_limit > 0 THEN 
        ROUND((COALESCE(uut.documents_processed, 0)::numeric / sp.document_limit::numeric) * 100, 2)
      ELSE 0
    END as usage_percentage,
    uut.billing_period_start,
    uut.billing_period_end,
    EXTRACT(days FROM (uut.billing_period_end - CURRENT_TIMESTAMP))::integer as days_until_reset
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON s.plan_id = sp.id
  LEFT JOIN public.unified_usage_tracking uut ON uut.user_id = s.user_id 
    AND uut.plan_id = s.plan_id
    AND uut.billing_period_end > CURRENT_TIMESTAMP
  WHERE s.user_id = p_user_id 
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Restore the original increment_document_usage function
DROP FUNCTION IF EXISTS public.increment_document_usage(uuid, integer);

CREATE OR REPLACE FUNCTION public.increment_document_usage(
  p_user_id uuid,
  p_increment integer DEFAULT 1
) RETURNS public.unified_usage_tracking AS $$
DECLARE
  usage_record public.unified_usage_tracking;
  current_plan_id uuid;
BEGIN
  -- Get user's current plan
  SELECT plan_id INTO current_plan_id
  FROM public.subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default to free plan if no active subscription
  IF current_plan_id IS NULL THEN
    SELECT id INTO current_plan_id
    FROM public.subscription_plans
    WHERE name = 'Free'
    LIMIT 1;
  END IF;
  
  -- Get or create usage record
  SELECT * INTO usage_record FROM public.get_or_create_unified_usage(p_user_id, current_plan_id);
  
  -- Increment the usage
  UPDATE public.unified_usage_tracking
  SET 
    documents_processed = documents_processed + p_increment,
    updated_at = now()
  WHERE id = usage_record.id
  RETURNING * INTO usage_record;
  
  -- Also update the legacy profiles table for backward compatibility
  UPDATE public.profiles
  SET 
    documents_used = documents_used + p_increment,
    updated_at = now()
  WHERE id = p_user_id;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
