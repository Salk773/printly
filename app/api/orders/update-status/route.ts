import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAILS } from "@/lib/adminEmails";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { OrderStatusUpdateSchema, validateRequest } from "@/lib/validation/schemas";
import { logApiCall, logAdminAction, logApiError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Order status flow:
 * pending -> paid (automatic, via payment webhook or manual admin)
 * paid -> processing (manual only - admin action)
 * processing -> completed (automatic after X days or manual)
 * Any status -> cancelled (automatic or manual)
 */

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    // Require admin authentication
    const authResult = await requireAdmin(req);
    if (!authResult.authorized) {
      logApiCall("POST", "/api/orders/update-status", 401, { ipAddress });
      return (authResult as { authorized: false; response: NextResponse }).response;
    }

    const user = authResult.user;
    logApiCall("POST", "/api/orders/update-status", undefined, { ipAddress }, user.id, ipAddress);

    const body = await req.json().catch(() => null);
    if (!body) {
      logApiCall("POST", "/api/orders/update-status", 400, { error: "Invalid request body", ipAddress }, user.id, ipAddress);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateRequest(OrderStatusUpdateSchema, body);
    if (!validation.success) {
      logApiCall("POST", "/api/orders/update-status", 400, { 
        error: (validation as { success: false; error: string }).error,
        ipAddress 
      }, user.id, ipAddress);
      return NextResponse.json(
        { error: (validation as { success: false; error: string }).error },
        { status: 400 }
      );
    }

    const { orderId, newStatus, currentStatus } = validation.data;

    // Get order details
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", validation.data.orderId)
      .single();

    if (fetchError || !order) {
      logApiCall("POST", "/api/orders/update-status", 404, { 
        orderId,
        error: "Order not found",
        ipAddress 
      }, user.id, ipAddress);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify current status matches
    if (order.status !== validation.data.currentStatus) {
      logApiCall("POST", "/api/orders/update-status", 409, { 
        orderId,
        expectedStatus: currentStatus,
        actualStatus: order.status,
        ipAddress 
      }, user.id, ipAddress);
      return NextResponse.json(
        { error: "Order status has changed. Please refresh." },
        { status: 409 }
      );
    }

    // Update status
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ status: validation.data.newStatus })
      .eq("id", validation.data.orderId)
      .select()
      .single();

    if (updateError || !updatedOrder) {
      logApiError("/api/orders/update-status", updateError || new Error("Failed to update order"), {
        orderId,
        newStatus,
        currentStatus,
        ipAddress,
      }, user.id, ipAddress);
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      );
    }

    // Log admin action
    logAdminAction(
      "update_order_status",
      "order",
      orderId,
      {
        fromStatus: currentStatus,
        toStatus: newStatus,
        orderNumber: updatedOrder.order_number,
        ipAddress,
      },
      user.id,
      ipAddress
    );

    // Get customer email (always stored in guest_email field for all orders)
    const customerEmail = updatedOrder.guest_email;
    const customerName = updatedOrder.guest_name;

    // Only send email notification for paid -> processing transition
    if (
      validation.data.currentStatus === "paid" &&
      validation.data.newStatus === "processing" &&
      customerEmail
    ) {
      const emailData = {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.order_number,
        customerEmail,
        customerName,
        phone: updatedOrder.phone || "",
        address: {
          line1: updatedOrder.address_line_1 || "",
          line2: updatedOrder.address_line_2,
          city: updatedOrder.city || "",
          state: updatedOrder.state || "",
          postalCode: updatedOrder.postal_code,
        },
        items: updatedOrder.items || [],
        total: updatedOrder.total,
        notes: updatedOrder.notes,
      };

      // Send email in background (don't block response)
      fetch(`${req.nextUrl.origin}/api/orders/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "processing",
          orderData: emailData,
        }),
      }).catch((err) => {
        console.error("Failed to send processing email:", err);
      });
    }

    logApiCall("POST", "/api/orders/update-status", 200, {
      orderId,
      statusChange: `${currentStatus} -> ${newStatus}`,
      ipAddress,
    }, user.id, ipAddress);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order status updated to ${validation.data.newStatus}.${
        validation.data.currentStatus === "paid" && validation.data.newStatus === "processing"
          ? " Customer notified."
          : ""
      }`,
    });
  } catch (error: any) {
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    logApiError("/api/orders/update-status", error, { ipAddress });
    console.error("Order status update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

