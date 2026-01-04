# Database Migrations

This directory contains database migration scripts for the Printly application.

## Migration: Add Archived Column to Orders

### Problem
The application is trying to use an `archived` column in the `orders` table, but this column doesn't exist in the database schema, causing the error:
```
Could not find the 'archived' column of 'orders' in the schema cache
```

### Solution

You have two options to run this migration:

#### Option 1: Run SQL Directly (Recommended)

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `001_add_archived_column.sql`
4. Click **Run** to execute the migration

#### Option 2: Use the Migration Function

1. First, run `002_create_migration_function.sql` in Supabase SQL Editor to create the migration function
2. Then call the API endpoint: `POST /api/migrations/add-archived-column`
3. The endpoint will automatically execute the migration via RPC

### Verification

After running the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'archived';

-- Check default values
SELECT archived FROM orders LIMIT 1;
```

### What This Migration Does

- Adds an `archived` BOOLEAN column to the `orders` table with default value `FALSE`
- Creates an index on the `archived` column for better query performance
- Sets all existing orders to `archived = FALSE`

### Notes

- The migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times
- Existing orders will have `archived = false` by default
- Archived orders are filtered out by default in the admin panel
- Users can toggle "Show archived orders" to view archived items

