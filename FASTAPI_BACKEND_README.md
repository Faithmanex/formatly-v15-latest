# Formatly FastAPI Backend

This is a FastAPI backend for the Formatly document formatting application with full Supabase integration. It provides real JWT authentication, signed URL generation for secure file uploads, and database integration for job tracking.

## Quick Start

### Environment Variables

Before running the backend, set these required environment variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=8000
```

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   export SUPABASE_URL="your_supabase_url"
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   export SUPABASE_JWT_SECRET="your_jwt_secret"
   export SUPABASE_ANON_KEY="your_anon_key"
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```

4. **Access the API:**
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - OpenAPI spec: http://localhost:8000/openapi.json

### Deploy to Render

1. **Create a new Web Service on Render**
2. **Connect your repository**
3. **Configure the service:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python main.py`
   - **Environment:** Python 3.11

4. **Set environment variables:**
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `SUPABASE_JWT_SECRET`: Your Supabase JWT secret
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `PORT`: 8000 (automatically set by Render)

5. **Deploy and get your service URL**

## API Endpoints

### Proper Signed Upload Flow

The backend implements the correct Supabase signed upload flow:

#### **Step 1: Create Upload URL**
- `POST /api/documents/create-upload` - **Recommended Endpoint**
  - Creates signed upload URL using Supabase's `create_signed_upload_url()`
  - Creates document record with DRAFT status
  - Returns job ID, signed URL, and upload headers
  - **Parameters:**
    - `filename` (required): Original filename
    - `style` (required): Formatting style (e.g., "apa", "mla", "chicago")
    - `englishVariant` (required): English variant (e.g., "us", "uk", "ca", "au")
    - `trackedChanges` (optional, default: true): Enable tracked changes output
    - `file_size` (optional): File size in bytes for validation

#### **Step 2: Upload File**
- Frontend uploads file directly to Supabase Storage using the signed URL
- No backend involvement in actual file transfer
- Secure, direct upload to Supabase Storage bucket

#### **Step 3: Confirm Upload**
- `POST /api/documents/upload-complete` - **Webhook Endpoint**
  - Webhook called after successful file upload
  - Updates document status to PROCESSING
  - Starts background document processing
  - Returns confirmation and job status

### Legacy Endpoints (Maintained for Compatibility)
- `POST /api/documents/upload` - Generate signed upload URL (legacy)
- `POST /api/documents/process` - Start document formatting (legacy)

### Status and Download
- `GET /api/documents/status/{job_id}` - Check processing status from database
- `GET /api/documents/download/{job_id}` - Download formatted document

### Configuration
- `GET /api/formatting/styles` - Get available formatting styles from database
- `GET /api/formatting/variants` - Get English variants from database

### Testing Utilities
- `GET /api/jobs` - List all processing jobs (in-memory)
- `DELETE /api/jobs/{job_id}` - Delete a job (in-memory)
- `GET /api/files` - List uploaded files (in-memory)

## Authentication

The backend implements **real Supabase JWT authentication**:

- All protected endpoints require a valid JWT token in the Authorization header
- Tokens are verified against your Supabase JWT secret
- User profiles are fetched from the `profiles` table
- Invalid or expired tokens return 401 Unauthorized

### Frontend Integration

Update your frontend's environment variables:

```env
FASTAPI_BASE_URL=https://your-render-service.onrender.com
NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com
FASTAPI_TIMEOUT=30000
```

Ensure your frontend sends the JWT token in requests:
```javascript
headers: {
  'Authorization': `Bearer ${supabaseToken}`
}
```

## Database Integration

The backend integrates with your Supabase database:

### Tables Used:
- `documents` - Stores document metadata and processing status
- `profiles` - User profile information for authentication
- `active_formatting_styles` - Available formatting styles
- `active_english_variants` - Available English variants

### Proper Document Processing Flow

Following best practices, the system implements this flow:

1. **Create Upload URL** (`/api/documents/create-upload`)
   - Generate signed upload URL using `supabase.storage.create_signed_upload_url()`
   - Create document record with DRAFT status
   - Return job ID and upload URL to frontend

2. **Direct File Upload**
   - Frontend uploads file directly to Supabase Storage using signed URL
   - No backend involvement in file transfer
   - Secure, authenticated upload with proper headers

3. **Upload Confirmation** (`/api/documents/upload-complete`)
   - Frontend calls webhook to confirm successful upload
   - Backend updates document status to PROCESSING
   - Background processing starts immediately

4. **Status Polling**
   - Frontend polls `/api/documents/status/{job_id}` for updates
   - Real-time status updates from database
   - Progress tracking and error handling

5. **Download Results**
   - `/api/documents/download/{job_id}` provides formatted document
   - Base64 encoded content with metadata
   - Secure, authenticated download

## Document Processing Options

The API supports the following processing options:

### Tracked Changes (Primary Feature)
- **Parameter:** `trackedChanges` (boolean, default: true)
- **Description:** When enabled, the API returns two versions of the document:
  1. **Neat Copy:** Clean formatted document with all changes applied
  2. **Tracked Changes Version:** Document showing all formatting modifications with track changes enabled
- **Use Case:** Allows users to review exactly what formatting changes were made to their document

### Deprecated Options (Removed)
The following options have been removed in favor of the tracked changes implementation:
- ~~`reportOnly`~~ - Replaced by tracked changes feature
- ~~`includeComments`~~ - No longer supported
- ~~`preserveFormatting`~~ - No longer supported
- ~~`completeEditing`~~ - No longer supported

## File Storage

Documents are stored in Supabase Storage following best practices:

- **Bucket**: `documents`
- **Path Structure**: `{user_id}/{uuid}.{extension}`
- **Security**: Signed URLs for secure uploads with proper authentication
- **Headers**: Correct `apikey` and `Authorization` headers included
- **Access**: Authenticated users can only access their own files
- **Upload Method**: Direct upload to Supabase Storage (not through backend)

### Signed Upload URL Implementation

The backend correctly implements Supabase's signed upload URL system:

```python
# Generate signed upload URL with proper headers
response = supabase.storage.from_("documents").create_signed_upload_url(unique_filename)

