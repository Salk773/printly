-- Migration: Add shipping and coupon columns to orders table
-- Description: Adds shipping_method_id and coupon_code to track shipping and discounts

-- Add shipping_method_id column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_method_id UUID REFERENCES shipping_methods(id);

-- Add shipping_cost column to store the cost at time of order
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0;

-- Add coupon_code column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);

-- Add discount_amount column to store the discount applied
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_shipping_method_id ON orders(shipping_method_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);

