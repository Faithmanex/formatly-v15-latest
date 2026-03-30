-- SQL script to create the support_tickets table and related permissions
-- Run this in the Supabase SQL Editor

-- 1. Create the support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add table to RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
-- Allow admins to see all tickets
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to update all tickets
CREATE POLICY "Admins can update all tickets" ON public.support_tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow anyone to insert a ticket (including guests)
CREATE POLICY "Anyone can submit a ticket" ON public.support_tickets
    FOR INSERT
    WITH CHECK (true);

-- 4. Enable updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Grant access to authenticated and anon users
GRANT INSERT ON public.support_tickets TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.support_tickets TO authenticated; -- Further restricted by RLS
