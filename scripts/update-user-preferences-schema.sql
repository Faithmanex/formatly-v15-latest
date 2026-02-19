-- Update the profiles table to include the new formatting preference fields
-- This script adds the new fields to the formatting_preferences JSONB column

-- First, let's update existing profiles to include the new fields with default values
UPDATE profiles 
SET formatting_preferences = COALESCE(formatting_preferences, '{}'::jsonb) || jsonb_build_object(
    'englishVariant', COALESCE(formatting_preferences->>'englishVariant', 'US'),
    'reportOnly', COALESCE((formatting_preferences->>'reportOnly')::boolean, false),
    'includeComments', COALESCE((formatting_preferences->>'includeComments')::boolean, true),
    'preserveFormatting', COALESCE((formatting_preferences->>'preserveFormatting')::boolean, false)
)
WHERE formatting_preferences IS NOT NULL;

-- Update profiles that don't have formatting_preferences set yet
UPDATE profiles 
SET formatting_preferences = jsonb_build_object(
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
WHERE formatting_preferences IS NULL;

-- Create or update the function to get user formatting preferences
CREATE OR REPLACE FUNCTION get_user_formatting_preferences(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_prefs JSONB;
    default_prefs JSONB := jsonb_build_object(
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
    );
BEGIN
    -- Get user preferences
    SELECT formatting_preferences INTO user_prefs
    FROM profiles
    WHERE id = target_user_id;
    
    -- If no preferences found, return defaults
    IF user_prefs IS NULL THEN
        RETURN default_prefs;
    END IF;
    
    -- Merge user preferences with defaults (user preferences take precedence)
    RETURN default_prefs || user_prefs;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_formatting_preferences(UUID) TO authenticated;

-- Add some helpful comments
COMMENT ON TABLE formatting_styles IS 'Available academic formatting styles (APA, MLA, Chicago, etc.)';
COMMENT ON TABLE english_variants IS 'Available English language variants (US, UK, Canadian, etc.)';
COMMENT ON FUNCTION get_user_formatting_preferences(UUID) IS 'Returns user formatting preferences merged with defaults';

-- Create a view for active formatting styles (for easier querying)
CREATE OR REPLACE VIEW active_formatting_styles AS
SELECT id, name, code, description, sort_order
FROM formatting_styles
WHERE is_active = true
ORDER BY sort_order, name;

-- Create a view for active English variants
CREATE OR REPLACE VIEW active_english_variants AS
SELECT id, name, code, description, sort_order
FROM english_variants
WHERE is_active = true
ORDER BY sort_order, name;

-- Grant select permissions on the views
GRANT SELECT ON active_formatting_styles TO authenticated;
GRANT SELECT ON active_english_variants TO authenticated;
