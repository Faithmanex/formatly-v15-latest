-- Fix profiles table to use document_limit instead of document_quota
DO $$ 
BEGIN
    -- Check if document_quota column exists and rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' 
               AND column_name = 'document_quota') THEN
        ALTER TABLE profiles RENAME COLUMN document_quota TO document_limit;
    END IF;
    
    -- Add document_limit column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'document_limit') THEN
        ALTER TABLE profiles ADD COLUMN document_limit INTEGER DEFAULT 5;
    END IF;
END $$;

-- Update existing profiles to have proper document limits
UPDATE profiles 
SET document_limit = COALESCE(document_limit, 5)
WHERE document_limit IS NULL;

-- Set NOT NULL constraint
ALTER TABLE profiles ALTER COLUMN document_limit SET NOT NULL;
