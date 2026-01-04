import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth/adminAuth";

/**
 * API endpoint to verify and execute migration for the 'archived' column
 * 
 * This endpoint:
 * 1. Checks if the 'archived' column exists
 * 2. Tries to run the migration via RPC function if available
 * 3. Provides SQL instructions if RPC is not available
 * 
 * REQUIRES ADMIN AUTHENTICATION
 */
export async function POST(req: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(req);
    if (!authResult.authorized) {
      return (authResult as { authorized: false; response: NextResponse }).response;
    }

    const supabase = supabaseAdmin();

    // First, try to query the archived column to see if it exists
    const { data, error } = await supabase
      .from("orders")
      .select("archived")
      .limit(1);

    if (error) {
      // Check if error is about missing column
      if (error.code === "PGRST204" || error.message?.includes("archived")) {
        // Try to run migration via RPC function if it exists
        const { data: rpcData, error: rpcError } = await supabase
          .rpc("add_archived_column_to_orders");

        if (!rpcError && rpcData) {
          // Migration function exists and ran successfully
          return NextResponse.json({
            success: true,
            message: "Migration executed successfully via RPC function",
            data: rpcData
          });
        }

        // RPC function doesn't exist, provide SQL instructions
        return NextResponse.json(
          {
            success: false,
            needsMigration: true,
            message: "The 'archived' column does not exist in the 'orders' table",
            sql: `
-- Run this SQL in your Supabase SQL Editor:

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(archived);

UPDATE orders SET archived = FALSE WHERE archived IS NULL;
            `.trim(),
            instructions: [
              "1. Open your Supabase Dashboard",
              "2. Go to SQL Editor",
              "3. Run the SQL provided above",
              "4. Verify the migration completed successfully"
            ]
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Column exists
    return NextResponse.json({
      success: true,
      needsMigration: false,
      message: "The 'archived' column already exists"
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