upload_headers = {
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "x-upsert": "true"
}
```

## Testing

### Health Check
```bash
curl https://your-service.onrender.com/health
```

### Test Proper Upload Flow

#### Step 1: Create Upload URL
```bash
curl -X POST "https://your-service.onrender.com/api/documents/create-upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "filename=test.docx" \
  -F "style=apa" \
  -F "englishVariant=us" \
  -F "trackedChanges=true"
```

#### Step 2: Upload File (Frontend handles this)
```bash
# Frontend uploads directly to the signed URL returned in step 1
curl -X PUT "SIGNED_UPLOAD_URL_FROM_STEP_1" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @test.docx
```

#### Step 3: Confirm Upload
```bash
curl -X POST "https://your-service.onrender.com/api/documents/upload-complete" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_id": "JOB_ID_FROM_STEP_1", "file_path": "path/to/file", "success": true}'
```

#### Step 4: Check Status
```bash
curl -X GET "https://your-service.onrender.com/api/documents/status/JOB_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Current Implementation

### Fully Implemented Features
- **Proper Signed Upload Flow** - Following Supabase best practices
- **Real JWT Authentication** with Supabase
- **Direct File Upload** to Supabase Storage (no backend file handling)
- **Webhook Confirmation** system for upload completion
- **Database Integration** for job tracking and user management
- **Document Status Tracking** in real-time
- **User Profile Integration** from Supabase
- **Formatting Styles/Variants** from database
- **Secure File Access** with proper authentication
- **Tracked Changes Output** - Primary feature for showing formatting modifications
- **Error Handling** and logging throughout the flow

### Mock Features (To Be Implemented):
- **Actual Document Processing** - Currently simulated with 4-second delay
- **Real Document Formatting** - Returns mock formatted content
- **File Processing Logic** - Actual Word document manipulation

## Production Considerations

The backend is production-ready with the new signed upload flow:

### Production Ready:
- **Secure Upload Flow** - Direct to Supabase Storage with signed URLs
- **JWT authentication and authorization** - Real Supabase integration
- **Database integration** with proper error handling
- **Webhook system** for upload confirmation
- **Proper logging** and error handling throughout
- **CORS configuration** for frontend integration
- **Environment variable** configuration
- **Status polling** system for real-time updates
- **Tracked changes implementation** - Modern approach to showing formatting modifications

