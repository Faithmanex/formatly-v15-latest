-- Migration to remove Stripe-related columns from the database
-- This script drops all columns previously used for Stripe integration.

-- Profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_customer_id;

-- Subscription Plans table
ALTER TABLE public.subscription_plans DROP COLUMN IF EXISTS stripe_price_id_monthly;
ALTER TABLE public.subscription_plans DROP COLUMN IF EXISTS stripe_price_id_yearly;

-- Subscriptions table
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS stripe_customer_id;

-- Invoices table
ALTER TABLE public.invoices DROP COLUMN IF EXISTS stripe_invoice_id;

-- Payment Methods table
ALTER TABLE public.payment_methods DROP COLUMN IF EXISTS stripe_payment_method_id;
