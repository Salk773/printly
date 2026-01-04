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
 * Automatic order status transitions:
 * - pending -> paid (via payment webhook or manual admin action)
 * - processing -> completed (after X days, configurable)
 * 
 * This endpoint can be called via cron job or webhook
 */
export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    logBackgroundJob("order-auto-transition", "started", {
      ipAddress,
      timestamp: new Date().toISOString(),
    });

    // Verify this is an internal call (add auth header check in production)
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || "your-secret-token";
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      logBackgroundJob("order-auto-transition", "failed", {
        error: "Unauthorized",
        ipAddress,
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const processingToCompletedDays = 7; // Auto-complete after 7 days in processing

    // Find orders in "processing" status older than X days
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - processingToCompletedDays);

    const { data: ordersToComplete, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "processing")
      .lt("created_at", cutoffDate.toISOString());

    if (fetchError) {
      logBackgroundJob("order-auto-transition", "failed", {
        error: fetchError.message,
        ipAddress,
      });
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    if (!ordersToComplete || ordersToComplete.length === 0) {
      logBackgroundJob("order-auto-transition", "completed", {
        updated: 0,
        ipAddress,
      });
      return NextResponse.json({
        success: true,
        message: "No orders to auto-transition",
        updated: 0,
      });
    }

    // Update orders to completed
    const orderIds = ordersToComplete.map((o) => o.id);
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .in("id", orderIds);

    if (updateError) {
      logBackgroundJob("order-auto-transition", "failed", {
        error: updateError.message,
        orderCount: ordersToComplete.length,
        ipAddress,
      });
      return NextResponse.json(
        { error: "Failed to update orders" },
        { status: 500 }
      );
    }

    logBackgroundJob("order-auto-transition", "completed", {
      updated: ordersToComplete.length,
      orderIds: orderIds.slice(0, 10), // Log first 10 IDs
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Auto-transitioned ${ordersToComplete.length} orders to completed`,
      updated: ordersToComplete.length,
    });
  } catch (error: any) {
    logBackgroundJob("order-auto-transition", "failed", {
      error: error.message,
      stack: error.stack,
      ipAddress,
    });
    console.error("Auto-transition error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: "Use POST with authorization header to trigger auto-transitions",
    note: "Set CRON_SECRET environment variable for security",
  });
}

