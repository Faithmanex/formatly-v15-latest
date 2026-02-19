-- Remove legacy usage tracking tables and create simplified system
-- This script removes the legacy tables: unified_usage_tracking, legacy_usage_stats, user_plan_assignments
-- and creates a new simplified usage tracking system

-- Step 1: Drop legacy tables and their dependencies
DROP TABLE IF EXISTS unified_usage_tracking CASCADE;
DROP TABLE IF EXISTS legacy_usage_stats CASCADE;
DROP TABLE IF EXISTS user_plan_assignments CASCADE;

-- Step 2: Create a new simplified usage tracking table
CREATE TABLE IF NOT EXISTS subscription_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    
    -- Usage metrics
    documents_processed INTEGER NOT NULL DEFAULT 0,
    api_calls_made INTEGER NOT NULL DEFAULT 0,
    storage_used_gb NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    
    -- Billing period tracking
    billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Metadata
    last_reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reset_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, subscription_id, billing_period_start),
    CHECK (documents_processed >= 0),
    CHECK (api_calls_made >= 0),
    CHECK (storage_used_gb >= 0)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_plan_id ON subscription_usage(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_billing_period ON subscription_usage(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_period ON subscription_usage(user_id, billing_period_start, billing_period_end);

-- Step 4: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscription_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_usage_updated_at
    BEFORE UPDATE ON subscription_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_usage_updated_at();

-- Step 5: Enable RLS
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
CREATE POLICY "Users can view their own usage" ON subscription_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own usage" ON subscription_usage
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own usage" ON subscription_usage
    FOR UPDATE USING (user_id = auth.uid());

-- Step 7: Grant permissions
GRANT SELECT, INSERT, UPDATE ON subscription_usage TO authenticated;
GRANT USAGE ON SEQUENCE subscription_usage_id_seq TO authenticated; --Didn't Run

COMMENT ON TABLE subscription_usage IS 'Simplified usage tracking per subscription billing period';
COMMENT ON COLUMN subscription_usage.documents_processed IS 'Number of documents processed in this billing period';
COMMENT ON COLUMN subscription_usage.api_calls_made IS 'Number of API calls made in this billing period';
COMMENT ON COLUMN subscription_usage.storage_used_gb IS 'Storage used in GB for this billing period';
