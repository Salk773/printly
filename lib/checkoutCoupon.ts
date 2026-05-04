import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";

export type CouponValidationResult =
  | {
      ok: true;
      discountAed: number;
      codeNormalized: string;
      discountType: "percentage" | "fixed";
    }
  | { ok: false; error: string };

/**
 * Validates an active coupon against product subtotal only (shipping excluded).
 */
export async function validateCouponForSubtotal(
  rawCode: string,
  subtotalAed: number
): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase().replace(/\s+/g, "");
  if (!code) {
    return { ok: false, error: "Coupon code is required" };
  }

  const supabase = supabaseServer();
  const { data: coupon, error: fetchError } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("active", true)
    .single();

  if (fetchError || !coupon) {
    return { ok: false, error: "Invalid coupon code" };
  }

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { ok: false, error: "Coupon not yet valid" };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { ok: false, error: "Coupon has expired" };
  }
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    return { ok: false, error: "Coupon usage limit reached" };
  }
  if (coupon.min_purchase && subtotalAed < coupon.min_purchase) {
    return {
      ok: false,
      error: `Minimum purchase of ${coupon.min_purchase} AED required`,
    };
  }

  let discountAmount = 0;
  if (coupon.discount_type === "percentage") {
    discountAmount = (subtotalAed * Number(coupon.value)) / 100;
    if (coupon.max_discount != null) {
      discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
    }
  } else {
    discountAmount = Number(coupon.value);
  }

  discountAmount = Math.min(discountAmount, subtotalAed);
  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    ok: true,
    discountAed: discountAmount,
    codeNormalized: coupon.code,
    discountType: coupon.discount_type === "fixed" ? "fixed" : "percentage",
  };
}
