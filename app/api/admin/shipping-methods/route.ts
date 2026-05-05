import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/** GET /api/admin/shipping-methods — includes inactive rows */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.authorized === false) return auth.response;

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("shipping_methods")
    .select("*")
    .order("name");

  if (error) {
    console.error("admin shipping-methods:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ shipping_methods: data ?? [] });
}
