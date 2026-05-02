-- Link orders to saved addresses and Stripe payments

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS saved_address_id UUID REFERENCES saved_addresses(id) ON DELETE SET NULL;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_saved_address_id ON orders(saved_address_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout_session_id ON orders(stripe_checkout_session_id);
