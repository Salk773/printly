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
    // #region agent log
    fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f31495" }, body: JSON.stringify({ sessionId: "f31495", runId: "pre-fix-2", hypothesisId: "O3", location: "app/api/orders/delete/route.ts:entry", message: "Order delete API entered", data: { hasAuthHeader: Boolean(req.headers.get("authorization")) }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
    // Require admin authentication
    const authResult = await requireAdmin(req);
    if (!authResult.authorized) {
      // #region agent log
      fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f31495" }, body: JSON.stringify({ sessionId: "f31495", runId: "pre-fix-2", hypothesisId: "O4", location: "app/api/orders/delete/route.ts:auth-failed", message: "Order delete API auth failed", data: { error: (authResult as { authorized: false; response: NextResponse }).response.status }, timestamp: Date.now() }) }).catch(() => {});
      // #endregion
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
      // #region agent log
      fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f31495" }, body: JSON.stringify({ sessionId: "f31495", runId: "pre-fix-2", hypothesisId: "O5", location: "app/api/orders/delete/route.ts:delete-error", message: "Order delete query failed", data: { orderId: validation.data.orderId, errorMessage: deleteError.message || "unknown" }, timestamp: Date.now() }) }).catch(() => {});
      // #endregion
      logApiError("/api/orders/delete", new Error(deleteError.message || "Failed to delete order"), {
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
    // #region agent log
    fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f31495" }, body: JSON.stringify({ sessionId: "f31495", runId: "pre-fix-2", hypothesisId: "O5", location: "app/api/orders/delete/route.ts:success", message: "Order delete API succeeded", data: { orderId: validation.data.orderId }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully"
    });

  } catch (error: any) {
    // #region agent log
    fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f31495" }, body: JSON.stringify({ sessionId: "f31495", runId: "pre-fix-2", hypothesisId: "O5", location: "app/api/orders/delete/route.ts:catch", message: "Order delete API threw error", data: { errorMessage: error?.message || "unknown" }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
    logApiError("/api/orders/delete", error, { ipAddress });
    console.error("Order delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

