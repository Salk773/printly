import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getStripe } from "@/lib/stripe";
import { OrderRefundSchema, validateRequest } from "@/lib/validation/schemas";
import { logAdminAction } from "@/lib/logger";

export const dynamic = "force-dynamic";

const uuidSchema = z.string().uuid();

/**
 * POST /api/admin/orders/[orderId]/refund
 * Full or partial refund in AED; updates order status to refunded on success.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const auth = await requireAdmin(req);
  if (auth.authorized === false) return auth.response;

  const user = auth.user;

  const idParsed = uuidSchema.safeParse(params.orderId);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }

  const parsed = validateRequest(OrderRefundSchema, body);
  if (parsed.success === false) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const admin = supabaseAdmin();
  const { data: order, error: fetchError } = await admin
    .from("orders")
    .select("*")
    .eq("id", idParsed.data)
    .maybeSingle();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const pi = order.stripe_payment_intent_id as string | null;
  if (!pi || typeof pi !== "string") {
    return NextResponse.json(
      { error: "This order has no Stripe payment intent to refund" },
      { status: 400 }
    );
  }

  const orderTotal = Number(order.total);
  const maxMinor = Math.max(0, Math.round(orderTotal * 100));

  const amountMinor =
    parsed.data.amountAed != null
      ? Math.round(parsed.data.amountAed * 100)
      : undefined;

  if (amountMinor != null) {
    if (amountMinor <= 0 || amountMinor > maxMinor) {
      return NextResponse.json(
        { error: `Partial refund must be between 0.01 and ${orderTotal.toFixed(2)} AED` },
        { status: 400 }
      );
    }
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: pi,
      ...(amountMinor != null ? { amount: amountMinor } : {}),
    });

    const { error: updateError } = await admin
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", idParsed.data);

    if (updateError) {
      console.error("refund order status update:", updateError);
    }

    logAdminAction(
      "stripe_refund",
      "order",
      idParsed.data,
      {
        refundId: refund.id,
        amountAed: parsed.data.amountAed ?? "full",
        paymentIntent: pi,
        ipAddress,
      },
      user.id,
      ipAddress
    );

    return NextResponse.json({
      success: true,
      refund: { id: refund.id, amount: refund.amount, currency: refund.currency },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("stripe refund:", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
