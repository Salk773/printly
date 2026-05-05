-- Reviews: moderation visibility (hidden reviews excluded from storefront via RLS)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;

CREATE POLICY "Anyone can view visible reviews"
  ON reviews FOR SELECT
  USING (visible = true);

-- Optional index for admin queries
CREATE INDEX IF NOT EXISTS idx_reviews_visible ON reviews(visible);

-- Email notification audit trail (inserted by server from /api/orders/notify)
CREATE TABLE IF NOT EXISTS email_notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  to_email TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notification_events_created_at
  ON email_notification_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notification_events_order_id
  ON email_notification_events(order_id);

ALTER TABLE email_notification_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE email_notification_events IS 'Server-side log of order-related emails; no client access.';
