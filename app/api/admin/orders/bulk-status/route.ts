import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { BulkOrderStatusSchema, validateRequest } from "@/lib/validation/schemas";
import { logAdminAction } from "@/lib/logger";
import { sendOrderNotification } from "@/lib/orderMail";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const auth = await requireAdmin(req);
  if (auth.authorized === false) return auth.response;

  const user = auth.user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = validateRequest(BulkOrderStatusSchema, body);
  if (parsed.success === false) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { orderIds, newStatus } = parsed.data;
  const admin = supabaseAdmin();

  const results: { orderId: string; ok: boolean; error?: string }[] = [];

  for (const orderId of orderIds) {
    const { data: order, error: fetchError } = await admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError || !order) {
      results.push({ orderId, ok: false, error: "not_found" });
      continue;
    }

    const currentStatus = order.status as string;
    if (currentStatus === newStatus) {
      results.push({ orderId, ok: true });
      continue;
    }

    const { data: updatedOrder, error: updateError } = await admin
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError || !updatedOrder) {
      results.push({ orderId, ok: false, error: updateError?.message ?? "update_failed" });
      continue;
    }

    logAdminAction(
      "bulk_update_order_status",
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

    let emailWarning: string | undefined;
    const customerEmail = updatedOrder.guest_email;
    if (
      currentStatus === "paid" &&
      newStatus === "processing" &&
      customerEmail
    ) {
      const rawItems = Array.isArray(updatedOrder.items) ? updatedOrder.items : [];
      const items = rawItems.map((i: { name?: unknown; price?: unknown; quantity?: unknown }) => ({
        name: String(i?.name ?? ""),
        price: Number(i?.price ?? 0),
        quantity: Math.max(1, Math.floor(Number(i?.quantity ?? 1))),
      }));

      const emailData = {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.order_number,
        customerEmail,
        customerName: updatedOrder.guest_name,
        phone: updatedOrder.phone || "",
        address: {
          line1: updatedOrder.address_line_1 || "",
          line2: updatedOrder.address_line_2,
          city: updatedOrder.city || "",
          state: updatedOrder.state || "",
          postalCode: updatedOrder.postal_code,
        },
        items,
        total: Number(updatedOrder.total),
        notes: updatedOrder.notes,
      };

      const emailResult = await sendOrderNotification({
        type: "processing",
        orderData: emailData,
      });
      if (!emailResult.success && !emailResult.skipped) {
        emailWarning = emailResult.error ?? "email_failed";
      }
    }

    results.push({
      orderId,
      ok: true,
      ...(emailWarning ? { error: `email_failed:${emailWarning}` } : {}),
    });
  }

  const failed = results.filter((r) => !r.ok).length;
  return NextResponse.json({
    success: failed === 0,
    results,
    updated: results.filter((r) => r.ok).length,
    failed,
  });
}
