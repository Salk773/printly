# Supabase Free Plan Limits & Email Verification

## Email Verification on Free Plan

**✅ YES - Email verification is fully available on Supabase's free plan!**

All authentication features including email verification work on the free tier. However, there are some limitations to be aware of.

## Free Plan Email Limits

### Default Supabase Email Service

When using Supabase's built-in email service (no custom SMTP):

- **Rate Limit**: ~3-4 emails per hour per project
- **Daily Limit**: Approximately 50-100 emails per day
- **Sender**: Emails come from `noreply@mail.app.supabase.io`
- **Customization**: Limited customization of email templates
- **Deliverability**: Good, but not as reliable as dedicated SMTP services

**Best For:**
- Development and testing
- Low-traffic sites (< 50 signups/day)
- Personal projects
- MVP/prototype stages

### Custom SMTP (Available on Free Plan)

You can use your own SMTP service on the free plan:

- ✅ **No additional cost** from Supabase
- ✅ **No rate limits** (subject to your SMTP provider's limits)
- ✅ **Better deliverability**
- ✅ **Custom branding**
- ✅ **Higher email volume**

**Free SMTP Options:**
1. **Resend** - 3,000 emails/month free
2. **SendGrid** - 100 emails/day free
3. **Mailgun** - 5,000 emails/month free (first 3 months)
4. **AWS SES** - Very cheap ($0.10 per 1,000 emails)

## What Works on Free Plan

### ✅ Fully Available Features

- Email verification/confirmation
- Password reset emails
- Magic link authentication
- Custom email templates
- Email redirect URLs
- All authentication providers
- User management
- Session management

### ⚠️ Limitations

- **Email Rate Limits**: Default service has hourly/daily limits
- **Email Volume**: Limited with default service
- **Custom Domain**: Requires custom SMTP for branded emails
- **Advanced Analytics**: Limited on free plan

## Recommendations

### For Development
- Use default Supabase email service
- No setup required
- Perfect for testing

### For Production (Low Traffic)
- Use default Supabase email if < 50 signups/day
- Monitor email delivery
- Consider upgrading if you hit limits

### For Production (High Traffic)
- Set up custom SMTP (Resend recommended)
- Better deliverability and no rate limits
- Professional email branding
- Still free if using free SMTP tier

## Cost Comparison

### Free Plan + Default Email
- **Cost**: $0/month
- **Limit**: ~50-100 emails/day
- **Setup**: None required

### Free Plan + Resend SMTP
- **Cost**: $0/month (3,000 emails/month free)
- **Limit**: 3,000 emails/month
- **Setup**: 5 minutes

### Free Plan + SendGrid SMTP
- **Cost**: $0/month (100 emails/day free)
- **Limit**: 100 emails/day
- **Setup**: 5 minutes

## When to Upgrade

Consider upgrading Supabase plan if:
- You need > 100 emails/day consistently
- You need advanced email analytics
- You need priority support
- You're hitting other free plan limits (database size, bandwidth, etc.)

## Summary

**Email verification works perfectly on the free plan!** 

For most small to medium projects:
- Start with default Supabase email
- Upgrade to custom SMTP when you hit limits or need better deliverability
- Use free SMTP providers (Resend, SendGrid) to stay on free tier

The implementation in this codebase works identically on free and paid plans - the only difference is email sending limits.

