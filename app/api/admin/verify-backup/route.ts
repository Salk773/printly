import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { logBackgroundJob } from "@/lib/logger";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verify Supabase backups are running
 * Note: Supabase handles backups automatically, but we can verify
 * database connectivity and check if we can query recent data
 */
export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    logBackgroundJob("backup-verification", "started", {
      ipAddress,
      timestamp: new Date().toISOString(),
    });

    // Verify this is an internal call
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || "your-secret-token";
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      logBackgroundJob("backup-verification", "failed", {
        error: "Unauthorized",
        ipAddress,
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify database connectivity by checking multiple tables
    const checks = {
      products: false,
      orders: false,
      logs: false,
      categories: false,
    };

    const errors: string[] = [];

    // Check products table
    try {
      const { error } = await supabase.from("products").select("id").limit(1);
      if (error) {
        errors.push(`Products table: ${error.message}`);
      } else {
        checks.products = true;
      }
    } catch (err: any) {
      errors.push(`Products table: ${err.message}`);
    }

    // Check orders table
    try {
      const { error } = await supabase.from("orders").select("id").limit(1);
      if (error) {
        errors.push(`Orders table: ${error.message}`);
      } else {
        checks.orders = true;
      }
    } catch (err: any) {
      errors.push(`Orders table: ${err.message}`);
    }

    // Check logs table
    try {
      const { error } = await supabase.from("logs").select("id").limit(1);
      if (error) {
        errors.push(`Logs table: ${error.message}`);
      } else {
        checks.logs = true;
      }
    } catch (err: any) {
      errors.push(`Logs table: ${err.message}`);
    }

    // Check categories table
    try {
      const { error } = await supabase.from("categories").select("id").limit(1);
      if (error) {
        errors.push(`Categories table: ${error.message}`);
      } else {
        checks.categories = true;
      }
    } catch (err: any) {
      errors.push(`Categories table: ${err.message}`);
    }

    const allChecksPassed = Object.values(checks).every(check => check === true);

    if (!allChecksPassed) {
      logBackgroundJob("backup-verification", "failed", {
        errors,
        checks,
        ipAddress,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Some database checks failed",
          checks,
          errors,
        },
        { status: 503 }
      );
    }

    // Note: Supabase automatically handles backups
    // This verification just ensures database connectivity
    // For actual backup status, check Supabase dashboard

    logBackgroundJob("backup-verification", "completed", {
      checks,
      ipAddress,
      note: "Supabase handles backups automatically. This verification checks database connectivity.",
    });

    return NextResponse.json({
      success: true,
      message: "Database connectivity verified",
      checks,
      note: "Supabase automatically handles backups. Check Supabase dashboard for backup status.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logBackgroundJob("backup-verification", "failed", {
      error: error.message,
      stack: error.stack,
      ipAddress,
    });
    console.error("Backup verification error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: "Use POST with authorization header to verify backups",
    note: "Set CRON_SECRET environment variable for security",
    info: "Supabase automatically handles backups. This endpoint verifies database connectivity.",
  });
}

