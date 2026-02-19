# API Documentation

This document describes the API endpoints available in the Formatly application.

## 🔐 Authentication

All API endpoints require authentication unless otherwise specified. Authentication is handled via Supabase Auth with JWT tokens.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## 📄 Document Management

### Upload Document

**POST** `/api/documents/upload`

Get a pre-signed URL for uploading documents to storage.

**Request Body:**
```json
{
  "filename": "document.docx",
  "fileSize": 1024000,
  "contentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
```

**Response:**
```json
{
  "uploadUrl": "https://storage-url/signed-upload-url",
  "jobId": "job_123456789"
}
```

### Process Document

**POST** `/api/documents/process`

Create a formatting job for an uploaded document.

**Request Body:**
```json
{
  "jobId": "job_123456789",
  "filename": "document.docx",
  "style": "APA",
  "englishVariant": "US",
  "reportOnly": false,
  "includeComments": true,
  "preserveFormatting": false
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job_123456789",
  "status": "queued"
}
```

### Get Job Status

**GET** `/api/documents/status/:jobId`

Get the current status of a formatting job.

**Response:**
```json
{
  "status": "processing",
  "progress": 75,
  "downloadUrl": null,
  "error": null,
  "estimatedCompletion": "2024-01-15T10:30:00Z"
}
```

**Status Values:**
- `queued` - Job is waiting to be processed
- `processing` - Job is currently being processed
- `completed` - Job completed successfully
- `failed` - Job failed with error
- `error` - System error occurred

### Download Formatted Document

**GET** `/api/documents/download/:jobId`

Download the formatted document.

**Response:** Binary file download

## 🤖 AI Chat

### Send Message

**POST** `/api/chat`

Send a message to the AI assistant.

**Request Body:**
```json
{
  "message": "How do I format APA citations?",
  "context": "You are Formatly AI, an expert assistant for academic formatting..."
}
```

**Response:**
```json
{
  "response": "APA citations follow a specific format...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 👤 User Management

### Get User Profile

**GET** `/api/user/profile`

Get the current user's profile information.

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://avatar-url.com/avatar.jpg",
  "created_at": "2024-01-01T00:00:00Z",
  "subscription_status": "active",
  "plan_name": "Premium"
}
```

### Update User Profile

**POST** `/api/user/profile`

Update the current user's profile information.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "avatar_url": "https://new-avatar-url.com/avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "user_123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://new-avatar-url.com/avatar.jpg"
  }
}
```

### Get Subscription Details

**GET** `/api/user/subscription`

Get the current user's subscription information.

**Response:**
```json
{
  "subscription": {
    "id": "sub_123",
    "status": "active",
    "plan": {
      "name": "Premium",
      "price_monthly": 1999,
      "price_yearly": 19999,
      "currency": "usd",
      "document_limit": -1,
      "api_calls_limit": 10000,
      "storage_limit_gb": 10
    },
    "current_period_start": "2024-01-01T00:00:00Z",
    "current_period_end": "2024-02-01T00:00:00Z",
    "cancel_at_period_end": false
  },
  "usage": {
    "documents_processed": 25,
    "api_calls_made": 150,
    "storage_used_gb": 2.5,
    "current_period_start": "2024-01-01T00:00:00Z",
    "current_period_end": "2024-02-01T00:00:00Z"
  }
}
```

## 💳 Billing

### Get Usage Statistics

**GET** `/api/billing/usage`

Get detailed usage statistics for the current billing period.

**Response:**
```json
{
  "current_period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-02-01T00:00:00Z"
  },
  "usage": {
    "documents_processed": 25,
    "api_calls_made": 150,
    "storage_used_gb": 2.5
  },
  "limits": {
    "document_limit": -1,
    "api_calls_limit": 10000,
    "storage_limit_gb": 10
  },
  "at_limits": {
    "documents": false,
    "api_calls": false,
    "storage": false
  }
}
```

### Get Billing History

**GET** `/api/billing/history`

Get billing history and invoices.

**Response:**
```json
{
  "invoices": [
    {
      "id": "inv_123",
      "amount": 1999,
      "currency": "usd",
      "status": "paid",
      "created": "2024-01-01T00:00:00Z",
      "period_start": "2024-01-01T00:00:00Z",
      "period_end": "2024-02-01T00:00:00Z",
      "download_url": "https://invoice-url.com/invoice.pdf"
    }
  ]
}
```

## ⚙️ System

### Health Check

**GET** `/api/health`

Check system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "storage": "healthy",
    "ai": "healthy"
  }
}
```

## 🚨 Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid file type provided",
    "details": {
      "field": "filename",
      "allowed_types": ["doc", "docx", "pdf", "txt", "rtf"]
    }
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` - User not authenticated
- `AUTHORIZATION_FAILED` - User not authorized for action
- `VALIDATION_ERROR` - Request validation failed
- `QUOTA_EXCEEDED` - Usage quota exceeded
- `FILE_TOO_LARGE` - File exceeds size limit
- `UNSUPPORTED_FILE_TYPE` - File type not supported
- `PROCESSING_FAILED` - Document processing failed
- `INTERNAL_ERROR` - Server error occurred

## 📊 Rate Limits

API endpoints are rate limited to prevent abuse:

- **Document Upload**: 10 requests per minute
- **AI Chat**: 30 requests per minute
- **General API**: 100 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642262400
```

## 🔧 Development

### Testing API Endpoints

Use the provided test scripts or tools like Postman/Insomnia:

```bash
# Test health endpoint
curl -X GET http://localhost:3000/api/health

# Test authenticated endpoint
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer <jwt_token>"
```

### API Client Libraries

Consider using generated API clients for type safety:

```typescript
// Example TypeScript client usage
import { ApiClient } from './lib/api-client'

const client = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  token: userToken
})

const profile = await client.user.getProfile()
const uploadUrl = await client.documents.getUploadUrl({
  filename: 'document.docx',
  fileSize: 1024000
})
```

This API documentation provides comprehensive coverage of all available endpoints in the Formatly application.
