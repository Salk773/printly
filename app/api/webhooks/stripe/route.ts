import { NextRequest, NextResponse } from "next/server";
import "server-only";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getStripe } from "@/lib/stripe";
import { sendPaidOrderEmails } from "@/lib/orderNotifications";
import { logApiError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !secret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  const rawBody = await req.text();

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    logApiError(
      "/api/webhooks/stripe",
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id || session.client_reference_id;
    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    const admin = supabaseAdmin();

    const { data: existing } = await admin
      .from("orders")
      .select(
        "id, status, order_number, guest_email, guest_name, phone, address_line_1, address_line_2, city, state, postal_code, items, total, notes"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ received: true });
    }

    if (existing.status === "paid") {
      return NextResponse.json({ received: true });
    }

    const { error: updErr } = await admin
      .from("orders")
      .update({
        status: "paid",
        stripe_payment_intent_id: paymentIntentId || null,
      })
      .eq("id", orderId);

    if (updErr) {
      logApiError("/api/webhooks/stripe", new Error(updErr.message));
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    try {
      await sendPaidOrderEmails(existing);
    } catch (emailErr) {
      logApiError(
        "/api/webhooks/stripe",
        emailErr instanceof Error ? emailErr : new Error(String(emailErr))
      );
    }
  }

  return NextResponse.json({ received: true });
}
