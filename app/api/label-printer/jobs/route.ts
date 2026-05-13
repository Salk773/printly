import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(req: NextRequest) {
  const secret = process.env.LABEL_PRINTER_AGENT_SECRET?.trim();
  if (!secret) return false;

  const auth = req.headers.get("authorization") || "";
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  return bearer === secret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status")?.trim() || "paid";
  const lookbackHoursRaw = Number(req.nextUrl.searchParams.get("lookbackHours") || 48);
  const lookbackHours = Number.isFinite(lookbackHoursRaw)
    ? Math.min(Math.max(lookbackHoursRaw, 1), 168)
    : 48;
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("status", status)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}
