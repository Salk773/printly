# Email Verification Setup Guide

This guide explains how to enable and configure email verification for user accounts in the Printly application.

## Overview

Email verification ensures that users verify their email addresses before they can sign in to their accounts. This helps prevent fake accounts and ensures valid contact information.

## Supabase Configuration

### Step 1: Enable Email Confirmation

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to "Authentication" → "Settings"

2. **Enable Email Confirmation**
   - Find "Enable email confirmations" toggle
   - Turn it ON
   - This will require users to verify their email before signing in

3. **Configure Email Templates** (Optional)
   - Go to "Authentication" → "Email Templates"
   - Customize the confirmation email template
   - Update the redirect URL to: `{{ .SiteURL }}/auth/confirm`

### Step 2: Configure Site URL

1. **Set Site URL in Supabase**
   - Go to "Authentication" → "URL Configuration"
   - Set "Site URL" to your production domain:
     - Development: `http://localhost:3000`
     - Production: `https://your-domain.com`

2. **Add Redirect URLs**
   - Add redirect URL: `http://localhost:3000/auth/confirm` (development)
   - Add redirect URL: `https://your-domain.com/auth/confirm` (production)

### Step 3: Configure SMTP (Optional but Recommended)

**Free Plan Email Limits:**
- ✅ Email verification is **fully available** on Supabase free plan
- ⚠️ Default Supabase email service has **rate limits** (~3-4 emails per hour)
- ⚠️ For production with many users, **custom SMTP is recommended**

**Using Default Supabase Email (Free Plan):**
- Works fine for development and low-traffic sites
- No additional setup required
- Rate limited to prevent abuse
- Emails sent from `noreply@mail.app.supabase.io`

**Using Custom SMTP (Recommended for Production):**

1. **Go to Project Settings → Auth**
2. **Configure SMTP Settings**
   - SMTP Host: Your email provider's SMTP server
   - SMTP Port: Usually 587 or 465
   - SMTP User: Your email address
   - SMTP Password: Your email password or app password
   - Sender Email: The email address that sends verification emails
   - Sender Name: Display name (e.g., "Printly")

**Popular Free/Cheap SMTP Providers:**
- **Resend**: Free tier (3,000 emails/month) - Recommended
- **SendGrid**: Free tier (100 emails/day)
- **Mailgun**: Free tier (5,000 emails/month for 3 months)
- **AWS SES**: Pay-as-you-go ($0.10 per 1,000 emails)
- **Gmail**: Use app password (not recommended for production)

## How It Works

### Registration Flow

1. User fills out registration form
2. User submits form → Account created in Supabase
3. Supabase sends verification email automatically
4. User sees message: "Check your email to verify your account"
5. User clicks link in email
6. User is redirected to `/auth/confirm` → `/auth/verify-email`
7. Email is verified → User can now sign in

### Login Flow

1. User attempts to sign in
2. System checks if email is verified
3. If not verified → Error message shown
4. If verified → User signs in successfully

### Guest Checkout

- Guest checkout is **always available** - no account required
- Users can checkout without creating an account
- Guest information is stored with the order
- No email verification needed for guest checkout

## Testing Email Verification

### Development

1. **Disable Email Confirmation** (for easier testing)
   - In Supabase Dashboard → Authentication → Settings
   - Turn OFF "Enable email confirmations"
   - Users can sign in immediately after registration

2. **Or Use Magic Link** (for testing)
   - Supabase sends emails with verification links
   - Check Supabase logs if emails aren't arriving
   - Use test email addresses

### Production

1. **Enable Email Confirmation**
   - Turn ON "Enable email confirmations"
   - Configure custom SMTP
   - Test with real email addresses

2. **Monitor Email Delivery**
   - Check Supabase logs for email sending status
   - Monitor bounce rates
   - Check spam folders

## Troubleshooting

### Emails Not Sending

- **Check Supabase Logs**: Dashboard → Logs → Auth
- **Verify SMTP Settings**: If using custom SMTP, check credentials
- **Check Rate Limits**: Supabase has rate limits on free tier
- **Verify Site URL**: Must match your actual domain

### Verification Link Not Working

- **Check Redirect URL**: Must be added to allowed redirect URLs
- **Verify Token Expiry**: Links expire after 24 hours (default)
- **Check URL Format**: Should be `/auth/confirm?token_hash=...&type=email`

### Users Can't Sign In After Verification

- **Check Email Confirmation Status**: Verify `email_confirmed_at` is set
- **Check Error Messages**: Look for "Email not confirmed" errors
- **Verify Auth State**: Check if user session is created

### Guest Checkout Not Working

- **Verify Form Fields**: Name and email should show for guests
- **Check Validation**: Guest email/name validation should pass
- **Review Order Creation**: Check if guest fields are saved correctly

## Code Implementation

### Key Files

- `context/AuthProvider.tsx` - Handles sign up with email redirect
- `app/auth/register/page.tsx` - Shows verification message after signup
- `app/auth/login/page.tsx` - Checks email verification before login
- `app/auth/verify-email/page.tsx` - Verification success/error page
- `app/auth/confirm/route.ts` - Handles verification callback from Supabase

### Key Features

- ✅ Email verification required for account signup
- ✅ Clear messaging about email verification
- ✅ Resend verification email functionality
- ✅ Guest checkout available without account
- ✅ Proper error handling for unverified emails

## Best Practices

1. **Always Enable in Production**: Email verification prevents fake accounts
2. **Use Custom SMTP**: Better deliverability than default Supabase emails
3. **Monitor Email Delivery**: Track bounce rates and delivery issues
4. **Provide Clear Instructions**: Users should know to check spam folders
5. **Allow Resend**: Let users resend verification emails easily
6. **Set Reasonable Expiry**: Default 24 hours is good, but can be adjusted

## Security Considerations

- Email verification prevents account takeover
- Reduces spam and fake accounts
- Ensures valid contact information
- Guest checkout allows orders without account creation
- Guest data is still validated and sanitized

## Additional Resources

- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Verification Best Practices](https://supabase.com/docs/guides/auth/auth-email-verification)

