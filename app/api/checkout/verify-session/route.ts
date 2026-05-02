import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { finalizeOrderAfterStripePayment } from "@/lib/stripeOrderFinalize";
import { logApiError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const POLL_MS = 500;
const MAX_POLLS = 24;

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ success: false, error: "session_id required" }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ success: false, error: "Stripe not configured" }, { status: 503 });
    }

    let session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    let polls = 0;
    while (session.payment_status !== "paid" && polls < MAX_POLLS) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent"],
      });
      polls++;
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, error: "Payment not completed yet. Refresh in a moment." },
        { status: 402 }
      );
    }

    const orderId = session.metadata?.order_id || session.client_reference_id || undefined;
    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order not linked" }, { status: 404 });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent && typeof session.payment_intent === "object"
          ? session.payment_intent.id
          : null;

    const finalized = await finalizeOrderAfterStripePayment(orderId, paymentIntentId);
    if (!finalized.ok) {
      return NextResponse.json(
        { success: false, error: "Could not update order. Try again or contact support." },
        { status: 500 }
      );
    }

    const admin = supabaseAdmin();
    const { data: order, error } = await admin
      .from("orders")
      .select("id, order_number, status")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
    });
  } catch (e) {
    logApiError(
      "/api/checkout/verify-session",
      e instanceof Error ? e : new Error(String(e))
    );
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
