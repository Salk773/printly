import { NextRequest, NextResponse } from "next/server";
import "server-only";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { finalizeOrderAfterStripePayment } from "@/lib/stripeOrderFinalize";
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

    const result = await finalizeOrderAfterStripePayment(orderId, paymentIntentId || null);
    if (!result.ok) {
      logApiError("/api/webhooks/stripe", new Error("finalizeOrderAfterStripePayment failed"));
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
