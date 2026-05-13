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
- **Security**: Safe to expose (protected by Row Level Security)

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
- **Default**: `info@printly.ae` (from `lib/adminEmails.ts`)
- **Required**: No (but recommended)
- **Used in**: Order notification emails to admin

#### `SUPABASE_EDGE_FUNCTION_URL`
- **Description**: URL of Supabase Edge Function for sending emails
- **Example**: `https://abcdefghijklmnop.supabase.co/functions/v1/send-email`
- **Required**: No
- **Note**: If not set, emails will be logged to console only (development mode)
- **Setup**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for Edge Function setup

### Monitoring & Automation

#### `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`
- **Description**: Sentry DSN for error tracking and monitoring
- **Example**: `https://xxx@xxx.ingest.sentry.io/xxx`
- **Required**: No (but recommended for production)
- **Public**: `NEXT_PUBLIC_SENTRY_DSN` for client-side, `SENTRY_DSN` for server-side
- **Setup**: Create account at [sentry.io](https://sentry.io) and add DSN to environment variables

#### `CRON_SECRET`
- **Description**: Secret token for securing cron job endpoints
- **Example**: `your-secure-random-string-here`
- **Required**: Yes (for production)
- **Security**: ⚠️ **Keep this secret** - used to authorize cron job calls
- **Generate**: Use a secure random string generator

#### `MONITOR_SECRET`
- **Description**: Secret token for health monitoring endpoint (optional, falls back to CRON_SECRET)
- **Example**: `your-monitoring-secret`
- **Required**: No (uses CRON_SECRET if not set)

#### `LOW_STOCK_THRESHOLD`
- **Description**: Stock quantity threshold for low stock alerts
- **Example**: `5`
- **Default**: `5`
- **Required**: No
- **Used in**: Low stock alert cron job

#### `AUTO_CANCEL_DAYS`
- **Description**: Number of days before auto-cancelling pending orders
- **Example**: `30`
- **Default**: `30`
- **Required**: No
- **Used in**: Auto-cancel orders cron job

### Site Configuration

#### `NEXT_PUBLIC_SITE_URL`
- **Description**: Full URL of your deployed site (for SEO and email links)
- **Example**: `https://printly.ae` or `https://your-app.vercel.app`
- **Default**: `http://localhost:3000` (development)
- **Required**: No (but recommended for production)
- **Used in**: 
  - SEO meta tags (Open Graph, Twitter Cards)
  - Sitemap generation
  - Email links
  - Robots.txt

### Creative Workflow AI

#### `AI_IMAGE_PROVIDER_API_KEY`
- **Description**: Server-side API key for Banana Pro/Nano Banana image editing.
- **Example**: `sk-your-provider-key`
- **Required**: No. If omitted, the social workflow uses the uploaded image as a fallback preview.
- **Public**: No.
- **Used in**: Admin Social workflow image edits and Instagram/TikTok image variants.

#### `AI_IMAGE_PROVIDER_BASE_URL`
- **Description**: Gemini-compatible Banana provider base URL.
- **Example**: `https://aiberm.com`
- **Default**: `https://aiberm.com`
- **Required**: No.

#### `AI_IMAGE_PROVIDER_MODEL`
- **Description**: Banana/Nano Banana image model name.
- **Example**: `gemini-3-pro-image-preview`
- **Default**: `gemini-3-pro-image-preview`
- **Required**: No.

### Local Auto Label Printer

#### `LABEL_PRINTER_STATUS`
- **Description**: Order status that the local label printer watcher should print.
- **Example**: `paid`
- **Default**: `paid`
- **Required**: No.

#### `LABEL_PRINTER_POLL_MS`
- **Description**: How often the local printer watcher checks for newly paid orders.
- **Example**: `5000`
- **Default**: `5000`
- **Required**: No.

#### `LABEL_PRINTER_LOOKBACK_HOURS`
- **Description**: How far back the watcher looks for unpaid-to-paid orders it has not printed locally.
- **Example**: `48`
- **Default**: `48`
- **Required**: No.

#### `LABEL_PRINTER_BROWSER_PATH`
- **Description**: Optional path to Edge/Chrome if the watcher cannot find it automatically.
- **Example**: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
- **Required**: No.
- **Note**: Silent printing uses Edge/Chrome kiosk printing. Set your Windows default printer to the 4x6 label printer before running the watcher.

#### `LABEL_PRINTER_SITE_URL`
- **Description**: Printly site URL for a printer computer that is not running the app locally.
- **Example**: `https://printly.ae`
- **Required**: Yes for the remote printer-computer setup.

#### `LABEL_PRINTER_AGENT_SECRET`
- **Description**: Shared secret used by the local printer watcher to fetch printable orders from Printly.
- **Example**: `use-a-long-random-secret`
- **Required**: Yes for the remote printer-computer setup.
- **Security**: Keep this private. Add the same value to the Printly server/Vercel environment and to the printer computer's local `.env.local`.

## Environment Setup

### Local Development

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email (Optional)
ADMIN_EMAIL=info@printly.ae
SUPABASE_EDGE_FUNCTION_URL=https://your-project.supabase.co/functions/v1/send-email

# Monitoring & Automation (Optional)
SENTRY_DSN=your-sentry-dsn-here
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
CRON_SECRET=your-secure-random-token-here
LOW_STOCK_THRESHOLD=5
AUTO_CANCEL_DAYS=30

# Creative Workflow AI (Optional)
AI_IMAGE_PROVIDER_API_KEY=your-banana-provider-key
AI_IMAGE_PROVIDER_BASE_URL=https://aiberm.com
AI_IMAGE_PROVIDER_MODEL=gemini-3-pro-image-preview

# Local Auto Label Printer (Optional)
LABEL_PRINTER_STATUS=paid
LABEL_PRINTER_POLL_MS=5000
LABEL_PRINTER_LOOKBACK_HOURS=48
LABEL_PRINTER_SITE_URL=http://localhost:3000
LABEL_PRINTER_AGENT_SECRET=use-a-long-random-secret
```

### Production (Vercel)

Set environment variables in Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add each variable for the appropriate environment:
   - **Production**: Live site
   - **Preview**: Pull request previews
   - **Development**: Local development (optional)

## Variable Naming Convention

- **`NEXT_PUBLIC_*`**: Variables accessible in client-side code (browser)
- **No prefix**: Server-side only variables (Node.js runtime)

## Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use Vercel environment variables** for production secrets
3. **Rotate keys regularly** - Especially service role key
4. **Limit service role key usage** - Only use in server-side code
5. **Review RLS policies** - Ensure database security

## Testing Environment Variables

### Check if variables are loaded:

```typescript
// Client-side (browser)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Server-side (Node.js)
console.log(process.env.SUPABASE_SERVICE_ROLE_KEY);
```

### Verify in production:

1. Check Vercel dashboard → Environment Variables
2. Use Vercel CLI: `vercel env ls`
3. Test health endpoint: `/api/health`

## Troubleshooting

### Variables not loading

- **Client-side**: Ensure variable starts with `NEXT_PUBLIC_`
- **Server-side**: Variable should NOT start with `NEXT_PUBLIC_`
- **After adding**: Restart dev server or redeploy

### Wrong values

- Check for typos in variable names
- Verify values in Vercel dashboard
- Clear `.next` cache: `rm -rf .next`

### Security warnings

- Never log service role key
- Don't expose service role key in client code
- Use environment-specific values (dev vs prod)

## Example Configuration Files

### `.env.local` (Development)
```env
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=dev-service-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key
NEXT_PUBLIC_SITE_URL=https://printly.ae
ADMIN_EMAIL=info@printly.ae
SUPABASE_EDGE_FUNCTION_URL=https://prod-project.supabase.co/functions/v1/send-email
```

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

