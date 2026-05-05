import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateCartStock } from "@/lib/orderStock";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const rawItems = body?.items as Array<{ id?: unknown; quantity?: unknown }> | undefined;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
    }

    const lines = rawItems.map((i) => ({
      id: String(i.id ?? ""),
      quantity: Math.min(Math.max(1, Math.floor(Number(i.quantity ?? 1))), 999),
    }));

    if (lines.some((l) => !l.id)) {
      return NextResponse.json({ success: false, error: "Invalid line items" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const check = await validateCartStock(admin, lines);
    if (check.ok === false) {
      return NextResponse.json({ success: false, error: check.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Validation failed" },
      { status: 500 }
    );
  }
}
