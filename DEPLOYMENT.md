# Deployment Guide

This guide covers deploying Printly to Vercel and configuring production environment.

## Prerequisites

- Vercel account (sign up at [vercel.com](https://vercel.com))
- Supabase project set up
- GitHub repository (optional, but recommended)

## Deployment Steps

### 1. Prepare Your Repository

Ensure your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js settings
5. Configure environment variables (see below)
6. Click "Deploy"

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

### 3. Configure Environment Variables

In your Vercel project settings, add the following environment variables:

#### Required Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ADMIN_EMAIL=info@printly.ae
```

#### Optional Variables

```
SUPABASE_EDGE_FUNCTION_URL=https://your-project.supabase.co/functions/v1/send-email
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**Where to find Supabase credentials:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and anon/public key
4. Copy the service_role key (keep this secret!)

### 4. Configure Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_SITE_URL` environment variable

### 5. Set Up Email Service

#### Option A: Supabase Edge Function (Recommended)

1. Create a Supabase Edge Function for email sending
2. Configure your email service provider (Resend, SendGrid, etc.)
3. Set `SUPABASE_EDGE_FUNCTION_URL` environment variable

#### Option B: External Email Service

Update `app/api/orders/notify/route.ts` to integrate with your preferred email service.

### 6. Verify Deployment

1. Check health endpoint: `https://your-domain.com/api/health`
2. Test order placement
3. Verify email notifications are working
4. Check admin panel functionality

## Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Health check endpoint returns OK status
- [ ] Order placement works correctly
- [ ] Email notifications are sent
- [ ] Admin panel accessible
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Analytics configured (optional)

## Troubleshooting

### Build Fails

- Check environment variables are set correctly
- Verify all dependencies are in `package.json`
- Review build logs in Vercel dashboard

### Email Not Sending

- Verify `ADMIN_EMAIL` is set correctly
- Check `SUPABASE_EDGE_FUNCTION_URL` if using Edge Functions
- Review server logs in Vercel dashboard
- Check email service provider logs

### Database Connection Issues

- Verify Supabase credentials are correct
- Check Supabase project is active
- Review Row Level Security (RLS) policies
- Check network restrictions in Supabase

## Monitoring

- **Vercel Analytics**: Built-in analytics available in Vercel dashboard
- **Health Checks**: Monitor `/api/health` endpoint
- **Error Tracking**: Consider integrating Sentry or similar service
- **Logs**: View function logs in Vercel dashboard

## Rollback

If you need to rollback a deployment:

1. Go to Vercel project dashboard
2. Navigate to "Deployments"
3. Find the previous working deployment
4. Click "..." → "Promote to Production"

## Continuous Deployment

Vercel automatically deploys when you push to your main branch. To disable:

1. Go to Project Settings → Git
2. Disable automatic deployments for production branch

## Environment-Specific Configurations

### Production

- Use production Supabase project
- Set `NODE_ENV=production`
- Enable error tracking
- Configure custom domain

### Preview/Staging

- Use staging Supabase project (optional)
- Test new features before production
- Use preview URLs for testing

## Support

For deployment issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- Check Supabase status: [status.supabase.com](https://status.supabase.com)

