-- =====================================================
-- CONSOLIDATED OPTIMIZED SCHEMA
-- This file consolidates all redundant schema files into a single, optimized structure
-- Replaces: usage_tracking, usage_stats, user_plan_usage tables with unified system
-- =====================================================

-- Drop existing redundant tables to prevent conflicts
DROP TABLE IF EXISTS public.usage_tracking CASCADE;
DROP TABLE IF EXISTS public.usage_stats CASCADE;
DROP TABLE IF EXISTS public.user_plan_usage CASCADE;

-- =====================================================
-- UNIFIED USAGE TRACKING SYSTEM
-- Single table to handle all usage tracking needs
-- =====================================================

CREATE TABLE IF NOT EXISTS public.unified_usage_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  
  -- Usage metrics
  documents_processed integer NOT NULL DEFAULT 0,
  api_calls_made integer NOT NULL DEFAULT 0,
  storage_used_gb numeric(10,2) NOT NULL DEFAULT 0.00,
  
  -- Billing period tracking
  billing_period_start timestamp with time zone NOT NULL,
  billing_period_end timestamp with time zone NOT NULL,
  
  -- Reset tracking for plan changes
  last_reset_date timestamp with time zone NOT NULL DEFAULT now(),
  reset_reason text, -- 'billing_cycle', 'plan_change', 'manual'
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unified_usage_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT unified_usage_tracking_user_plan_period_unique 
    UNIQUE (user_id, plan_id, billing_period_start, billing_period_end),
  CONSTRAINT unified_usage_tracking_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT unified_usage_tracking_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES public.subscription_plans (id) ON DELETE CASCADE,
    
  -- Check constraints
  CONSTRAINT unified_usage_tracking_documents_check CHECK (documents_processed >= 0),
  CONSTRAINT unified_usage_tracking_api_calls_check CHECK (api_calls_made >= 0),
  CONSTRAINT unified_usage_tracking_storage_check CHECK (storage_used_gb >= 0),
  CONSTRAINT unified_usage_tracking_period_check CHECK (billing_period_end > billing_period_start)
) TABLESPACE pg_default;

-- Optimized indexes for performance
CREATE INDEX idx_unified_usage_user_id ON public.unified_usage_tracking (user_id);
CREATE INDEX idx_unified_usage_plan_id ON public.unified_usage_tracking (plan_id);
CREATE INDEX idx_unified_usage_user_plan ON public.unified_usage_tracking (user_id, plan_id);
CREATE INDEX idx_unified_usage_period ON public.unified_usage_tracking (billing_period_start, billing_period_end);
CREATE INDEX idx_unified_usage_user_current ON public.unified_usage_tracking (user_id, billing_period_end DESC);

-- Enable RLS
ALTER TABLE public.unified_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own usage records" ON public.unified_usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage records" ON public.unified_usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage records" ON public.unified_usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage records" ON public.unified_usage_tracking
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- CONSOLIDATED PROFILE SCHEMA FIXES
-- Fix all profile-related inconsistencies in one place
-- =====================================================

-- Ensure profiles table has consistent column names
DO $$
BEGIN
  -- Standardize on 'documents_used' column name
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'profiles' AND column_name = 'documents_processed') THEN
    ALTER TABLE public.profiles RENAME COLUMN documents_processed TO documents_used;
  END IF;
  
  -- Standardize on 'document_limit' column name
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'profiles' AND column_name = 'document_quota') THEN
    ALTER TABLE public.profiles RENAME COLUMN document_quota TO document_limit;
  END IF;
  
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'documents_used') THEN
    ALTER TABLE public.profiles ADD COLUMN documents_used integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'document_limit') THEN
    ALTER TABLE public.profiles ADD COLUMN document_limit integer DEFAULT 5;
  END IF;
END $$;

-- =====================================================
-- CONSOLIDATED BILLING SCHEMA ENHANCEMENTS
-- Merge all billing-related improvements
-- =====================================================

-- Add missing columns to subscriptions table for downgrade support
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'pending_plan_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN pending_plan_id uuid REFERENCES public.subscription_plans(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'pending_change_date') THEN
    ALTER TABLE public.subscriptions ADD COLUMN pending_change_date timestamp with time zone;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'subscriptions' AND column_name = 'change_reason') THEN
    ALTER TABLE public.subscriptions ADD COLUMN change_reason text;
  END IF;
END $$;

-- Fix invoices table column names
DO $$
BEGIN
  -- Ensure invoices table has correct column structure
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'invoices' AND column_name = 'amount') THEN
    -- Rename amount to amount_due for clarity
    ALTER TABLE public.invoices RENAME COLUMN amount TO amount_due;
  END IF;
  
  -- Add amount_paid column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'amount_paid') THEN
    ALTER TABLE public.invoices ADD COLUMN amount_paid integer DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- UNIFIED USAGE TRACKING FUNCTIONS
