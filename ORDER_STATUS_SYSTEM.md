# Order Status System Documentation

This document explains the automated order status management system.

## Status Flow

### Automatic Transitions

1. **pending** → **paid**
   - Triggered by payment webhook or manual admin action
   - No email notification (payment confirmation handled separately)

2. **processing** → **completed**
   - Automatic after 7 days in "processing" status
   - Triggered by cron job calling `/api/orders/auto-transition`
   - No email notification (can be added if needed)

### Manual Transitions

**Only one manual update is allowed:**

- **paid** → **processing**
  - Admin manually changes status from "paid" to "processing"
  - **Automatically sends processing confirmation email to customer**
  - This is the only status change that triggers customer notification

### Other Statuses

- **cancelled** - Can be set manually or automatically (not implemented yet)
- All other status changes are read-only in the admin panel

## Implementation Details

### Admin Panel Behavior

- **Orders with status "paid"**: Show dropdown with options: "paid" or "processing"
- **All other statuses**: Show read-only badge (no dropdown)
- Only "paid" → "processing" transition is allowed

### Email Notifications

#### When Order is Placed (pending)
- Customer receives order confirmation email
- Admin receives new order notification

#### When Status Changes to Processing
- Customer receives processing confirmation email
- Email includes order details and "What's Next?" information
- Sent automatically when admin changes status from "paid" to "processing"

### API Endpoints

#### `/api/orders/update-status` (POST)
- **Purpose**: Update order status from "paid" to "processing"
- **Authorization**: Internal (called from admin panel)
- **Request Body**:
  ```json
  {
    "orderId": "uuid",
    "newStatus": "processing",
    "currentStatus": "paid"
  }
  ```
- **Response**: Success message and updated order
- **Side Effect**: Sends processing email to customer

#### `/api/orders/auto-transition` (POST)
- **Purpose**: Automatically transition orders from "processing" to "completed"
- **Authorization**: Requires `Authorization: Bearer <CRON_SECRET>` header
- **Logic**: Finds orders in "processing" status older than 7 days
- **Response**: Number of orders updated

## Setting Up Automatic Transitions

### Option 1: Vercel Cron Jobs (Recommended)

1. **Create `vercel.json` cron configuration**:
   ```json
   {
     "crons": [{
       "path": "/api/orders/auto-transition",
       "schedule": "0 2 * * *"
     }]
   }
   ```

2. **Set Environment Variable**:
   - In Vercel dashboard, add `CRON_SECRET` environment variable
   - Use a secure random string

3. **Update `vercel.json`**:
   ```json
   {
     "crons": [{
       "path": "/api/orders/auto-transition",
       "schedule": "0 2 * * *"
     }]
   }
   ```

### Option 2: External Cron Service

Use a service like:
- **cron-job.org** (free)
- **EasyCron** (free tier)
- **GitHub Actions** (free)

Configure to call:
```
POST https://your-domain.com/api/orders/auto-transition
Authorization: Bearer <your-cron-secret>
```

### Option 3: Supabase Edge Function + pg_cron

Set up a Supabase database function that calls the API endpoint.

## Configuration

### Environment Variables

Add to your `.env.local` and Vercel:

```env
CRON_SECRET=your-secure-random-string-here
```

### Adjust Auto-Complete Duration

Edit `app/api/orders/auto-transition/route.ts`:

```typescript
const processingToCompletedDays = 7; // Change this number
```

## Testing

### Test Manual Status Update

1. Create a test order with status "paid"
2. Go to admin panel → Orders
3. Change status from "paid" to "processing"
4. Verify:
   - Status updates in database
   - Customer receives processing email
   - Toast notification shows success

### Test Auto-Transition

1. Create test order with status "processing"
2. Manually set `created_at` to 8 days ago in database
3. Call `/api/orders/auto-transition` endpoint:
   ```bash
   curl -X POST https://your-domain.com/api/orders/auto-transition \
     -H "Authorization: Bearer your-cron-secret"
   ```
4. Verify order status changed to "completed"

## Status Meanings

- **pending**: Order placed, awaiting payment
- **paid**: Payment received, ready to process
- **processing**: Order is being manufactured/prepared
- **completed**: Order ready for delivery
- **cancelled**: Order cancelled

## Future Enhancements

- Add email notification when order is completed
- Add automatic cancellation for orders pending > 30 days
- Add status history tracking
- Add estimated completion dates
- Add delivery tracking integration

