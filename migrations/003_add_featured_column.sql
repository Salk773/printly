-- Migration: Add featured column to products table
-- Run this in Supabase SQL Editor

-- Add featured column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);

-- Update existing products to have featured = false
UPDATE products SET featured = FALSE WHERE featured IS NULL;

-- Verify the migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'featured'
  ) THEN
    RAISE EXCEPTION 'Migration failed: featured column not found';
  END IF;
END $$;

