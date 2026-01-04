-- Create a function to add the archived column
-- This allows the migration to be run via RPC call

CREATE OR REPLACE FUNCTION add_archived_column_to_orders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'archived'
  ) THEN
    ALTER TABLE orders ADD COLUMN archived BOOLEAN DEFAULT FALSE;
    CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(archived);
    UPDATE orders SET archived = FALSE WHERE archived IS NULL;
    
    result := jsonb_build_object(
      'success', true,
      'message', 'archived column added successfully'
    );
  ELSE
    result := jsonb_build_object(
      'success', true,
      'message', 'archived column already exists'
    );
  END IF;
  
  RETURN result;
END;
$$;

