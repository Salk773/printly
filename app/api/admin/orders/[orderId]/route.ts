import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const uuidSchema = z.string().uuid();

/**
 * GET /api/admin/orders/[orderId]
 * Returns a single order row for admin label printing and tools.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;

  const parsed = uuidSchema.safeParse(params.orderId);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", parsed.data)
    .maybeSingle();

  if (error) {
    console.error("admin order fetch:", error);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: data });
}