### Still Needed:
1. **Implement actual document processing** logic
2. **Add document parsing** (python-docx, PyPDF2, etc.)
3. **Implement formatting rules** for different styles
4. **Add queue system** (Redis + Celery) for scalability
5. **Add monitoring** and health checks
6. **Implement rate limiting** for API endpoints

## Architecture Notes

The system follows proper architecture patterns:

- **Frontend** → Creates upload URL via `/api/documents/create-upload`
- **Frontend** → Uploads file directly to Supabase Storage (bypassing backend)
- **Frontend** → Confirms upload via `/api/documents/upload-complete` webhook
- **Backend** → Processes document and updates status in database
- **Frontend** → Polls for status updates and downloads results

### Key Improvements:
- **No file handling in backend** - Files go directly to Supabase Storage
- **Proper signed URLs** - Secure, time-limited upload URLs
- **Webhook confirmation** - Reliable upload completion detection
- **Real-time status** - Database-driven status updates
- **Secure downloads** - Authenticated access to formatted documents
- **Tracked changes** - Modern implementation replacing report-only mode

This implementation provides a robust, scalable foundation for document processing with proper security and error handling.

## Troubleshooting

### Common Connection Issues

#### "Failed to fetch" or "Connection refused" Errors

If you're seeing connection errors in the frontend, follow these steps:

1. **Check if FastAPI Backend is Running**
   ```bash
   # Start the FastAPI backend locally
   python main.py
   
   # Or with uvicorn
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Verify Backend URL Configuration**
   ```bash
   # Check your environment variables
   echo $FASTAPI_BASE_URL
   echo $NEXT_PUBLIC_API_URL
   ```
   
   The frontend will use these URLs in this priority order:
   - `FASTAPI_BASE_URL` (preferred)
   - `NEXT_PUBLIC_API_URL` (fallback)
   - `http://localhost:8000` (default)

3. **Test Backend Connectivity**
   ```bash
   # Test if backend is accessible
   curl http://localhost:8000/health
   
   # Should return: {"status": "healthy", "timestamp": "..."}
   ```

4. **Check Backend Logs**
   Look for these log messages when starting the backend:
   ```
   INFO:     Started server process
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

#### Environment Variable Issues

If the backend starts but authentication fails:

1. **Verify Supabase Environment Variables**
   ```bash
   # All of these must be set
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY  
   echo $SUPABASE_JWT_SECRET
   echo $SUPABASE_ANON_KEY
   ```

2. **Check Frontend Environment Variables**
   ```bash
   # Frontend needs these for API calls
   echo $FASTAPI_BASE_URL
   echo $NEXT_PUBLIC_API_URL
   ```

#### Network/Firewall Issues

If running in different environments:

1. **Docker/Container Issues**
   - Use `host.docker.internal:8000` instead of `localhost:8000` when frontend is in Docker
   - Ensure ports are properly exposed

2. **Production Deployment**
   - Update `FASTAPI_BASE_URL` to your deployed backend URL
   - Ensure CORS is properly configured for your frontend domain

#### Quick Diagnostic Commands

```bash
# 1. Check if backend process is running
ps aux | grep python | grep main.py

# 2. Check if port 8000 is in use
lsof -i :8000

# 3. Test backend health endpoint
curl -v http://localhost:8000/health

# 4. Test with authentication (replace TOKEN with real JWT)
curl -X POST http://localhost:8000/api/documents/create-upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "filename=test.docx" \
  -F "style=apa" \
  -F "englishVariant=us"
```

### Error Code Reference

- **503 Service Unavailable**: FastAPI backend is not running or not accessible
- **504 Gateway Timeout**: Backend is running but not responding (check backend logs)
- **401 Unauthorized**: JWT token is missing, invalid, or expired
- **500 Internal Server Error**: Backend error (check backend logs for details)

### Getting Help

If you're still experiencing issues:

1. **Check the browser console** for detailed error messages
2. **Check the FastAPI backend logs** for server-side errors
3. **Verify all environment variables** are correctly set
4. **Test the backend independently** using curl commands above
5. **Ensure your Supabase project** is properly configured with the required tables
