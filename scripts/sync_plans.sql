-- SQL Script to sync subscription plans
-- This script inserts or updates the plans based on the latest requested details

-- Ensure handle_updated_at function exists (standard Supabase function)
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Upsert Subscription Plans
INSERT INTO public.subscription_plans (
    name, 
    description, 
    price_monthly, 
    price_yearly, 
    document_limit, 
    features, 
    is_active, 
    billing_cycles, 
    currency, 
    api_calls_limit, 
    storage_limit_gb, 
    is_popular, 
    priority_support, 
    custom_styles, 
    team_collaboration
) VALUES 
(
    'Free', 
    'Get started with Formatly', 
    0.00, 
    0.00, 
    3, 
    '["3 documents per month", "APA Style formatting only", "Standard Email Support"]'::jsonb, 
    true, 
    '["monthly"]'::jsonb, 
    'usd', 
    0, 
    999999, 
    false, 
    false, 
    false, 
    false
),
(
    'Pro', 
    'Great for students and professionals', 
    12.00, 
    120.00, 
    50, 
    '[
        "Everything in Free, plus:", 
        "50 documents per month", 
        "All formatting styles|MLA, Chicago, Harvard, AMA, IEEE", 
        "Tracked Changes|Full transparency on every structural adjustment", 
        "Custom styles|Tailor formatting to specific journal or institutional requirements", 
        "AI Assistant|Real-time intelligence to refine your document’s flow", 
        "Priority email support"
    ]'::jsonb, 
    true, 
    '["monthly", "yearly"]'::jsonb, 
    'usd', 
    0, 
    999999, 
    true, 
    true, 
    true, 
    false
),
(
    'Business', 
    'For research teams and organisations', 
    39.00, 
    390.00, 
    -1, 
    '[
        "Everything in Pro, plus:", 
        "Unlimited Documents for your entire team.", 
        "Centralized Billing and seat management.", 
        "Advanced Collaboration|Share styles and templates across the organization.", 
        "SSO & Enterprise Security|Keeping your proprietary research protected."
    ]'::jsonb, 
    true, 
    '["monthly", "yearly"]'::jsonb, 
    'usd', 
    -1, 
    999999, 
    false, 
    true, 
    true, 
    true
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    document_limit = EXCLUDED.document_limit,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    billing_cycles = EXCLUDED.billing_cycles,
    api_calls_limit = EXCLUDED.api_calls_limit,
    storage_limit_gb = EXCLUDED.storage_limit_gb,
    is_popular = EXCLUDED.is_popular,
    priority_support = EXCLUDED.priority_support,
    custom_styles = EXCLUDED.custom_styles,
    team_collaboration = EXCLUDED.team_collaboration,
    updated_at = NOW();
