import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";
import { logApiCall, logApiError } from "@/lib/logger";

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
      logApiError("POST", "/api/orders/cancel", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to cancel order" },
        { status: 500 }
      );
    }

    // Restore stock quantities if order had items
    // Note: This assumes products table has stock_quantity column
    // We'll need to get product IDs from order items
    // For now, we'll just update the status
    // Stock restoration can be added later when we have product_id in order items

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error: any) {
    logApiError("POST", "/api/orders/cancel", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

