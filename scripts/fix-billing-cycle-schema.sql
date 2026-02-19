-- Add billing_cycle column to subscriptions table if it doesn't exist
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(10) NOT NULL DEFAULT 'monthly';

-- Add constraint to ensure billing_cycle is either 'monthly' or 'yearly'
ALTER TABLE subscriptions 
ADD CONSTRAINT check_billing_cycle 
CHECK (billing_cycle IN ('monthly', 'yearly'));

-- Update existing subscriptions to have a billing_cycle
UPDATE subscriptions 
SET billing_cycle = 'monthly' 
WHERE billing_cycle IS NULL;
