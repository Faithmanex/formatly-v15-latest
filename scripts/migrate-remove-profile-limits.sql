-- 1. Remove deprecated usage tracking columns from the profiles table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'profiles' AND column_name = 'documents_processed') THEN
    ALTER TABLE public.profiles DROP COLUMN documents_processed;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'profiles' AND column_name = 'documents_used') THEN
    ALTER TABLE public.profiles DROP COLUMN documents_used;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'profiles' AND column_name = 'document_quota') THEN
    ALTER TABLE public.profiles DROP COLUMN document_quota;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'profiles' AND column_name = 'document_limit') THEN
    ALTER TABLE public.profiles DROP COLUMN document_limit;
  END IF;

  -- Ensure subscriptions has documents_used column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'subscriptions' AND column_name = 'documents_used') THEN
    ALTER TABLE public.subscriptions ADD COLUMN documents_used integer DEFAULT 0;
  END IF;
END $$;

-- 2. Update the handle_new_user function to stop inserting these columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Use UPSERT to handle cases where profile might already exist
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'user'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Replace increment_document_usage function so it explicitly relies ONLY on subscriptions
CREATE OR REPLACE FUNCTION public.increment_document_usage(
  p_user_id uuid,
  p_increment integer DEFAULT 1
) RETURNS void AS $$
DECLARE
  current_sub_id uuid;
BEGIN
  -- Get user's active subscription ID
  SELECT id INTO current_sub_id
  FROM public.subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF current_sub_id IS NOT NULL THEN
    -- Increment the usage exclusively in subscriptions table
    UPDATE public.subscriptions
    SET 
      documents_used = COALESCE(documents_used, 0) + p_increment,
      updated_at = now()
    WHERE id = current_sub_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Overwrite get_user_usage_stats to strictly compute from subscriptions table
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
        -- fallback limits default to arbitrary values when no active subscription plan is effectively applied
        1000 as api_calls_limit,
        COALESCE(s.storage_used_gb, 0.00) as storage_used_gb,
        10 as storage_limit_gb,
        COALESCE(sp.name, 'Free') as plan_name,
        COALESCE(s.billing_cycle, 'monthly') as billing_cycle,
        CASE 
            WHEN s.billing_cycle = 'yearly' THEN COALESCE(s.last_usage_reset, s.current_period_start, NOW()) + INTERVAL '1 year'
            ELSE COALESCE(s.last_usage_reset, s.current_period_start, NOW()) + INTERVAL '1 month'
        END as next_reset_date
    FROM auth.users u
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
