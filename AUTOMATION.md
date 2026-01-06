# Automation Documentation

This document describes all automated processes in the Printly application.

## Overview

The application includes comprehensive automation for monitoring, maintenance, business logic, and CI/CD to minimize manual intervention.

## Automated Processes

### 1. Order Management

#### Auto-Transition Orders (Processing → Completed)
- **Endpoint**: `/api/orders/auto-transition`
- **Schedule**: Daily at 2:00 AM UTC (`0 2 * * *`)
- **Function**: Automatically transitions orders from "processing" to "completed" status after 7 days
- **Email**: Sends completion email to customers when orders are auto-completed
- **Configuration**: Modify `processingToCompletedDays` in the endpoint (default: 7 days)

#### Auto-Cancel Pending Orders
- **Endpoint**: `/api/orders/auto-cancel`
- **Schedule**: Daily at 3:00 AM UTC (`0 3 * * *`)
- **Function**: Automatically cancels orders in "pending" status older than 30 days
- **Email**: Sends cancellation email to customers
- **Configuration**: Set `AUTO_CANCEL_DAYS` environment variable (default: 30 days)

### 2. Inventory Management

#### Low Stock Alerts
- **Endpoint**: `/api/products/low-stock-alert`
- **Schedule**: Daily at 9:00 AM UTC (`0 9 * * *`)
- **Function**: Checks products with stock below threshold and sends email alert to admin
- **Email**: Sends formatted email with product details and stock levels
- **Configuration**: Set `LOW_STOCK_THRESHOLD` environment variable (default: 5 units)

### 3. Maintenance

#### Log Cleanup
- **Endpoint**: `/api/admin/cleanup-logs`
- **Schedule**: Weekly on Sunday at 2:00 AM UTC (`0 2 * * 0`)
- **Function**: 
  - Archives logs older than 90 days (currently logs remain, archiving can be implemented)
  - Deletes logs older than 1 year
- **Configuration**: Modify cutoff dates in the endpoint if needed

#### Backup Verification
- **Endpoint**: `/api/admin/verify-backup`
- **Schedule**: Weekly on Sunday at 4:00 AM UTC (`0 4 * * 0`)
- **Function**: Verifies database connectivity and table accessibility
- **Note**: Supabase handles backups automatically; this endpoint verifies connectivity

### 4. Monitoring

#### Health Check
- **Endpoint**: `/api/health`
- **Schedule**: Monitored by external uptime services (recommended: every 5 minutes)
- **Function**: 
  - Checks database connectivity
  - Validates environment variables
  - Checks storage connectivity
  - Returns response time metrics
- **Usage**: Use with UptimeRobot, Better Uptime, or similar services

#### Enhanced Monitoring
- **Endpoint**: `/api/health/monitor`
- **Schedule**: Can be called by monitoring services
- **Function**: Provides detailed metrics including:
  - Database latency
  - Storage latency
  - Memory usage
  - Uptime statistics
- **Security**: Requires `MONITOR_SECRET` or `CRON_SECRET` authorization header

#### Error Tracking (Sentry)
- **Service**: Sentry
- **Function**: Automatically captures and reports errors
- **Configuration**: Set `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` environment variable
- **Setup**: See [Sentry Setup](#sentry-setup)

### 5. CI/CD Automation

#### GitHub Dependabot
- **File**: `.github/dependabot.yml`
- **Schedule**: Weekly on Monday at 9:00 AM UTC
- **Function**: 
  - Automatically creates PRs for dependency updates
  - Groups updates by type (production/development)
  - Ignores major version updates (manual review required)
- **Configuration**: Modify `.github/dependabot.yml` to adjust schedule or settings

#### GitHub Actions CI
- **File**: `.github/workflows/ci.yml`
- **Trigger**: On push and pull requests to main/master/develop branches
- **Function**:
  - Runs ESLint
  - Type checks with TypeScript
  - Builds the application
  - Runs security audit

#### Security Scanning
- **File**: `.github/workflows/security.yml`
- **Schedule**: Weekly on Monday at 9:00 AM UTC
- **Function**:
  - Scans dependencies for vulnerabilities
  - Performs CodeQL analysis
  - Generates security reports

#### Pre-Deployment Checks
- **File**: `.github/workflows/pre-deploy.yml`
- **Trigger**: Manual or on push to main/master
- **Function**:
  - Validates environment variables
  - Type checks
  - Builds application
  - Checks for migration files
  - Verifies health check endpoint

## Cron Job Configuration

All cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/orders/auto-transition",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/orders/auto-cancel",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/products/low-stock-alert",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/admin/cleanup-logs",
      "schedule": "0 2 * * 0"
    },
    {
      "path": "/api/admin/verify-backup",
      "schedule": "0 4 * * 0"
    }
  ]
}
```

## Security

All cron endpoints require authorization via `Authorization: Bearer <CRON_SECRET>` header. Set the `CRON_SECRET` environment variable in Vercel.

## Monitoring Setup

### Sentry Setup

1. Create account at [sentry.io](https://sentry.io)
2. Create a new project (Next.js)
3. Copy the DSN
4. Add to Vercel environment variables:
   - `SENTRY_DSN` (server-side)
   - `NEXT_PUBLIC_SENTRY_DSN` (client-side)
5. Sentry will automatically capture errors

### Uptime Monitoring Setup

1. Sign up for [UptimeRobot](https://uptimerobot.com) (free tier available)
2. Add a new monitor:
   - Type: HTTP(s)
   - URL: `https://your-domain.com/api/health`
   - Interval: 5 minutes
3. Configure alerts (email/SMS)
4. Monitor will alert on downtime

## Manual Testing

All cron endpoints support GET requests for manual testing:

```bash
# Test auto-transition
curl -X POST https://your-domain.com/api/orders/auto-transition \
  -H "Authorization: Bearer your-cron-secret"

# Test auto-cancel
curl -X POST https://your-domain.com/api/orders/auto-cancel \
  -H "Authorization: Bearer your-cron-secret"

# Test low stock alert
curl -X POST https://your-domain.com/api/products/low-stock-alert \
  -H "Authorization: Bearer your-cron-secret"

# Test log cleanup
curl -X POST https://your-domain.com/api/admin/cleanup-logs \
  -H "Authorization: Bearer your-cron-secret"

# Test backup verification
curl -X POST https://your-domain.com/api/admin/verify-backup \
  -H "Authorization: Bearer your-cron-secret"
```

## Troubleshooting

### Cron Jobs Not Running

1. Check Vercel dashboard → Cron Jobs
2. Verify `CRON_SECRET` is set in environment variables
3. Check endpoint logs in Vercel dashboard
4. Verify cron schedule syntax in `vercel.json`

### Emails Not Sending

1. Verify `SUPABASE_EDGE_FUNCTION_URL` is configured
2. Check email service logs
3. Verify `ADMIN_EMAIL` is set for admin notifications
4. Check endpoint response for email errors

### Monitoring Not Working

1. Verify Sentry DSN is set correctly
2. Check Sentry dashboard for errors
3. Verify uptime monitor is configured correctly
4. Test health endpoint manually: `curl https://your-domain.com/api/health`

## Best Practices

1. **Monitor Cron Jobs**: Regularly check Vercel logs for cron job execution
2. **Review Dependabot PRs**: Review and merge dependency updates regularly
3. **Check Alerts**: Respond to Sentry alerts and uptime notifications promptly
4. **Test Changes**: Test cron endpoints manually before relying on automation
5. **Document Changes**: Update this document when adding new automated processes

## Additional Resources

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [GitHub Actions](https://docs.github.com/en/actions)

