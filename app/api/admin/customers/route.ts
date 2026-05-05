import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export interface CustomerAggregate {
  email: string;
  name: string | null;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
}

/**
 * GET /api/admin/customers — aggregate guest checkout emails from orders
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.authorized === false) return auth.response;

  const admin = supabaseAdmin();
  const { data: rows, error } = await admin
    .from("orders")
    .select("guest_email, guest_name, total, created_at");

  if (error) {
    console.error("admin customers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byEmail = new Map<
    string,
    { name: string | null; order_count: number; total_spent: number; last_order_at: string | null }
  >();

  for (const r of rows ?? []) {
    const raw = (r as { guest_email?: string | null }).guest_email;
    const email = raw?.trim().toLowerCase();
    if (!email) continue;

    const total = Number((r as { total?: unknown }).total ?? 0);
    const created = String((r as { created_at?: string }).created_at ?? "");
    const name = (r as { guest_name?: string | null }).guest_name ?? null;

    const cur = byEmail.get(email);
    if (!cur) {
      byEmail.set(email, {
        name,
        order_count: 1,
        total_spent: Number.isFinite(total) ? total : 0,
        last_order_at: created || null,
      });
    } else {
      cur.order_count += 1;
      cur.total_spent += Number.isFinite(total) ? total : 0;
      if (created && (!cur.last_order_at || created > cur.last_order_at)) {
        cur.last_order_at = created;
      }
      if (name && !cur.name) cur.name = name;
    }
  }

  const customers: CustomerAggregate[] = [...byEmail.entries()]
    .map(([email, v]) => ({
      email,
      name: v.name,
      order_count: v.order_count,
      total_spent: Math.round(v.total_spent * 100) / 100,
      last_order_at: v.last_order_at,
    }))
    .sort((a, b) => b.total_spent - a.total_spent);

  return NextResponse.json({ customers });
}
