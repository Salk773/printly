import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendPaidOrderEmails } from "@/lib/orderNotifications";

type OrderRow = {
  id: string;
  status: string;
  order_number: string | null;
  guest_email: string | null;
  guest_name: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  items: unknown;
  total: number;
  notes: string | null;
};

/**
 * Idempotent: sets order to paid when Stripe reports success.
 * Safe if webhook already ran (skips update + duplicate emails).
 */
export async function finalizeOrderAfterStripePayment(
  orderId: string,
  paymentIntentId: string | null
): Promise<{ ok: boolean; skipped: boolean }> {
  const admin = supabaseAdmin();

  const { data: existing, error: fetchErr } = await admin
    .from("orders")
    .select(
      "id, status, order_number, guest_email, guest_name, phone, address_line_1, address_line_2, city, state, postal_code, items, total, notes"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return { ok: false, skipped: false };
  }

  if (existing.status === "paid") {
    return { ok: true, skipped: true };
  }

  const { error: updErr } = await admin
    .from("orders")
    .update({
      status: "paid",
      stripe_payment_intent_id: paymentIntentId || null,
    })
    .eq("id", orderId);

  if (updErr) {
    return { ok: false, skipped: false };
  }

  try {
    await sendPaidOrderEmails(existing as OrderRow);
  } catch {
    /* logged elsewhere */
  }

  return { ok: true, skipped: false };
}
