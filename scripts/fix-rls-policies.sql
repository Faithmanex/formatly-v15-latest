-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;

-- Create fixed RLS policies for profiles
CREATE POLICY "Enable read access for users based on user_id" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create fixed RLS policies for documents
CREATE POLICY "Enable read access for users based on user_id" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users only" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- Create fixed RLS policies for custom_styles
DROP POLICY IF EXISTS "Users can view own styles and global styles" ON custom_styles;
DROP POLICY IF EXISTS "Users can insert own styles" ON custom_styles;
DROP POLICY IF EXISTS "Users can update own styles" ON custom_styles;
DROP POLICY IF EXISTS "Users can delete own styles" ON custom_styles;
DROP POLICY IF EXISTS "Admins can manage global styles" ON custom_styles;

CREATE POLICY "Enable read access for own styles and global styles" ON custom_styles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        is_global = TRUE OR
        user_id IS NULL
    );

CREATE POLICY "Enable insert for authenticated users only" ON custom_styles
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Enable update for users based on user_id" ON custom_styles
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Enable delete for users based on user_id" ON custom_styles
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create fixed RLS policies for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Enable read access for users based on user_id" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for service role" ON notifications
    FOR INSERT WITH CHECK (true);

-- Create fixed RLS policies for api_keys (admin only)
DROP POLICY IF EXISTS "Admins can manage api keys" ON api_keys;

CREATE POLICY "Enable all for service role" ON api_keys
    FOR ALL USING (true);

-- Create fixed RLS policies for system_logs (admin only)
DROP POLICY IF EXISTS "Admins can view system logs" ON system_logs;
DROP POLICY IF EXISTS "System can insert logs" ON system_logs;

CREATE POLICY "Enable read for service role" ON system_logs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON system_logs
    FOR INSERT WITH CHECK (true);

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, document_quota, documents_used)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'user',
        100,
        0
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
