-- Stripe payment columns + optional link to saved_addresses.
-- If you see errors about saved_addresses: run 005_create_saved_addresses.sql first,
-- then run this file again (the DO block will add saved_address_id when the table exists).

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout_session_id ON orders(stripe_checkout_session_id);

-- FK requires public.saved_addresses from migration 005
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'saved_addresses'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = 'saved_address_id'
    ) THEN
      ALTER TABLE public.orders
        ADD COLUMN saved_address_id UUID REFERENCES public.saved_addresses(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'idx_orders_saved_address_id'
    ) THEN
      CREATE INDEX idx_orders_saved_address_id ON public.orders(saved_address_id);
    END IF;
  END IF;
END $$;
