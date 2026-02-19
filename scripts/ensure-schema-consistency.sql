-- Comprehensive script to ensure database schema consistency
-- This script fixes all naming mismatches and ensures proper column names

DO $$ 
BEGIN
    -- Fix profiles table column naming
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' 
               AND column_name = 'document_quota') THEN
        ALTER TABLE profiles RENAME COLUMN document_quota TO document_limit;
        RAISE NOTICE 'Renamed document_quota to document_limit in profiles table';
    END IF;
    
    -- Add document_limit column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'document_limit') THEN
        ALTER TABLE profiles ADD COLUMN document_limit INTEGER DEFAULT 5;
        RAISE NOTICE 'Added document_limit column to profiles table';
    END IF;
    
    -- Add formatting_preferences column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'formatting_preferences') THEN
        ALTER TABLE profiles ADD COLUMN formatting_preferences JSONB DEFAULT '{}';
        RAISE NOTICE 'Added formatting_preferences column to profiles table';
    END IF;
END $$;

-- Update existing profiles to have proper values
UPDATE profiles 
SET 
    document_limit = COALESCE(document_limit, 5),
    formatting_preferences = COALESCE(formatting_preferences, jsonb_build_object(
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
    ))
WHERE document_limit IS NULL OR formatting_preferences IS NULL OR formatting_preferences = '{}';

-- Set NOT NULL constraints
ALTER TABLE profiles ALTER COLUMN document_limit SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN formatting_preferences SET NOT NULL;

-- Recreate the handle_new_user function with correct column names
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user function: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the schema is correct
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'document_limit') THEN
        RAISE EXCEPTION 'Schema consistency check failed: document_limit column missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' 
               AND column_name = 'document_quota') THEN
        RAISE EXCEPTION 'Schema consistency check failed: document_quota column still exists';
    END IF;
    
    RAISE NOTICE 'Schema consistency check passed: All column names are correct';
END $$;
