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
 * Cleanup old logs
 * - Archive logs older than 90 days (optional - can be implemented with archive table)
 * - Delete logs older than 1 year
 * - Maintain recent logs for debugging
 */
export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    logBackgroundJob("log-cleanup", "started", {
      ipAddress,
      timestamp: new Date().toISOString(),
    });

    // Verify this is an internal call
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || "your-secret-token";
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      logBackgroundJob("log-cleanup", "failed", {
        error: "Unauthorized",
        ipAddress,
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    
    // Calculate cutoff dates
    const archiveCutoffDate = new Date(now);
    archiveCutoffDate.setDate(archiveCutoffDate.getDate() - 90); // 90 days ago
    
    const deleteCutoffDate = new Date(now);
    deleteCutoffDate.setFullYear(deleteCutoffDate.getFullYear() - 1); // 1 year ago

    // Count logs to be archived (90+ days old, but less than 1 year)
    const { count: archiveCount, error: archiveCountError } = await supabase
      .from("logs")
      .select("*", { count: "exact", head: true })
      .lt("created_at", archiveCutoffDate.toISOString())
      .gte("created_at", deleteCutoffDate.toISOString());

    if (archiveCountError) {
      logBackgroundJob("log-cleanup", "failed", {
        error: archiveCountError.message,
        ipAddress,
      });
      return NextResponse.json(
        { error: "Failed to count logs for archiving" },
        { status: 500 }
      );
    }

    // Count logs to be deleted (1+ years old)
    const { count: deleteCount, error: deleteCountError } = await supabase
      .from("logs")
      .select("*", { count: "exact", head: true })
      .lt("created_at", deleteCutoffDate.toISOString());

    if (deleteCountError) {
      logBackgroundJob("log-cleanup", "failed", {
        error: deleteCountError.message,
        ipAddress,
      });
      return NextResponse.json(
        { error: "Failed to count logs for deletion" },
        { status: 500 }
      );
    }

    // Delete logs older than 1 year
    const { error: deleteError } = await supabase
      .from("logs")
      .delete()
      .lt("created_at", deleteCutoffDate.toISOString());

    if (deleteError) {
      logBackgroundJob("log-cleanup", "failed", {
        error: deleteError.message,
        ipAddress,
      });
      return NextResponse.json(
        { error: "Failed to delete old logs" },
        { status: 500 }
      );
    }

    // Note: Archiving can be implemented later with an archive table
    // For now, we just delete logs older than 1 year
    // Logs between 90 days and 1 year remain in the main table

    logBackgroundJob("log-cleanup", "completed", {
      archived: archiveCount || 0,
      deleted: deleteCount || 0,
      archiveCutoff: archiveCutoffDate.toISOString(),
      deleteCutoff: deleteCutoffDate.toISOString(),
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: "Log cleanup completed",
      archived: archiveCount || 0,
      deleted: deleteCount || 0,
      archiveCutoff: archiveCutoffDate.toISOString(),
      deleteCutoff: deleteCutoffDate.toISOString(),
      note: "Logs older than 1 year have been deleted. Logs between 90 days and 1 year remain in the main table.",
    });
  } catch (error: any) {
    logBackgroundJob("log-cleanup", "failed", {
      error: error.message,
      stack: error.stack,
      ipAddress,
    });
    console.error("Log cleanup error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  const now = new Date();
  const archiveCutoffDate = new Date(now);
  archiveCutoffDate.setDate(archiveCutoffDate.getDate() - 90);
  const deleteCutoffDate = new Date(now);
  deleteCutoffDate.setFullYear(deleteCutoffDate.getFullYear() - 1);

  return NextResponse.json({
    message: "Use POST with authorization header to cleanup logs",
    note: "Set CRON_SECRET environment variable for security",
    config: {
      archiveCutoff: archiveCutoffDate.toISOString(),
      deleteCutoff: deleteCutoffDate.toISOString(),
      archiveDays: 90,
      deleteDays: 365,
    },
  });
}

