-- Create user_plan_usage table for plan-specific document usage tracking
-- This prevents users from gaming the system by switching plans to reset usage

-- Drop existing table if it exists (for development)
DROP TABLE IF EXISTS public.user_plan_usage CASCADE;

-- Create the user_plan_usage table
CREATE TABLE public.user_plan_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  documents_used integer NOT NULL DEFAULT 0,
  last_reset_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Primary key
  CONSTRAINT user_plan_usage_pkey PRIMARY KEY (id),
  
  -- Unique constraint to ensure one record per user-plan combination
  CONSTRAINT user_plan_usage_user_plan_unique UNIQUE (user_id, plan_id),
  
  -- Foreign key constraints
  CONSTRAINT user_plan_usage_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT user_plan_usage_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES public.subscription_plans (id) ON DELETE CASCADE,
    
  -- Check constraints
  CONSTRAINT user_plan_usage_documents_used_check CHECK (documents_used >= 0)
) TABLESPACE pg_default;

-- Create indexes for performance
CREATE INDEX idx_user_plan_usage_user_id ON public.user_plan_usage (user_id);
CREATE INDEX idx_user_plan_usage_plan_id ON public.user_plan_usage (plan_id);
CREATE INDEX idx_user_plan_usage_user_plan ON public.user_plan_usage (user_id, plan_id);

-- Enable RLS
ALTER TABLE public.user_plan_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own usage records
CREATE POLICY "Users can view own usage records" ON public.user_plan_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own usage records
CREATE POLICY "Users can insert own usage records" ON public.user_plan_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage records
CREATE POLICY "Users can update own usage records" ON public.user_plan_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all records
CREATE POLICY "Service role can manage all usage records" ON public.user_plan_usage
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to get or create user plan usage record
CREATE OR REPLACE FUNCTION public.get_or_create_user_plan_usage(
  p_user_id uuid,
  p_plan_id uuid
) RETURNS public.user_plan_usage AS $$
DECLARE
  usage_record public.user_plan_usage;
BEGIN
  -- Try to get existing record
  SELECT * INTO usage_record
  FROM public.user_plan_usage
  WHERE user_id = p_user_id AND plan_id = p_plan_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_plan_usage (user_id, plan_id, documents_used, last_reset_date)
    VALUES (p_user_id, p_plan_id, 0, now())
    RETURNING * INTO usage_record;
  END IF;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment document usage for a specific plan
CREATE OR REPLACE FUNCTION public.increment_plan_document_usage(
  p_user_id uuid,
  p_plan_id uuid,
  p_increment integer DEFAULT 1
) RETURNS public.user_plan_usage AS $$
DECLARE
  usage_record public.user_plan_usage;
BEGIN
  -- Get or create the usage record
  SELECT * INTO usage_record FROM public.get_or_create_user_plan_usage(p_user_id, p_plan_id);
  
  -- Increment the usage
  UPDATE public.user_plan_usage
  SET 
    documents_used = documents_used + p_increment,
    updated_at = now()
  WHERE user_id = p_user_id AND plan_id = p_plan_id
  RETURNING * INTO usage_record;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset usage for a plan (used during billing cycle resets)
CREATE OR REPLACE FUNCTION public.reset_plan_document_usage(
  p_user_id uuid,
  p_plan_id uuid
) RETURNS public.user_plan_usage AS $$
DECLARE
  usage_record public.user_plan_usage;
BEGIN
  -- Get or create the usage record
  SELECT * INTO usage_record FROM public.get_or_create_user_plan_usage(p_user_id, p_plan_id);
  
  -- Reset the usage
  UPDATE public.user_plan_usage
  SET 
    documents_used = 0,
    last_reset_date = now(),
    updated_at = now()
  WHERE user_id = p_user_id AND plan_id = p_plan_id
  RETURNING * INTO usage_record;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current usage for a user's active plan
CREATE OR REPLACE FUNCTION public.get_current_plan_usage(p_user_id uuid)
RETURNS TABLE (
  plan_id uuid,
  plan_name text,
  document_limit integer,
  documents_used integer,
  remaining_documents integer,
  usage_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id as plan_id,
    sp.name as plan_name,
    sp.document_limit,
    COALESCE(upu.documents_used, 0) as documents_used,
    GREATEST(0, sp.document_limit - COALESCE(upu.documents_used, 0)) as remaining_documents,
    CASE 
      WHEN sp.document_limit > 0 THEN 
        ROUND((COALESCE(upu.documents_used, 0)::numeric / sp.document_limit::numeric) * 100, 2)
      ELSE 0
    END as usage_percentage
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON s.plan_id = sp.id
  LEFT JOIN public.user_plan_usage upu ON upu.user_id = s.user_id AND upu.plan_id = s.plan_id
  WHERE s.user_id = p_user_id 
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_plan_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_plan_usage_updated_at
  BEFORE UPDATE ON public.user_plan_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_plan_usage_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.user_plan_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_plan_usage(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_plan_document_usage(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_plan_document_usage(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_plan_usage(uuid) TO authenticated;
