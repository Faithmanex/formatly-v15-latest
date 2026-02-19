# Deployment Guide

This guide covers deploying Formatly to production environments.

## 🚀 Vercel Deployment (Recommended)

### Prerequisites
- Vercel account
- GitHub repository
- Supabase project
- FastAPI backend service

### Step 1: Environment Variables

Configure these environment variables in your Vercel project settings:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
POSTGRES_HOST=

# AI & External Services
GEMINI_API_KEY=
FASTAPI_BASE_URL=
FASTAPI_TIMEOUT=30000

# Application
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=
```

### Step 2: Database Setup

1. Run all SQL scripts in the `/scripts` folder in order
2. Ensure RLS policies are properly configured
3. Test database connections

### Step 3: Deploy

1. Connect repository to Vercel
2. Configure build settings (Next.js preset)
3. Deploy and test functionality

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  formatly-frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      # Add other environment variables
    depends_on:
      - postgres
    
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: formatly
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## ☁️ AWS Deployment

### Using AWS Amplify

1. Connect GitHub repository to AWS Amplify
2. Configure build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

3. Set environment variables in Amplify console
4. Deploy and configure custom domain

### Using ECS/Fargate

1. Build and push Docker image to ECR
2. Create ECS task definition
3. Configure load balancer and auto-scaling
4. Set up CloudWatch monitoring

## 🔧 Production Checklist

### Security
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable RLS policies in Supabase
- [ ] Rotate API keys regularly

### Performance
- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize images and fonts
- [ ] Enable compression (gzip/brotli)
- [ ] Monitor Core Web Vitals

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Monitor database performance
- [ ] Track user analytics

### Backup & Recovery
- [ ] Database backup strategy
- [ ] File storage backup
- [ ] Disaster recovery plan
- [ ] Test restore procedures

## 🔍 Troubleshooting

### Common Issues

**Build Failures**
- Check Node.js version compatibility
- Verify all environment variables are set
- Clear build cache and reinstall dependencies

**Database Connection Issues**
- Verify connection strings
- Check firewall/security group settings
- Test database connectivity

**File Upload Problems**
- Verify Supabase storage configuration
- Check CORS settings
- Validate file size limits

**AI Chat Not Working**
- Verify Gemini API key
- Check API rate limits
- Monitor API usage quotas

### Performance Optimization

**Database**
- Add indexes for frequently queried columns
- Optimize RLS policies
- Use connection pooling

**Frontend**
- Implement code splitting
- Optimize bundle size
- Use Next.js Image optimization

**API**
- Implement caching strategies
- Use CDN for static assets
- Optimize API response sizes

## 📊 Monitoring & Maintenance

### Health Checks

Create health check endpoints:

```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  })
}
```

### Automated Backups

Set up automated database backups:

```bash
#!/bin/bash
# backup-db.sh
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
aws s3 cp backup-*.sql s3://your-backup-bucket/
```

### Update Strategy

1. Test updates in staging environment
2. Use blue-green deployment for zero downtime
3. Monitor metrics after deployment
4. Have rollback plan ready

This deployment guide ensures a robust, scalable production environment for Formatly.
