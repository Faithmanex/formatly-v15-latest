-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('guest', 'user', 'admin');
CREATE TYPE document_status AS ENUM ('draft', 'processing', 'formatted', 'failed');
CREATE TYPE notification_type AS ENUM ('success', 'error', 'info', 'warning');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    document_limit INTEGER DEFAULT 5,
    documents_used INTEGER DEFAULT 0,
    formatting_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    status document_status DEFAULT 'draft',
    style_applied TEXT NOT NULL,
    word_count INTEGER,
    headings_count INTEGER,
    references_count INTEGER,
    processing_log JSONB,
    storage_location TEXT,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_styles table
CREATE TABLE IF NOT EXISTS custom_styles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    settings JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_global BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_text TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_keys table (for admin functionality)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_preview TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_logs table (for admin functionality)
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_custom_styles_user_id ON custom_styles(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for documents
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for custom_styles
CREATE POLICY "Users can view own styles and global styles" ON custom_styles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        is_global = TRUE OR
        user_id IS NULL
    );

CREATE POLICY "Users can insert own styles" ON custom_styles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own styles" ON custom_styles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own styles" ON custom_styles
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage global styles" ON custom_styles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (TRUE);

-- Create RLS policies for api_keys (admin only)
CREATE POLICY "Admins can manage api keys" ON api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for system_logs (admin only)
CREATE POLICY "Admins can view system logs" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert logs" ON system_logs
    FOR INSERT WITH CHECK (TRUE);

-- Create functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, document_limit, formatting_preferences)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        5,
        jsonb_build_object(
            'defaultStyle', 'APA',
            'defaultFont', 'times',
            'fontSize', '12',
            'lineSpacing', 'double',
            'includeTOC', true,
            'pageNumbers', 'header-right',
            'margins', '1',
            'citationStyle', 'apa',
            'englishVariant', 'US',
            'reportOnly', false,
            'includeComments', true,
            'preserveFormatting', false
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON custom_styles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default global styles
INSERT INTO custom_styles (user_id, name, description, settings, is_global, is_default) VALUES
(NULL, 'APA 7th Edition', 'American Psychological Association 7th Edition', '{
    "font": "Times New Roman",
    "fontSize": 12,
    "lineSpacing": "double",
    "margins": "1 inch",
    "citationStyle": "apa",
    "includeTOC": false,
    "pageNumbers": "header-right",
    "titlePage": true,
    "runningHead": true
}', TRUE, FALSE),
(NULL, 'MLA 9th Edition', 'Modern Language Association 9th Edition', '{
    "font": "Times New Roman",
    "fontSize": 12,
    "lineSpacing": "double",
    "margins": "1 inch",
    "citationStyle": "mla",
    "includeTOC": false,
    "pageNumbers": "header-right",
    "titlePage": false,
    "runningHead": false
}', TRUE, FALSE),
(NULL, 'Harvard Style', 'Harvard Referencing Style', '{
    "font": "Times New Roman",
    "fontSize": 12,
    "lineSpacing": "double",
    "margins": "1 inch",
    "citationStyle": "harvard",
    "includeTOC": true,
    "pageNumbers": "footer-center",
    "titlePage": true,
    "runningHead": false
}', TRUE, FALSE),
(NULL, 'Chicago Style', 'Chicago Manual of Style', '{
    "font": "Times New Roman",
    "fontSize": 12,
    "lineSpacing": "double",
    "margins": "1 inch",
    "citationStyle": "chicago",
    "includeTOC": true,
    "pageNumbers": "footer-center",
    "titlePage": true,
    "runningHead": false
}', TRUE, FALSE);
