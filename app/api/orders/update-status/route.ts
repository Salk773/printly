import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAILS } from "@/lib/adminEmails";

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
  try {
    const body = await req.json();
    const { orderId, newStatus, currentStatus } = body;

    if (!orderId || !newStatus || !currentStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ["pending", "paid", "processing", "completed", "cancelled"];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Get order details
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify current status matches
    if (order.status !== currentStatus) {
      return NextResponse.json(
        { error: "Order status has changed. Please refresh." },
        { status: 409 }
      );
    }

    // Update status
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError || !updatedOrder) {
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      );
    }

    // Get customer email (always stored in guest_email field for all orders)
    const customerEmail = updatedOrder.guest_email;
    const customerName = updatedOrder.guest_name;

    // Only send email notification for paid -> processing transition
    if (currentStatus === "paid" && newStatus === "processing" && customerEmail) {
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

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order status updated to ${newStatus}.${currentStatus === "paid" && newStatus === "processing" ? " Customer notified." : ""}`,
    });
  } catch (error: any) {
    console.error("Order status update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

