/**
 * Migration script to add the 'archived' column to the 'orders' table
 * 
 * This script can be run using:
 * npx tsx scripts/add-archived-column.ts
 * 
 * Or run the SQL directly in Supabase SQL Editor:
 * See DATABASE_MIGRATION.md for the SQL
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing required environment variables:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("  SUPABASE_SERVICE_ROLE_KEY:", !!serviceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function runMigration() {
  console.log("Starting migration: Add 'archived' column to 'orders' table...");

  try {
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We'll use RPC to call a database function, or you can run the SQL manually
    
    // First, let's check if the column already exists by trying to query it
    const { data: testData, error: testError } = await supabase
      .from("orders")
      .select("archived")
      .limit(1);

    if (!testError && testData !== null) {
      console.log("✅ Column 'archived' already exists!");
      return;
    }

    // If we get here, the column doesn't exist
    console.log("❌ Column 'archived' does not exist.");
    console.log("\nPlease run the following SQL in your Supabase SQL Editor:");
    console.log("\n" + "=".repeat(60));
    console.log(`
-- Add archived column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(archived);

-- Update existing orders to have archived = false
UPDATE orders SET archived = FALSE WHERE archived IS NULL;
`);
    console.log("=".repeat(60));
    console.log("\nAfter running the SQL, verify with:");
    console.log(`
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'archived';
`);

  } catch (error: any) {
    console.error("Error checking column:", error.message);
    console.log("\nPlease run the SQL migration manually in Supabase SQL Editor.");
    console.log("See DATABASE_MIGRATION.md for the SQL commands.");
  }
}

runMigration();

