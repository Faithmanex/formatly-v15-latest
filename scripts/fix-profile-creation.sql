-- Update the handle_new_user function to use UPSERT to avoid duplicate key errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Use UPSERT to handle cases where profile might already exist
    INSERT INTO public.profiles (id, email, full_name, role, document_quota, documents_used)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'user',
        100,
        0
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clean up any potential duplicate or orphaned profiles
-- This is safe to run multiple times
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count duplicates before cleanup
    SELECT COUNT(*) - COUNT(DISTINCT id) INTO duplicate_count FROM profiles;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate profiles, cleaning up...', duplicate_count;
        
        -- Remove duplicates, keeping the most recent one
        DELETE FROM profiles p1 
        WHERE p1.ctid NOT IN (
            SELECT DISTINCT ON (p2.id) p2.ctid
            FROM profiles p2
            ORDER BY p2.id, p2.created_at DESC
        );
        
        RAISE NOTICE 'Cleanup completed';
    ELSE
        RAISE NOTICE 'No duplicate profiles found';
    END IF;
END $$;
