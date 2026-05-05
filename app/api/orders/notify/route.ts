import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { OrderNotifySchema, validateRequest } from "@/lib/validation/schemas";
import { logApiCall, logApiError } from "@/lib/logger";
import { sendOrderNotification, type OrderEmailData } from "@/lib/orderMail";
import { recordEmailNotificationEvent } from "@/lib/recordEmailNotificationEvent";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    logApiCall("POST", "/api/orders/notify", undefined, { ipAddress }, undefined, ipAddress);

    const body = await req.json().catch(() => null);
    if (!body) {
      logApiCall("POST", "/api/orders/notify", 400, { error: "Invalid request body", ipAddress }, undefined, ipAddress);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const validation = validateRequest(OrderNotifySchema, body);
    if (validation.success === false) {
      logApiCall("POST", "/api/orders/notify", 400, {
        error: validation.error,
        ipAddress
      }, undefined, ipAddress);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { type, orderData } = validation.data;

    const payload: OrderEmailData = {
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber ?? null,
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName ?? null,
      phone: orderData.phone,
      address: {
        line1: orderData.address.line1,
        line2: orderData.address.line2 ?? null,
        city: orderData.address.city,
        state: orderData.address.state,
        postalCode: orderData.address.postalCode ?? null,
      },
      items: orderData.items as Array<{ name: string; price: number; quantity: number }>,
      total: orderData.total,
      notes: orderData.notes ?? null,
    };

    const result = await sendOrderNotification({ type, orderData: payload });

    if (!result.success) {
      await recordEmailNotificationEvent({
        notification_type: type,
        order_id: payload.orderId,
        to_email: type === "admin" ? null : payload.customerEmail,
        status: "failed",
        error_message: result.error || "Failed to send email",
      });
      logApiError("/api/orders/notify", new Error(result.error || "Failed to send email"), {
        type,
        orderId: payload.orderId,
        recipientEmail: type === "admin" ? "admin" : payload.customerEmail,
        ipAddress,
      }, undefined, ipAddress);
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    await recordEmailNotificationEvent({
      notification_type: type,
      order_id: payload.orderId,
      to_email: type === "admin" ? "admin-alerts" : payload.customerEmail,
      status: "sent",
    });

    logApiCall("POST", "/api/orders/notify", 200, {
      type,
      orderId: payload.orderId,
      ipAddress,
    }, undefined, ipAddress);

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error: unknown) {
    logApiError("/api/orders/notify", error instanceof Error ? error : new Error(String(error)), { ipAddress });
    console.error("Order notification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
