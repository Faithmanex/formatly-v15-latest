-- Function to increment document usage
CREATE OR REPLACE FUNCTION increment_document_usage(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET documents_used = documents_used + 1,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system statistics (for admin)
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_users', (SELECT COUNT(*) FROM profiles WHERE role != 'guest'),
    'total_documents', (SELECT COUNT(*) FROM documents),
    'documents_today', (SELECT COUNT(*) FROM documents WHERE created_at >= CURRENT_DATE),
    'processing_documents', (SELECT COUNT(*) FROM documents WHERE status = 'processing'),
    'failed_documents', (SELECT COUNT(*) FROM documents WHERE status = 'failed')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old notifications (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_read = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create system log entry
CREATE OR REPLACE FUNCTION create_system_log(
  log_level TEXT,
  log_message TEXT,
  log_user_id UUID DEFAULT NULL,
  log_document_id UUID DEFAULT NULL,
  log_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO system_logs (level, message, user_id, document_id, metadata)
  VALUES (log_level, log_message, log_user_id, log_document_id, log_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user document statistics
CREATE OR REPLACE FUNCTION get_user_document_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_documents', COUNT(*),
    'formatted_documents', COUNT(*) FILTER (WHERE status = 'formatted'),
    'processing_documents', COUNT(*) FILTER (WHERE status = 'processing'),
    'failed_documents', COUNT(*) FILTER (WHERE status = 'failed'),
    'total_word_count', COALESCE(SUM(word_count), 0),
    'styles_used', json_agg(DISTINCT style_applied)
  )
  FROM documents 
  WHERE documents.user_id = get_user_document_stats.user_id
  INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
