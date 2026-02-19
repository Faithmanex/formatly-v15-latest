-- Fix subscription_plans table to have all required columns
DO $$ 
BEGIN
    -- Check if document_quota column exists and rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'subscription_plans' 
               AND column_name = 'document_quota') THEN
        ALTER TABLE subscription_plans RENAME COLUMN document_quota TO document_limit;
    END IF;
    
    -- Add document_limit column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'document_limit') THEN
        ALTER TABLE subscription_plans ADD COLUMN document_limit INTEGER DEFAULT 5;
    END IF;
    
    -- Add api_calls_limit column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'api_calls_limit') THEN
        ALTER TABLE subscription_plans ADD COLUMN api_calls_limit INTEGER DEFAULT 100;
    END IF;
    
    -- Add storage_limit_gb column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'storage_limit_gb') THEN
        ALTER TABLE subscription_plans ADD COLUMN storage_limit_gb INTEGER DEFAULT 1;
    END IF;
    
    -- Add currency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'currency') THEN
        ALTER TABLE subscription_plans ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
    END IF;
    
    -- Add features column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'features') THEN
        ALTER TABLE subscription_plans ADD COLUMN features jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add priority_support column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'priority_support') THEN
        ALTER TABLE subscription_plans ADD COLUMN priority_support BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add custom_styles column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'custom_styles') THEN
        ALTER TABLE subscription_plans ADD COLUMN custom_styles BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add team_collaboration column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'team_collaboration') THEN
        ALTER TABLE subscription_plans ADD COLUMN team_collaboration BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add billing_cycles column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'billing_cycles') THEN
        ALTER TABLE subscription_plans ADD COLUMN billing_cycles jsonb DEFAULT '["monthly","yearly"]'::jsonb;
    END IF;
    
    -- Add stripe_price_id_monthly column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'stripe_price_id_monthly') THEN
        ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_monthly VARCHAR(255);
    END IF;
    
    -- Add stripe_price_id_yearly column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_plans' 
                   AND column_name = 'stripe_price_id_yearly') THEN
        ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_yearly VARCHAR(255);
    END IF;
END $$;

-- Update existing plans to have proper values
UPDATE subscription_plans 
SET 
    currency = COALESCE(currency, 'USD'),
    document_limit = COALESCE(document_limit, 5),
    api_calls_limit = COALESCE(api_calls_limit, 100),
    storage_limit_gb = COALESCE(storage_limit_gb, 1),
    features = COALESCE(features, '[]'::jsonb),
    priority_support = COALESCE(priority_support, FALSE),
    custom_styles = COALESCE(custom_styles, FALSE),
    team_collaboration = COALESCE(team_collaboration, FALSE),
    billing_cycles = COALESCE(billing_cycles, '["monthly","yearly"]'::jsonb)
WHERE currency IS NULL 
   OR document_limit IS NULL 
   OR api_calls_limit IS NULL 
   OR storage_limit_gb IS NULL 
   OR features IS NULL
   OR priority_support IS NULL
   OR custom_styles IS NULL
   OR team_collaboration IS NULL
   OR billing_cycles IS NULL;

-- Set NOT NULL constraints for required columns
ALTER TABLE subscription_plans ALTER COLUMN currency SET NOT NULL;
ALTER TABLE subscription_plans ALTER COLUMN document_limit SET NOT NULL;
ALTER TABLE subscription_plans ALTER COLUMN api_calls_limit SET NOT NULL;
ALTER TABLE subscription_plans ALTER COLUMN storage_limit_gb SET NOT NULL;
ALTER TABLE subscription_plans ALTER COLUMN features SET NOT NULL;
ALTER TABLE subscription_plans ALTER COLUMN priority_support SET NOT NULL;
ALTER TABLE subscription_plans ALTER COLUMN custom_styles SET NOT NULL;
ALTER TABLE subscription_plans ALTER COLUMN team_collaboration SET NOT NULL;
ALTER TABLE subscription_plans ALTER COLUMN billing_cycles SET NOT NULL;

-- Insert default subscription plans if they don't exist
INSERT INTO subscription_plans (
    name, description, price_monthly, price_yearly, currency,
    document_limit, api_calls_limit, storage_limit_gb,
    priority_support, custom_styles, team_collaboration,
    is_popular, is_active, features, billing_cycles
) VALUES 
(
    'Free',
    'Perfect for getting started',
    0, 0, 'USD',
    5, 100, 1,
    FALSE, FALSE, FALSE,
    FALSE, TRUE,
    '["5 documents per month", "Basic formatting styles", "Email support"]'::jsonb,
    '["monthly"]'::jsonb
),
(
    'Pro',
    'Great for individuals & Students',
    999, 9990, 'USD',
    50, 1000, 5,
    FALSE, TRUE, FALSE,
    FALSE, TRUE,
    '["50 documents per month", "Custom formatting styles", "Priority email support", "Advanced templates"]'::jsonb,
    '["monthly","yearly"]'::jsonb
),
(
    'Business',
    'Perfect for professionals',
    1999, 19990, 'USD',
    200, 5000, 20,
    TRUE, TRUE, TRUE,
    TRUE, TRUE,
    '["200 documents per month", "Unlimited custom styles", "Priority support", "Team collaboration", "API access"]'::jsonb,
    '["monthly","yearly"]'::jsonb
),
(
    'Enterprise',
    'For large organizations',
    4999, 49990, 'USD',
    -1, -1, -1,
    TRUE, TRUE, TRUE,
    FALSE, TRUE,
    '["Unlimited documents", "Unlimited API calls", "Unlimited storage", "24/7 phone support", "Custom integrations", "SLA guarantee"]'::jsonb,
    '["monthly","yearly"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    currency = EXCLUDED.currency,
    document_limit = EXCLUDED.document_limit,
    api_calls_limit = EXCLUDED.api_calls_limit,
    storage_limit_gb = EXCLUDED.storage_limit_gb,
    features = EXCLUDED.features,
    priority_support = EXCLUDED.priority_support,
    custom_styles = EXCLUDED.custom_styles,
    team_collaboration = EXCLUDED.team_collaboration,
    billing_cycles = EXCLUDED.billing_cycles;
