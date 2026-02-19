# Authentication Setup Guide

This guide explains how to configure authentication redirect URLs for development and production environments.

## 🔧 Development Setup

### 1. Environment Variables

Add this environment variable to your `.env.local` file:

```env
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
```

### 2. Supabase Dashboard Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following URLs to **Redirect URLs**:
   - `http://localhost:3000/dashboard` (for development)
   - `http://localhost:3000/auth/callback` (optional callback handler)

### 3. How It Works

When users sign up, the application uses this redirect flow:

```typescript
// In register-form.tsx
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
  },
})
```

**Redirect Logic:**
- If `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` is set → uses that URL
- Otherwise → uses `{current_domain}/dashboard`

## 🚀 Production Setup

### 1. Environment Variables

Set these in your production environment (Vercel, AWS, etc.):

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
# Optional: NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL not needed in production
```

### 2. Supabase Production Configuration

1. In Supabase dashboard → **Authentication** → **URL Configuration**
2. Add your production URLs to **Redirect URLs**:
   - `https://yourdomain.com/dashboard`
   - `https://yourdomain.com/auth/callback`

### 3. Site URL Configuration

In Supabase dashboard → **Authentication** → **Settings**:
- Set **Site URL** to: `https://yourdomain.com`

## 📧 Email Confirmation Flow

### User Experience

1. **User signs up** → Account created, email sent
2. **User receives email** → Clicks confirmation link
3. **Redirect happens** → User sent to `/dashboard`
4. **User can sign in** → Account is now verified

### Email Templates

Customize email templates in Supabase:
- Go to **Authentication** → **Email Templates**
- Modify the **Confirm signup** template
- Use `{{ .ConfirmationURL }}` for the confirmation link

## 🔍 Troubleshooting

### Common Issues

**"Invalid redirect URL" error:**
- Check that your redirect URL is added to Supabase dashboard
- Ensure the URL matches exactly (including protocol and port)
- Verify environment variables are loaded correctly

**Email confirmation not working:**
- Check spam folder
- Verify email template is configured
- Ensure Site URL is set correctly in Supabase

**Redirect not working after email confirmation:**
- Verify the redirect URL is accessible
- Check that the dashboard route exists and is protected properly
- Ensure authentication state is being handled correctly

### Debug Steps

1. **Check environment variables:**
   ```bash
   echo $NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
   ```

2. **Verify Supabase configuration:**
   - Authentication → URL Configuration
   - Check all redirect URLs are listed

3. **Test the flow:**
   - Sign up with a test email
   - Check email delivery
   - Click confirmation link
   - Verify redirect behavior

### Development vs Production

| Environment | Redirect URL | Configuration |
|-------------|--------------|---------------|
| Development | `http://localhost:3000/dashboard` | `.env.local` + Supabase dashboard |
| Production | `https://yourdomain.com/dashboard` | Production env vars + Supabase dashboard |

## 🛡️ Security Considerations

### Allowed Domains

Only add trusted domains to Supabase redirect URLs:
- Your development domain (`localhost:3000`)
- Your production domain(s)
- Any staging environments

### HTTPS Requirements

- Production must use HTTPS
- Development can use HTTP (localhost only)
- Never use HTTP in production for auth redirects

## 📝 Quick Setup Checklist

### Development
- [ ] Add `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` to `.env.local`
- [ ] Add `http://localhost:3000/dashboard` to Supabase redirect URLs
- [ ] Test signup and email confirmation flow

### Production
- [ ] Set production environment variables
- [ ] Add production URLs to Supabase redirect URLs
- [ ] Set Site URL in Supabase to production domain
- [ ] Test complete auth flow in production

This setup ensures users receive proper email confirmation instructions and are redirected correctly after verifying their accounts.
