-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_preview text NOT NULL,
  created_by uuid NOT NULL,
  last_used_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT api_keys_pkey PRIMARY KEY (id),
  CONSTRAINT api_keys_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.billing_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text,
  postal_code text NOT NULL,
  country text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT billing_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT billing_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.custom_styles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  description text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean DEFAULT false,
  is_global boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_styles_pkey PRIMARY KEY (id),
  CONSTRAINT custom_styles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  filename text NOT NULL,
  original_filename text NOT NULL,
  status USER-DEFINED DEFAULT 'draft'::document_status,
  style_applied text NOT NULL,
  word_count integer,
  processing_log jsonb,
  storage_location text,
  file_size bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  language_variant character varying DEFAULT 'US'::character varying,
  file_type character varying,
  processed_at timestamp with time zone,
  formatting_options jsonb,
  tracked_changes boolean DEFAULT false,
  result_url text,
  formatting_time double precision,
  tracked_changes_url text,
  error_message text,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.english_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  code character varying NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT english_variants_pkey PRIMARY KEY (id)
);
CREATE TABLE public.formatting_styles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  code character varying NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT formatting_styles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid,
  amount_due numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  currency text DEFAULT 'usd'::text,
  status text NOT NULL CHECK (status = ANY (ARRAY['draft'::text, 'open'::text, 'paid'::text, 'void'::text, 'uncollectible'::text])),
  invoice_number text,
  invoice_pdf_url text,
  due_date timestamp with time zone,
  paid_at timestamp with time zone,
  billing_reason text,
  description text,
  line_items jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  paypal_transaction_id character varying UNIQUE,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id),
  CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  action_text text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  paypal_payment_method_id character varying UNIQUE,
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  role USER-DEFINED DEFAULT 'user'::user_role,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  subscription_id uuid,
  formatting_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  paypal_customer_id character varying UNIQUE,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id)
);
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  price_monthly numeric NOT NULL,
  price_yearly numeric,
  document_limit integer NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  billing_cycles jsonb NOT NULL DEFAULT '["monthly", "yearly"]'::jsonb,
  currency character varying NOT NULL DEFAULT 'usd'::character varying,
  api_calls_limit integer NOT NULL,
  storage_limit_gb integer NOT NULL,
  is_popular boolean,
  priority_support boolean NOT NULL DEFAULT false,
  custom_styles boolean NOT NULL DEFAULT false,
  team_collaboration boolean NOT NULL DEFAULT false,
  paypal_plan_id_monthly character varying,
  paypal_plan_id_yearly character varying,
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'canceled'::text, 'past_due'::text, 'unpaid'::text, 'trialing'::text])),
  billing_cycle text NOT NULL CHECK (billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  current_period_start timestamp with time zone NOT NULL,
  current_period_end timestamp with time zone NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  pending_plan_id uuid,
  pending_plan_effective_date timestamp with time zone,
  plan_change_reason text,
  previous_plan_id uuid,
  pending_change_date timestamp with time zone,
  change_reason text,
  documents_used integer DEFAULT 0,
  api_calls_used integer DEFAULT 0,
  storage_used_gb bigint DEFAULT 0.00,
  last_usage_reset timestamp with time zone DEFAULT now(),
  paypal_subscription_id character varying UNIQUE,
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT subscriptions_pending_plan_id_fkey FOREIGN KEY (pending_plan_id) REFERENCES public.subscription_plans(id),
  CONSTRAINT subscriptions_previous_plan_id_fkey FOREIGN KEY (previous_plan_id) REFERENCES public.subscription_plans(id)
);
CREATE TABLE public.system_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  level text NOT NULL,
  message text NOT NULL,
  user_id uuid,
  document_id uuid,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_logs_pkey PRIMARY KEY (id),
  CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT system_logs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.waitlist (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  full_name text,
  email character varying NOT NULL,
  CONSTRAINT waitlist_pkey PRIMARY KEY (email)
);