-- Migration: Create saved_addresses table
-- Description: Allows users to save multiple shipping addresses for faster checkout

CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON saved_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_is_default ON saved_addresses(user_id, is_default);

-- Enable RLS
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own addresses
CREATE POLICY "Users can view their own addresses"
  ON saved_addresses FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own addresses
CREATE POLICY "Users can insert their own addresses"
  ON saved_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own addresses
CREATE POLICY "Users can update their own addresses"
  ON saved_addresses FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own addresses
CREATE POLICY "Users can delete their own addresses"
  ON saved_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_saved_addresses_timestamp
  BEFORE UPDATE ON saved_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_addresses_updated_at();

