# Runbook - Operational Procedures

This document provides troubleshooting guides and manual intervention procedures for the Printly application.

## Table of Contents

1. [Alert Response Procedures](#alert-response-procedures)
2. [Manual Interventions](#manual-interventions)
3. [Troubleshooting Guides](#troubleshooting-guides)
4. [Emergency Procedures](#emergency-procedures)

## Alert Response Procedures

### Sentry Error Alerts

**When**: Sentry sends an alert for a new error or error spike

**Response Steps**:
1. Check Sentry dashboard for error details
2. Review error stack trace and context
3. Check if error is affecting users:
   - Review error frequency
   - Check affected endpoints
   - Review user impact
4. If critical:
   - Check application logs in Vercel
   - Verify database connectivity
   - Check environment variables
5. Fix the issue or create a ticket
6. Monitor Sentry for error resolution

**Common Issues**:
- Database connection errors → Check Supabase status
- Authentication errors → Verify Supabase keys
- API errors → Check endpoint logs

### Uptime Monitoring Alerts

**When**: Uptime service reports downtime

**Response Steps**:
1. Verify downtime:
   - Check `/api/health` endpoint manually
   - Check Vercel deployment status
   - Review recent deployments
2. Check Vercel logs for errors
3. Verify Supabase connectivity
4. Check environment variables
5. If persistent:
   - Check Vercel status page
   - Check Supabase status page
   - Review recent code changes
6. Restore service or rollback if needed

**Common Causes**:
- Recent deployment failure
- Environment variable misconfiguration
- Database connectivity issues
- External service outage

### Low Stock Alerts

**When**: Daily low stock alert email received

**Response Steps**:
1. Review products with low stock
2. Check product sales trends
3. Decide on restocking:
   - Order new inventory
   - Update stock quantities
   - Mark products as out of stock if needed
4. Update product stock in admin panel
5. Monitor stock levels

### Order Auto-Cancellation Alerts

**When**: Orders are automatically cancelled

**Response Steps**:
1. Review cancelled orders in admin panel
2. Check cancellation reasons (age, payment status)
3. If needed, manually review specific orders
4. Contact customers if necessary
5. Process refunds if applicable

## Manual Interventions

### Manually Trigger Cron Jobs

If cron jobs fail or need to be run manually:

```bash
# Set your domain and secret
DOMAIN="https://your-domain.com"
SECRET="your-cron-secret"

# Auto-transition orders
curl -X POST $DOMAIN/api/orders/auto-transition \
  -H "Authorization: Bearer $SECRET"

# Auto-cancel orders
curl -X POST $DOMAIN/api/orders/auto-cancel \
  -H "Authorization: Bearer $SECRET"

# Low stock alert
curl -X POST $DOMAIN/api/products/low-stock-alert \
  -H "Authorization: Bearer $SECRET"

# Log cleanup
curl -X POST $DOMAIN/api/admin/cleanup-logs \
  -H "Authorization: Bearer $SECRET"

# Backup verification
curl -X POST $DOMAIN/api/admin/verify-backup \
  -H "Authorization: Bearer $SECRET"
```

### Manually Update Order Status

1. Go to Admin Panel → Orders
2. Find the order
3. Update status using the dropdown (if available)
4. Or use API directly:
   ```bash
   curl -X POST $DOMAIN/api/orders/update-status \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"orderId": "order-id", "newStatus": "processing", "currentStatus": "paid"}'
   ```

### Manually Send Email Notifications

```bash
curl -X POST $DOMAIN/api/orders/notify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "admin",
    "orderData": {
      "orderId": "order-id",
      "orderNumber": "ORD-123",
      "customerEmail": "customer@example.com",
      "customerName": "John Doe",
      "phone": "+1234567890",
      "address": {
        "line1": "123 Main St",
        "city": "Dubai",
        "state": "Dubai",
        "postalCode": "00000"
      },
      "items": [{"name": "Product", "price": 100, "quantity": 1}],
      "total": 100
    }
  }'
```

## Troubleshooting Guides

### Database Connection Issues

**Symptoms**:
- Health check fails
- API errors mentioning database
- Orders/products not loading

**Steps**:
1. Check Supabase dashboard → Project status
2. Verify environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Test connection:
   ```bash
   curl https://your-domain.com/api/health
   ```
4. Check Supabase logs for errors
5. Verify Row Level Security policies
6. Check network restrictions in Supabase

### Email Not Sending

**Symptoms**:
- Order confirmations not received
- Admin notifications missing
- Cron job emails not sent

**Steps**:
1. Verify `SUPABASE_EDGE_FUNCTION_URL` is set
2. Check email service logs (Resend/SendGrid/etc.)
3. Verify `ADMIN_EMAIL` is configured
4. Test email endpoint:
   ```bash
   curl -X POST $DOMAIN/api/orders/notify \
     -H "Content-Type: application/json" \
     -d '{...}'
   ```
5. Check Supabase Edge Function logs
6. Verify email service API keys

### Cron Jobs Not Running

**Symptoms**:
- Orders not auto-transitioning
- Low stock alerts not received
- Logs not cleaned up

**Steps**:
1. Check Vercel dashboard → Cron Jobs
2. Verify cron schedule in `vercel.json`
3. Check `CRON_SECRET` is set
4. Review cron job logs in Vercel
5. Test endpoint manually (see above)
6. Verify endpoint returns 200 status

### Build Failures

**Symptoms**:
- Deployment fails
- GitHub Actions CI fails
- Type errors in build

**Steps**:
1. Check build logs in Vercel/GitHub
2. Review TypeScript errors
3. Check for missing dependencies
4. Verify environment variables
5. Test build locally:
   ```bash
   npm install
   npm run build
   ```
6. Fix errors and redeploy

### Performance Issues

**Symptoms**:
- Slow page loads
- API timeouts
- High response times

**Steps**:
1. Check `/api/health/monitor` for metrics
2. Review Sentry performance data
3. Check database query performance
4. Review Vercel analytics
5. Check for slow queries in Supabase
6. Optimize database queries
7. Consider adding database indexes

## Emergency Procedures

### Rollback Deployment

**If recent deployment causes issues**:

1. Go to Vercel dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Verify rollback in health check
5. Investigate issue in staging

### Disable Cron Jobs Temporarily

**If cron jobs are causing issues**:

1. Remove cron entries from `vercel.json`
2. Commit and push changes
3. Wait for deployment
4. Fix issues
5. Re-enable cron jobs

### Emergency Database Access

**If database access is needed urgently**:

1. Use Supabase dashboard SQL Editor
2. Or use service role key with direct connection
3. **Warning**: Service role bypasses RLS - use carefully
4. Document all changes
5. Review changes in admin panel

### Disable Error Tracking

**If Sentry is causing issues**:

1. Remove `SENTRY_DSN` from environment variables
2. Redeploy application
3. Errors will still be logged to console/Vercel logs
4. Re-enable after fixing issues

## Monitoring Checklist

Daily:
- [ ] Check Sentry for new errors
- [ ] Review uptime status
- [ ] Check low stock alerts
- [ ] Review order status

Weekly:
- [ ] Review cron job execution logs
- [ ] Check security scan results
- [ ] Review Dependabot PRs
- [ ] Check backup verification status

Monthly:
- [ ] Review performance metrics
- [ ] Check log cleanup execution
- [ ] Review error trends
- [ ] Update dependencies

## Contact Information

- **Admin Email**: info@printly.ae
- **Sentry Dashboard**: [sentry.io](https://sentry.io)
- **Vercel Dashboard**: [vercel.com](https://vercel.com)
- **Supabase Dashboard**: [supabase.com](https://supabase.com)

## Additional Resources

- [AUTOMATION.md](./AUTOMATION.md) - Automation documentation
- [ENVIRONMENT.md](./ENVIRONMENT.md) - Environment variables
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [ORDER_STATUS_SYSTEM.md](./ORDER_STATUS_SYSTEM.md) - Order status system

