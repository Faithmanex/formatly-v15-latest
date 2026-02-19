-- Create formatting_styles table
CREATE TABLE IF NOT EXISTS formatting_styles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create english_variants table
CREATE TABLE IF NOT EXISTS english_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default formatting styles
INSERT INTO formatting_styles (name, code, description, sort_order) VALUES
('APA (7th Edition)', 'APA', 'American Psychological Association style - widely used in psychology, education, and social sciences', 1),
('MLA (9th Edition)', 'MLA', 'Modern Language Association style - commonly used in literature, arts, and humanities', 2),
('Chicago (17th Edition)', 'Chicago', 'Chicago Manual of Style - used in history, literature, and the arts', 3),
('Harvard', 'Harvard', 'Harvard referencing style - popular in business, economics, and social sciences', 4),
('IEEE', 'IEEE', 'Institute of Electrical and Electronics Engineers style - used in engineering and computer science', 5),
('Vancouver', 'Vancouver', 'Vancouver referencing style - commonly used in medical and scientific publications', 6),
('Oxford', 'Oxford', 'Oxford referencing style - used in various academic disciplines', 7),
('Turabian', 'Turabian', 'Turabian style - simplified version of Chicago style for students', 8)
ON CONFLICT (code) DO NOTHING;

-- Insert default English variants
INSERT INTO english_variants (name, code, description, sort_order) VALUES
('US English', 'US', 'American English spelling and grammar conventions', 1),
('UK English', 'UK', 'British English spelling and grammar conventions', 2),
('Canadian English', 'CA', 'Canadian English spelling and grammar conventions', 3),
('Australian English', 'AU', 'Australian English spelling and grammar conventions', 4),
('New Zealand English', 'NZ', 'New Zealand English spelling and grammar conventions', 5),
('South African English', 'ZA', 'South African English spelling and grammar conventions', 6)
ON CONFLICT (code) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_formatting_styles_active ON formatting_styles(is_active);
CREATE INDEX IF NOT EXISTS idx_formatting_styles_sort ON formatting_styles(sort_order);
CREATE INDEX IF NOT EXISTS idx_english_variants_active ON english_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_english_variants_sort ON english_variants(sort_order);

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE formatting_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE english_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (these are reference tables)
CREATE POLICY "Allow public read access to formatting_styles" ON formatting_styles
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to english_variants" ON english_variants
    FOR SELECT USING (true);

-- Create policies for admin write access
CREATE POLICY "Allow admin write access to formatting_styles" ON formatting_styles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow admin write access to english_variants" ON english_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
