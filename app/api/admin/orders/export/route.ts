import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * GET /api/admin/orders/export — CSV of orders (optional status, date range)
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.authorized === false) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim();
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();

  const admin = supabaseAdmin();
  let q = admin.from("orders").select("*").order("created_at", { ascending: false });

  if (status && status !== "all") {
    q = q.eq("status", status);
  }
  if (from) {
    q = q.gte("created_at", `${from}T00:00:00.000Z`);
  }
  if (to) {
    q = q.lte("created_at", `${to}T23:59:59.999Z`);
  }

  const { data: orders, error } = await q;

  if (error) {
    console.error("orders export:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = orders ?? [];
  const header = [
    "order_number",
    "created_at",
    "status",
    "guest_email",
    "guest_name",
    "phone",
    "city",
    "total",
    "shipping_cost",
    "stripe_payment_intent_id",
    "archived",
  ];

  const lines = [
    header.join(","),
    ...rows.map((o: Record<string, unknown>) =>
      [
        csvEscape(String(o.order_number ?? "")),
        csvEscape(String(o.created_at ?? "")),
        csvEscape(String(o.status ?? "")),
        csvEscape(String(o.guest_email ?? "")),
        csvEscape(String(o.guest_name ?? "")),
        csvEscape(String(o.phone ?? "")),
        csvEscape(String(o.city ?? "")),
        csvEscape(String(o.total ?? "")),
        csvEscape(String(o.shipping_cost ?? "")),
        csvEscape(String(o.stripe_payment_intent_id ?? "")),
        csvEscape(String(o.archived ?? "")),
      ].join(",")
    ),
  ];

  const csv = lines.join("\r\n");
  const filename = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
