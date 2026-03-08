-- Drop the existing get_system_stats function
DROP FUNCTION IF EXISTS public.get_system_stats();

-- Function to get real system statistics (for admin panel)
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_users', (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE status = 'active'),
    'total_documents', (SELECT COUNT(*) FROM documents),
    'documents_today', (SELECT COUNT(*) FROM documents WHERE created_at >= CURRENT_DATE),
    'avg_processing_time', 45, -- Placeholder for now, can be calculated from logs
    'system_health', 100, -- Placeholder
    'storage_used', 0 -- Placeholder
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users (Admin role should be checked in frontend/policies)
GRANT EXECUTE ON FUNCTION public.get_system_stats() TO authenticated;

-- COMMENT ON FUNCTION
COMMENT ON FUNCTION public.get_system_stats() IS 'Returns real-time system statistics for the admin panel.';
