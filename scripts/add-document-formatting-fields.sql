-- Add new columns to documents table for enhanced formatting options
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS language_variant VARCHAR(10) DEFAULT 'US',
ADD COLUMN IF NOT EXISTS report_only BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_language_variant ON documents(language_variant);
CREATE INDEX IF NOT EXISTS idx_documents_report_only ON documents(report_only);

-- Update the documents table comment
COMMENT ON COLUMN documents.language_variant IS 'English language variant (US, UK, CA, AU)';
COMMENT ON COLUMN documents.report_only IS 'Whether to generate only a formatting report without modifying the document';
