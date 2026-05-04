/**
 * Maps Supabase/PostgREST errors when `coupons` table is missing (migration not applied).
 */
export function hintMissingCouponsTable(errorMessage: string | undefined): string | null {
  const m = (errorMessage || "").toLowerCase();
  if (
    m.includes("schema cache") ||
    m.includes("could not find the table") ||
    (m.includes("does not exist") && (m.includes("coupon") || m.includes("coupons")))
  ) {
    return "The coupons table is missing. In Supabase → SQL Editor, run migrations/008_create_coupons_table.sql (creates public.coupons), then retry.";
  }
  return null;
}
