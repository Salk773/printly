import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { OrderDeleteSchema, validateRequest } from "@/lib/validation/schemas";
import { logApiCall, logAdminAction, logApiError } from "@/lib/logger";

/**
 * API endpoint to delete an order
 * Requires admin authentication
 */
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    // Require admin authentication
    const authResult = await requireAdmin(req);
    if (!authResult.authorized) {
      logApiCall("DELETE", "/api/orders/delete", 401, { ipAddress });
      return (authResult as { authorized: false; response: NextResponse }).response;
    }

    const user = authResult.user;
    logApiCall("DELETE", "/api/orders/delete", undefined, { ipAddress }, user.id, ipAddress);

    const body = await req.json().catch(() => null);
    if (!body) {
      logApiCall("DELETE", "/api/orders/delete", 400, { error: "Invalid request body", ipAddress }, user.id, ipAddress);
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateRequest(OrderDeleteSchema, body);
    if (!validation.success) {
      logApiCall("DELETE", "/api/orders/delete", 400, { 
        error: (validation as { success: false; error: string }).error,
        ipAddress 
      }, user.id, ipAddress);
      return NextResponse.json(
        { success: false, error: (validation as { success: false; error: string }).error },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Verify order exists first
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("id", validation.data.orderId)
      .single();

    if (fetchError || !order) {
      logApiCall("DELETE", "/api/orders/delete", 404, { 
        orderId: validation.data.orderId,
        error: "Order not found",
        ipAddress 
      }, user.id, ipAddress);
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Delete the order
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", validation.data.orderId);

    if (deleteError) {
      logApiError("/api/orders/delete", deleteError, {
        orderId: validation.data.orderId,
        ipAddress,
      }, user.id, ipAddress);
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message || "Failed to delete order" },
        { status: 500 }
      );
    }

    // Log admin action
    logAdminAction(
      "delete",
      "order",
      validation.data.orderId,
      {
        orderNumber: order.order_number,
        ipAddress,
      },
      user.id,
      ipAddress
    );

    logApiCall("DELETE", "/api/orders/delete", 200, {
      orderId: validation.data.orderId,
      ipAddress,
    }, user.id, ipAddress);

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully"
    });

  } catch (error: any) {
    logApiError("/api/orders/delete", error, { ipAddress });
    console.error("Order delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

