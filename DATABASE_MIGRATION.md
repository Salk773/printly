# Database Migration: Add Archived Field to Orders

## Migration Required

To support order archiving functionality, you need to add an `archived` boolean column to the `orders` table.

## SQL Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add archived column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(archived);

-- Update existing orders to have archived = false
UPDATE orders SET archived = FALSE WHERE archived IS NULL;
```

## Verification

After running the migration, verify:

1. Column exists:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'orders' AND column_name = 'archived';
   ```

2. Default value is set:
   ```sql
   SELECT archived FROM orders LIMIT 1;
   ```

## Notes

- The `archived` field defaults to `false` for all existing orders
- Archived orders are filtered out by default in the admin panel
- Users can toggle "Show archived orders" to view archived items
- Archived orders can still be viewed, edited, and deleted

