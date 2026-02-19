-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_current_usage_stats(UUID);
DROP FUNCTION IF EXISTS increment_document_usage(UUID);
DROP FUNCTION IF EXISTS update_storage_usage(UUID, DECIMAL);
DROP FUNCTION IF EXISTS increment_api_usage(UUID);

-- Create usage tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  documents_processed INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_end)
);

-- Enable RLS on usage_stats
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for usage_stats
DROP POLICY IF EXISTS "Users can view their own usage stats" ON usage_stats;
DROP POLICY IF EXISTS "Users can insert their own usage stats" ON usage_stats;
DROP POLICY IF EXISTS "Users can update their own usage stats" ON usage_stats;

CREATE POLICY "Users can view their own usage stats" ON usage_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage stats" ON usage_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage stats" ON usage_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to get or create current month usage stats
CREATE OR REPLACE FUNCTION get_current_usage_stats(user_uuid UUID)
RETURNS TABLE (
  documents_processed INTEGER,
  api_calls_made INTEGER,
  storage_used_gb DECIMAL(10,2),
  current_period_start DATE,
  current_period_end DATE
) AS $$
DECLARE
  current_month_start DATE;
  current_month_end DATE;
  usage_record RECORD;
BEGIN
  -- Calculate current month boundaries
  current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  current_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  
  -- Try to get existing usage stats for current month
  SELECT * INTO usage_record
  FROM usage_stats us
  WHERE us.user_id = user_uuid 
    AND us.period_start = current_month_start 
    AND us.period_end = current_month_end;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO usage_stats (user_id, period_start, period_end, documents_processed, api_calls_made, storage_used_gb)
    VALUES (user_uuid, current_month_start, current_month_end, 0, 0, 0.00)
    RETURNING * INTO usage_record;
  END IF;
  
  -- Return the usage stats
  RETURN QUERY SELECT 
    usage_record.documents_processed,
    usage_record.api_calls_made,
    usage_record.storage_used_gb,
    usage_record.period_start,
    usage_record.period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment document count
CREATE OR REPLACE FUNCTION increment_document_usage(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  current_month_start DATE;
  current_month_end DATE;
BEGIN
  current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  current_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  
  INSERT INTO usage_stats (user_id, period_start, period_end, documents_processed, api_calls_made, storage_used_gb)
  VALUES (target_user_id, current_month_start, current_month_end, 1, 0, 0.00)
  ON CONFLICT (user_id, period_start, period_end)
  DO UPDATE SET 
    documents_processed = usage_stats.documents_processed + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment API usage
CREATE OR REPLACE FUNCTION increment_api_usage(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  current_month_start DATE;
  current_month_end DATE;
BEGIN
  current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  current_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  
  INSERT INTO usage_stats (user_id, period_start, period_end, documents_processed, api_calls_made, storage_used_gb)
  VALUES (target_user_id, current_month_start, current_month_end, 0, 1, 0.00)
  ON CONFLICT (user_id, period_start, period_end)
  DO UPDATE SET 
    api_calls_made = usage_stats.api_calls_made + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_storage_usage(target_user_id UUID, storage_gb DECIMAL(10,2))
RETURNS VOID AS $$
DECLARE
  current_month_start DATE;
  current_month_end DATE;
BEGIN
  current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  current_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  
  INSERT INTO usage_stats (user_id, period_start, period_end, documents_processed, api_calls_made, storage_used_gb)
  VALUES (target_user_id, current_month_start, current_month_end, 0, 0, storage_gb)
  ON CONFLICT (user_id, period_start, period_end)
  DO UPDATE SET 
    storage_used_gb = storage_gb,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
