# Environment Variables Documentation

This document describes all environment variables used in the Printly application.

## Required Variables

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Example**: `https://abcdefghijklmnop.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Required**: Yes
- **Public**: Yes (used in client-side code)

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Supabase anonymous/public key for client-side operations
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → anon/public key
- **Required**: Yes
- **Public**: Yes (used in client-side code)
- **Security**: Safe to expose (protected by Row Level Security)

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Supabase service role key for server-side admin operations
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → service_role key
- **Required**: Yes
- **Public**: No (server-side only)
- **Security**: ⚠️ **NEVER expose this in client-side code** - it bypasses RLS

## Optional Variables

### Email Configuration

#### `ADMIN_EMAIL`
- **Description**: Email address to receive order notifications
- **Example**: `info@printly.ae`
- **Default**: `info@printly.ae`
- **Required**: No (but recommended)
- **Used in**: Order notification emails

#### `SUPABASE_EDGE_FUNCTION_URL`
- **Description**: URL of Supabase Edge Function for sending emails
- **Example**: `https://abcdefghijklmnop.supabase.co/functions/v1/send-email`
- **Required**: No
- **Note**: If not set, emails will be logged to console only (development mode)

### Site Configuration

#### `NEXT_PUBLIC_SITE_URL`
- **Description**: Full URL of your deployed site (for SEO and email links)
- **Example**: `https://printly.ae` or `https://your-app.vercel.app`
- **Required**: No
- **Default**: `https://printly.ae`
- **Used in**: Sitemap, robots.txt, Open Graph tags, email links

#### `NODE_ENV`
- **Description**: Node.js environment
- **Values**: `development` | `production` | `test`
- **Default**: `development`
- **Required**: No
- **Note**: Automatically set by Vercel in production

## Environment Setup

### Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ADMIN_EMAIL=info@printly.ae
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Production (Vercel)

1. Go to Vercel project settings
2. Navigate to "Environment Variables"
3. Add all required variables
4. Set environment to "Production", "Preview", and "Development" as needed
5. Redeploy if variables were added after initial deployment

## Security Best Practices

### ✅ Do

- Use `.env.local` for local development (gitignored)
- Use Vercel environment variables for production
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Rotate keys periodically
- Use different Supabase projects for dev/staging/prod

### ❌ Don't

- Commit `.env.local` to Git
- Expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Share environment variables in screenshots or documentation
- Use production keys in development

## Variable Validation

The application validates environment variables on startup:

- Missing required variables will cause build/runtime errors
- Health check endpoint (`/api/health`) reports configuration status
- Check health endpoint after deployment to verify configuration

## Troubleshooting

### "Missing environment variable" error

1. Check `.env.local` exists (local) or Vercel settings (production)
2. Verify variable names match exactly (case-sensitive)
3. Restart development server after adding variables
4. Redeploy on Vercel after adding variables

### Supabase connection fails

1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
3. Ensure Supabase project is active
4. Check network/firewall restrictions

### Email not sending

1. Verify `ADMIN_EMAIL` is set
2. Check `SUPABASE_EDGE_FUNCTION_URL` if using Edge Functions
3. Review server logs for email errors
4. In development, emails are logged to console

## Example `.env.local` File

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email Configuration
ADMIN_EMAIL=info@printly.ae
SUPABASE_EDGE_FUNCTION_URL=https://abcdefghijklmnop.supabase.co/functions/v1/send-email

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

