# Formatly - Professional Document Formatting Platform

Formatly is a comprehensive web application that provides professional academic document formatting services with AI assistance. Built with Next.js, TypeScript, and Supabase, it offers automated formatting for multiple citation styles including APA, MLA, Harvard, and Chicago.

## 🚀 Features

### Document Formatting
- **Multi-format Support**: DOC, DOCX, PDF, TXT, RTF files up to 10MB
- **Citation Styles**: APA, MLA, Harvard, Chicago with proper formatting rules
- **Real-time Processing**: Live status updates and progress tracking
- **Batch Processing**: Upload up to 5 documents simultaneously
- **Download System**: Formatted documents available for immediate download

### AI Assistant
- **Formatly AI**: Interactive chat interface for formatting questions
- **Context-Aware**: Specialized in academic formatting and citation styles
- **Markdown Support**: Rich text responses with code blocks and examples
- **Pre-built Prompts**: Common formatting questions and examples

### User Management & Billing
- **Subscription Plans**: Free and Premium tiers with different limits
- **Usage Tracking**: Real-time monitoring of documents processed, API calls, and storage
- **Billing Dashboard**: Comprehensive subscription and payment management
- **Quota Management**: Automatic limit enforcement with upgrade prompts

### Dashboard Features
- **Real-time Updates**: Live document status and processing updates
- **Usage Analytics**: Visual progress bars and usage statistics
- **Quick Actions**: Easy access to upload, AI help, and style guides
- **Responsive Design**: Mobile-friendly interface with dark/light mode support

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **AI Integration**: Google Gemini API
- **Document Processing**: FastAPI backend service
- **State Management**: React Context API
- **Real-time Updates**: Supabase Realtime

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Google Gemini API key
- FastAPI backend service (for document processing)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd formatly-frontend
npm install
```

### 2. Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database Configuration
POSTGRES_URL=your_postgres_connection_string
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=your_postgres_database
POSTGRES_HOST=your_postgres_host

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# FastAPI Backend
FASTAPI_BASE_URL=your_fastapi_backend_url
FASTAPI_TIMEOUT=30000

# Application URLs
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_SITE_URL=your_site_url
```

### 3. Database Setup

Run the provided SQL scripts to set up your database schema:

```bash
# Execute scripts in order (available in /scripts folder)
1. create-database-schema.sql
2. add-billing-schema.sql
3. create-usage-tracking.sql
4. add-formatting-preferences.sql
# ... and other migration scripts
```

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
formatly-frontend/
├── app/                          # Next.js App Router pages
│   ├── dashboard/               # Dashboard pages
│   │   ├── ai/                 # AI assistant page
│   │   ├── billing/            # Billing management
│   │   ├── documents/          # Document management
│   │   └── ...
│   ├── auth/                   # Authentication pages
│   └── api/                    # API routes
├── components/                  # React components
│   ├── ui/                     # shadcn/ui components
│   ├── auth/                   # Authentication components
│   ├── billing/                # Billing components
│   └── ...
├── contexts/                   # React Context providers
├── hooks/                      # Custom React hooks
├── lib/                        # Utility functions and services
├── scripts/                    # Database migration scripts
└── public/                     # Static assets
```

## 🔧 Key Components

### Authentication System
- **AuthProvider**: Manages user authentication state
- **Login/Register Forms**: User authentication with Supabase Auth
- **Protected Routes**: Route protection for authenticated users

### Document Processing
- **DocumentUploader**: Drag-and-drop file upload with progress tracking
- **StyleSelector**: Citation style selection (APA, MLA, Harvard, Chicago)
- **ProcessingQueue**: Real-time job status monitoring

### Billing & Subscriptions
- **BillingDashboard**: Comprehensive subscription management
- **UsageStats**: Real-time usage tracking and limits
- **QuotaLimitDialog**: Upgrade prompts when limits are reached

### AI Assistant
- **AskFormatlyAI**: Interactive chat interface with Gemini AI
- **Markdown Rendering**: Rich text responses with syntax highlighting
- **Context-Aware Responses**: Specialized formatting assistance

## 🔧 FastAPI Backend Setup

A sample FastAPI backend is included for testing purposes. See `FASTAPI_BACKEND_README.md` for detailed setup instructions.

### Quick Backend Deployment to Render

1. **Deploy the FastAPI backend:**
   - Use the included `main.py`, `requirements.txt`, and `render.yaml`
   - Deploy to Render or any Python hosting service
   - Get your backend URL (e.g., `https://your-service.onrender.com`)

2. **Update frontend environment variables:**
   ```env
   FASTAPI_BASE_URL=https://your-service.onrender.com
   FASTAPI_TIMEOUT=30000
   ```

3. **Test the integration:**
   - Upload a document through the frontend
   - Monitor processing status
   - Download the formatted result

The sample backend provides mock document processing for testing the complete application flow.

## 🔌 API Endpoints

### Document Management
- `POST /api/documents/upload` - Get pre-signed upload URL
- `POST /api/documents/process` - Create formatting job
- `GET /api/documents/status/:jobId` - Get job status
- `GET /api/documents/download/:jobId` - Download formatted document

### AI Chat
- `POST /api/chat` - Send message to AI assistant

### User Management
- `GET /api/user/profile` - Get user profile
- `POST /api/user/profile` - Update user profile
- `GET /api/user/subscription` - Get subscription details

## 🎨 Styling & Theming

- **Tailwind CSS**: Utility-first CSS framework
- **Dark/Light Mode**: Automatic theme switching
- **Custom Design System**: Consistent color palette and typography
- **Responsive Design**: Mobile-first approach with breakpoints
- **Animations**: Smooth transitions and loading states

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Authentication**: Supabase Auth with email/password
- **File Validation**: Type and size validation for uploads
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Secure cross-origin requests

## 📊 Monitoring & Analytics

- **Usage Tracking**: Document processing, API calls, storage usage
- **Real-time Updates**: Live status updates via Supabase Realtime
- **Error Handling**: Comprehensive error tracking and user feedback
- **Performance Monitoring**: Loading states and progress indicators

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the FAQ section in the application

## 🔄 Version History

- **v1.0.0** - Initial release with core formatting features
- **v1.1.0** - Added AI assistant and improved UI
- **v1.2.0** - Enhanced billing system and usage tracking
- **v1.3.0** - Real-time updates and performance improvements
