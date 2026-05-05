import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logApiCall, logApiError } from "@/lib/logger";
import { incrementStockForOrderItems } from "@/lib/orderStock";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    logApiCall("POST", "/api/orders/cancel");

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // Get the order first to verify ownership and status
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, user_id, status, items")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify user owns this order (for logged-in users)
    const authHeader = req.headers.get("authorization");
    if (authHeader && order.user_id) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (!user || user.id !== order.user_id) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    // Only allow cancellation for pending or paid orders
    if (order.status !== "pending" && order.status !== "paid") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel order with status: ${order.status}`,
        },
        { status: 400 }
      );
    }

    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    if (updateError) {
      logApiError("/api/orders/cancel", new Error(updateError.message || "Failed to cancel order"));
      return NextResponse.json(
        { success: false, error: "Failed to cancel order" },
        { status: 500 }
      );
    }

    if (order.status === "paid") {
      const admin = supabaseAdmin();
      const restore = await incrementStockForOrderItems(admin, order.items);
      if (restore.ok === false) {
        console.error("Stock restore on cancel:", restore.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error: any) {
    logApiError("/api/orders/cancel", error instanceof Error ? error : new Error(error.message || "Internal server error"));
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

