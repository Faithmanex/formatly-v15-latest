-- Add formatting_preferences column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS formatting_preferences JSONB DEFAULT '{}';

-- Update the profiles table to include the new column in existing records
UPDATE profiles 
SET formatting_preferences = '{
  "defaultStyle": "APA",
  "defaultFont": "times",
  "fontSize": "12",
  "lineSpacing": "double",
  "includeTOC": true,
  "pageNumbers": "header-right",
  "margins": "1",
  "citationStyle": "apa"
}'::jsonb
WHERE formatting_preferences = '{}' OR formatting_preferences IS NULL;

-- Create index for better performance on formatting preferences queries
CREATE INDEX IF NOT EXISTS idx_profiles_formatting_preferences 
ON profiles USING GIN (formatting_preferences);

-- Update custom_styles table to ensure proper structure
ALTER TABLE custom_styles 
ALTER COLUMN settings SET DEFAULT '{}';

-- Add some sample global styles if they don't exist
INSERT INTO custom_styles (user_id, name, description, settings, is_global, is_default) 
VALUES 
(NULL, 'APA 7th Edition', 'American Psychological Association 7th Edition standard format', '{
  "font": "times",
  "fontSize": 12,
  "spacing": "double",
  "margins": "1",
  "includeTOC": false,
  "pageNumbers": "header-right",
  "citationStyle": "apa"
}', true, false),
(NULL, 'MLA 9th Edition', 'Modern Language Association 9th Edition standard format', '{
  "font": "times",
  "fontSize": 12,
  "spacing": "double",
  "margins": "1",
  "includeTOC": false,
  "pageNumbers": "header-right",
  "citationStyle": "mla"
}', true, false),
(NULL, 'Harvard Style', 'Harvard referencing system standard format', '{
  "font": "times",
  "fontSize": 12,
  "spacing": "double",
  "margins": "1",
  "includeTOC": true,
  "pageNumbers": "footer-center",
  "citationStyle": "harvard"
}', true, false),
(NULL, 'Chicago Style', 'Chicago Manual of Style standard format', '{
  "font": "times",
  "fontSize": 12,
  "spacing": "double",
  "margins": "1",
  "includeTOC": true,
  "pageNumbers": "footer-center",
  "citationStyle": "chicago"
}', true, false)
ON CONFLICT DO NOTHING;

-- Create function to get user's default formatting preferences
CREATE OR REPLACE FUNCTION get_user_formatting_preferences(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_prefs JSONB;
  default_style JSONB;
BEGIN
  -- Get user's formatting preferences
  SELECT formatting_preferences INTO user_prefs
  FROM profiles
  WHERE id = target_user_id;
  
  -- If user has no preferences, return default
  IF user_prefs IS NULL OR user_prefs = '{}' THEN
    RETURN '{
      "defaultStyle": "APA",
      "defaultFont": "times",
      "fontSize": "12",
      "lineSpacing": "double",
      "includeTOC": true,
      "pageNumbers": "header-right",
      "margins": "1",
      "citationStyle": "apa"
    }'::jsonb;
  END IF;
  
  -- Get user's default custom style if they have one
  SELECT settings INTO default_style
  FROM custom_styles
  WHERE user_id = target_user_id AND is_default = true
  LIMIT 1;
  
  -- Merge custom style settings with user preferences
  IF default_style IS NOT NULL THEN
    RETURN user_prefs || default_style;
  END IF;
  
  RETURN user_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_formatting_preferences(UUID) TO authenticated;
