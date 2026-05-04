import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CouponUpdateSchema, validateRequest } from "@/lib/validation/schemas";
import { hintMissingCouponsTable } from "@/lib/couponsDbHint";

export const dynamic = "force-dynamic";

const uuidSchema = z.string().uuid();

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * PATCH /api/admin/coupons/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  const idParsed = uuidSchema.safeParse(params.id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid coupon id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = validateRequest(CouponUpdateSchema, body);
  if (parsed.success === false) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const d = parsed.data;
  const updates: Record<string, unknown> = {};

  if (d.code !== undefined) {
    const code = normalizeCode(d.code);
    if (!code) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    updates.code = code;
  }
  if (d.discount_type !== undefined) updates.discount_type = d.discount_type;
  if (d.value !== undefined) updates.value = d.value;
  if (d.min_purchase !== undefined) updates.min_purchase = d.min_purchase;
  if (d.max_discount !== undefined) updates.max_discount = d.max_discount;
  if (d.valid_from !== undefined) {
    updates.valid_from =
      d.valid_from && String(d.valid_from).trim().length > 0 ? d.valid_from : null;
  }
  if (d.valid_until !== undefined) {
    updates.valid_until =
      d.valid_until && String(d.valid_until).trim().length > 0 ? d.valid_until : null;
  }
  if (d.usage_limit !== undefined) updates.usage_limit = d.usage_limit;
  if (d.active !== undefined) updates.active = d.active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("coupons")
    .update(updates)
    .eq("id", idParsed.data)
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      );
    }
    console.error("admin coupon patch:", error);
    const hint = hintMissingCouponsTable(error.message);
    return NextResponse.json({ error: hint ?? error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  return NextResponse.json({ coupon: data });
}

/**
 * DELETE /api/admin/coupons/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  const idParsed = uuidSchema.safeParse(params.id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid coupon id" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from("coupons").delete().eq("id", idParsed.data);

  if (error) {
    console.error("admin coupon delete:", error);
    const hint = hintMissingCouponsTable(error.message);
    return NextResponse.json({ error: hint ?? error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
