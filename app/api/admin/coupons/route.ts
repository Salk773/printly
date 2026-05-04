import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CouponCreateSchema, validateRequest } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * GET /api/admin/coupons — list all coupons (admin only)
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("admin coupons list:", error);
    return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
  }

  return NextResponse.json({ coupons: data ?? [] });
}

/**
 * POST /api/admin/coupons — create coupon (admin only)
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = validateRequest(CouponCreateSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const d = parsed.data;
  const code = normalizeCode(d.code);
  if (!code) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const valid_from =
    d.valid_from && d.valid_from.length > 0 ? d.valid_from : new Date().toISOString();
  const valid_until =
    d.valid_until && String(d.valid_until).trim().length > 0 ? d.valid_until : null;

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("coupons")
    .insert({
      code,
      discount_type: d.discount_type,
      value: d.value,
      min_purchase: d.min_purchase ?? 0,
      max_discount: d.max_discount ?? null,
      valid_from,
      valid_until,
      usage_limit: d.usage_limit ?? null,
      active: d.active ?? true,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      );
    }
    console.error("admin coupon create:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ coupon: data });
}
