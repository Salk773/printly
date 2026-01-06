-- Migration: Add stock management columns to products table
-- Description: Adds stock_quantity and low_stock_threshold columns for inventory management

-- Add stock_quantity column (NULL means unlimited stock for backward compatibility)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;

-- Add low_stock_threshold column (default: 5)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- Create index for stock queries
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity) WHERE stock_quantity IS NOT NULL;

-- Update existing products to have NULL stock (unlimited) for backward compatibility
-- This allows existing products to continue working without stock management

