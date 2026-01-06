-- Migration: Create shipping_methods table
-- Description: Defines available shipping methods with costs and delivery times

CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  estimated_days INTEGER NOT NULL DEFAULT 7,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active shipping methods
CREATE INDEX IF NOT EXISTS idx_shipping_methods_active ON shipping_methods(active);

-- Insert default shipping methods
INSERT INTO shipping_methods (name, description, cost, estimated_days, active)
VALUES
  ('Standard Delivery', 'Standard shipping within UAE', 15.00, 7, true),
  ('Express Delivery', 'Fast delivery within UAE', 30.00, 3, true),
  ('Free Shipping', 'Free shipping for orders over 200 AED', 0.00, 7, true)
ON CONFLICT DO NOTHING;

-- Enable RLS (admin only access)
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view active shipping methods
CREATE POLICY "Anyone can view active shipping methods"
  ON shipping_methods FOR SELECT
  USING (active = true OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shipping_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_shipping_methods_timestamp
  BEFORE UPDATE ON shipping_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_methods_updated_at();

