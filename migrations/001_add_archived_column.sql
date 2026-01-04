-- Migration: Add archived column to orders table
-- Run this in Supabase SQL Editor

-- Add archived column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(archived);

-- Update existing orders to have archived = false
UPDATE orders SET archived = FALSE WHERE archived IS NULL;

-- Verify the migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'archived'
  ) THEN
    RAISE EXCEPTION 'Migration failed: archived column not found';
  END IF;
END $$;

