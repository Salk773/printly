-- Migration: Optional weight and dimensions text on products (shipping / specs)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight_text TEXT,
  ADD COLUMN IF NOT EXISTS dimensions_text TEXT;

COMMENT ON COLUMN products.weight_text IS 'Free-form weight label for product detail (e.g. 250 g, 2.5 kg)';
COMMENT ON COLUMN products.dimensions_text IS 'Free-form dimensions label (e.g. 30 × 20 × 5 cm)';
