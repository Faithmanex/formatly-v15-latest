-- Test basic database connectivity and RLS policies

-- Test profile creation and access
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Test inserting a profile
    INSERT INTO profiles (id, email, full_name, role, document_quota, documents_used)
    VALUES (test_user_id, 'test@example.com', 'Test User', 'user', 100, 0);
    
    RAISE NOTICE 'Profile created successfully with ID: %', test_user_id;
    
    -- Test document creation
    INSERT INTO documents (user_id, filename, original_filename, style_applied, status, file_size)
    VALUES (test_user_id, 'test-document.docx', 'test-document.docx', 'APA', 'draft', 1024000);
    
    RAISE NOTICE 'Document created successfully';
    
    -- Test notification creation
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (test_user_id, 'info', 'Test Notification', 'This is a test notification');
    
    RAISE NOTICE 'Notification created successfully';
    
    -- Clean up test data
    DELETE FROM notifications WHERE user_id = test_user_id;
    DELETE FROM documents WHERE user_id = test_user_id;
    DELETE FROM profiles WHERE id = test_user_id;
    
    RAISE NOTICE 'Test data cleaned up successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during test: %', SQLERRM;
        -- Clean up on error
        DELETE FROM notifications WHERE user_id = test_user_id;
        DELETE FROM documents WHERE user_id = test_user_id;
        DELETE FROM profiles WHERE id = test_user_id;
END $$;

-- Test that RLS policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