-- Consolidated and optimized functions
-- =====================================================

-- Function to get current billing period boundaries
CREATE OR REPLACE FUNCTION public.get_current_billing_period(p_user_id uuid)
RETURNS TABLE (
  period_start timestamp with time zone,
  period_end timestamp with time zone
) AS $$
DECLARE
  subscription_record record;
BEGIN
  -- Get user's active subscription
  SELECT current_period_start, current_period_end
  INTO subscription_record
  FROM public.subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF FOUND THEN
    -- Use subscription billing period
    RETURN QUERY SELECT 
      subscription_record.current_period_start,
      subscription_record.current_period_end;
  ELSE
    -- Fallback to calendar month for free users
    RETURN QUERY SELECT 
      date_trunc('month', CURRENT_TIMESTAMP)::timestamp with time zone,
      (date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month - 1 second')::timestamp with time zone;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create unified usage record
CREATE OR REPLACE FUNCTION public.get_or_create_unified_usage(
  p_user_id uuid,
  p_plan_id uuid
) RETURNS public.unified_usage_tracking AS $$
DECLARE
  usage_record public.unified_usage_tracking;
  billing_period record;
BEGIN
  -- Get current billing period
  SELECT * INTO billing_period FROM public.get_current_billing_period(p_user_id);
  
  -- Try to get existing record for current period
  SELECT * INTO usage_record
  FROM public.unified_usage_tracking
  WHERE user_id = p_user_id 
    AND plan_id = p_plan_id
    AND billing_period_start = billing_period.period_start
    AND billing_period_end = billing_period.period_end;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.unified_usage_tracking (
      user_id, plan_id, documents_processed, api_calls_made, storage_used_gb,
      billing_period_start, billing_period_end, reset_reason
    )
    VALUES (
      p_user_id, p_plan_id, 0, 0, 0.00,
      billing_period.period_start, billing_period.period_end, 'billing_cycle'
    )
    RETURNING * INTO usage_record;
  END IF;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment document usage (replaces all previous versions)
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

-- Function to get comprehensive usage statistics
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

-- Function to reset usage for plan changes
CREATE OR REPLACE FUNCTION public.reset_usage_for_plan_change(
  p_user_id uuid,
  p_old_plan_id uuid,
  p_new_plan_id uuid,
  p_reason text DEFAULT 'plan_change'
) RETURNS void AS $$
DECLARE
  billing_period record;
BEGIN
  -- Get current billing period
  SELECT * INTO billing_period FROM public.get_current_billing_period(p_user_id);
  
  -- Create new usage record for new plan (starts at 0)
  INSERT INTO public.unified_usage_tracking (
    user_id, plan_id, documents_processed, api_calls_made, storage_used_gb,
    billing_period_start, billing_period_end, reset_reason
  )
  VALUES (
    p_user_id, p_new_plan_id, 0, 0, 0.00,
    billing_period.period_start, billing_period.period_end, p_reason
  )
  ON CONFLICT (user_id, plan_id, billing_period_start, billing_period_end) 
  DO UPDATE SET
    documents_processed = 0,
    api_calls_made = 0,
    storage_used_gb = 0.00,
    last_reset_date = now(),
    reset_reason = p_reason,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CLEANUP AND OPTIMIZATION
-- =====================================================

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_unified_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unified_usage_updated_at
  BEFORE UPDATE ON public.unified_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_unified_usage_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.unified_usage_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_billing_period(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_unified_usage(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_document_usage(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_usage_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_usage_for_plan_change(uuid, uuid, uuid, text) TO authenticated;

-- Create view for backward compatibility with old usage queries
CREATE OR REPLACE VIEW public.legacy_usage_stats AS
SELECT 
  uut.user_id,
  uut.billing_period_start as period_start,
  uut.billing_period_end as period_end,
  uut.documents_processed,
  uut.api_calls_made,
  uut.storage_used_gb,
  uut.created_at,
  uut.updated_at
FROM public.unified_usage_tracking uut
WHERE uut.billing_period_end > CURRENT_TIMESTAMP;

-- Grant access to legacy view
GRANT SELECT ON public.legacy_usage_stats TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.unified_usage_tracking IS 'Consolidated usage tracking table that replaces usage_tracking, usage_stats, and user_plan_usage tables';
COMMENT ON FUNCTION public.increment_document_usage(uuid, integer) IS 'Unified function to increment document usage, replaces all previous versions';
COMMENT ON FUNCTION public.get_user_usage_stats(uuid) IS 'Comprehensive usage statistics function with billing period awareness';
