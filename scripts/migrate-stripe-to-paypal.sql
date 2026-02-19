-- Migration script: Replace Stripe with PayPal
-- This script updates the database schema to use PayPal instead of Stripe

-- Update subscription_plans table
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS paypal_plan_id_monthly VARCHAR(255),
ADD COLUMN IF NOT EXISTS paypal_plan_id_yearly VARCHAR(255);

-- Populate PayPal plan IDs for existing plans
UPDATE subscription_plans
SET 
  paypal_plan_id_monthly = CASE 
    WHEN name = 'Pro' THEN 'P-91A156471R160720SND2UYJQ'
    WHEN name = 'Business' THEN 'P-33Y990793W873362UND2VB7A'
    ELSE NULL
  END,
  paypal_plan_id_yearly = CASE 
    WHEN name = 'Pro' THEN 'P-6LC13956890715232ND2V5QA'
    WHEN name = 'Business' THEN 'P-990649366E456620KND2WEKA'
    ELSE NULL
  END
WHERE name IN ('Pro', 'Business');

-- Update subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(255) UNIQUE;

-- Update invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS paypal_transaction_id VARCHAR(255) UNIQUE;

-- Update payment_methods table
ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS paypal_payment_method_id VARCHAR(255) UNIQUE;

-- Update profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS paypal_customer_id VARCHAR(255) UNIQUE;

-- Create indexes for PayPal fields
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_paypal_transaction_id ON invoices(paypal_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_paypal_id ON payment_methods(paypal_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_profiles_paypal_customer_id ON profiles(paypal_customer_id);

-- Add comment to document the migration
COMMENT ON COLUMN subscription_plans.paypal_plan_id_monthly IS 'PayPal subscription plan ID for monthly billing';
COMMENT ON COLUMN subscription_plans.paypal_plan_id_yearly IS 'PayPal subscription plan ID for yearly billing';
COMMENT ON COLUMN subscriptions.paypal_subscription_id IS 'PayPal subscription ID for tracking active subscriptions';
COMMENT ON COLUMN invoices.paypal_transaction_id IS 'PayPal transaction ID for invoice tracking';
COMMENT ON COLUMN payment_methods.paypal_payment_method_id IS 'PayPal payment method ID';
COMMENT ON COLUMN profiles.paypal_customer_id IS 'PayPal customer ID for user account';
