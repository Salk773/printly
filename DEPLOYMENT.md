# Deployment Guide

This guide covers deploying the Printly application to Vercel.

## Prerequisites

- Vercel account (sign up at [vercel.com](https://vercel.com))
- GitHub/GitLab/Bitbucket account (for connecting repository)
- Supabase project set up and configured
- All environment variables ready

## Step 1: Prepare Your Repository

1. Ensure all code is committed and pushed to your repository
2. Verify that `package.json` includes all necessary dependencies
3. Check that `next.config.mjs` is properly configured

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Import Project**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your Git repository

2. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Set Environment Variables**
   
   Add the following environment variables in Vercel dashboard:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   ADMIN_EMAIL=info@printly.ae
   ```
   
   **Important**: 
   - Update `NEXT_PUBLIC_SITE_URL` after first deployment with your actual domain
   - Never commit `.env.local` files to Git
   - Use Vercel's environment variable interface for production values

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at `https://your-app.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   # ... add all other variables
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 3: Configure Custom Domain (Optional)

1. Go to your project settings in Vercel dashboard
2. Navigate to "Domains"
3. Add your custom domain (e.g., `printly.ae`)
4. Follow DNS configuration instructions
5. Update `NEXT_PUBLIC_SITE_URL` environment variable with your custom domain

## Step 4: Set Up Email Service

### Option A: Supabase Edge Function (Recommended)

1. **Create Edge Function**
   - Go to Supabase Dashboard → Edge Functions
   - Create a new function called `send-email`
   - Use a service like Resend, SendGrid, or AWS SES for actual email sending

2. **Configure Environment Variable**
   ```
   SUPABASE_EDGE_FUNCTION_URL=https://your-project.supabase.co/functions/v1/send-email
   ```

3. **Deploy Function**
   ```bash
   supabase functions deploy send-email
   ```

### Option B: External Email Service

Update `app/api/orders/notify/route.ts` to integrate with your preferred email service (Resend, SendGrid, etc.).

## Step 5: Verify Deployment

1. **Check Health Endpoint**
   ```
   https://your-domain.com/api/health
   ```
   Should return: `{"status":"ok","message":"Supabase connected ✅"}`

2. **Test Order Placement**
   - Add items to cart
   - Complete checkout
   - Verify order is created
   - Check email notifications are sent

3. **Test Admin Panel**
   - Login as admin user
   - Verify admin panel is accessible
   - Test product/category management

## Step 6: Post-Deployment Checklist

- [ ] All environment variables configured correctly
- [ ] Health check endpoint returns OK status
- [ ] Order placement works correctly
- [ ] Email notifications are sent
- [ ] Admin panel accessible
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Robots.txt accessible at `/robots.txt`

## Continuous Deployment

Vercel automatically deploys when you push to your connected Git repository:

- **Production**: Deploys from `main` or `master` branch
- **Preview**: Creates preview deployments for pull requests

To disable auto-deployment:
1. Go to Project Settings → Git
2. Unlink repository or disable auto-deployment

## Environment-Specific Configuration

### Production Environment

Set these in Vercel dashboard:
- `NODE_ENV=production` (automatically set by Vercel)
- `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
- All Supabase credentials

### Preview/Development

Vercel automatically creates preview deployments. You can set different environment variables for:
- Production
- Preview
- Development

## Monitoring & Analytics

### Vercel Analytics

1. Go to Project Settings → Analytics
2. Enable Vercel Analytics (if available on your plan)
3. View metrics in Vercel dashboard

### Error Monitoring

Consider integrating:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Vercel Logs** - Built-in logging

## Troubleshooting

### Build Fails

- Check environment variables are set correctly
- Verify all dependencies are in `package.json`
- Review build logs in Vercel dashboard
- Ensure Node.js version is compatible (18+)

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

### Environment Variables Not Working

- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)
- Verify variables are set for correct environment (Production/Preview)

## Rollback

If you need to rollback a deployment:

1. Go to Vercel project dashboard
2. Navigate to "Deployments"
3. Find the previous working deployment
4. Click "..." → "Promote to Production"

## Performance Optimization

Vercel automatically optimizes Next.js applications:

- **Image Optimization** - Automatic via Next.js Image component
- **Code Splitting** - Automatic route-based splitting
- **Edge Caching** - Automatic static asset caching
- **CDN** - Global CDN for all deployments

## Security Best Practices

1. **Never commit `.env` files** - Use Vercel environment variables
2. **Use RLS in Supabase** - Protect database access
3. **Validate all inputs** - Server-side validation
4. **Sanitize user data** - Prevent XSS attacks
5. **Use HTTPS** - Automatic with Vercel
6. **Regular updates** - Keep dependencies updated

## Support

For deployment issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review build logs in Vercel dashboard
- Contact Vercel support if needed

