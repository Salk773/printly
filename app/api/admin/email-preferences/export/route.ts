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
 * GET /api/admin/email-preferences/export — CSV of user notification preferences (admin only)
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.authorized === false) return auth.response;

  const admin = supabaseAdmin();
  const { data: prefs, error } = await admin.from("email_preferences").select("*");

  if (error) {
    console.error("email-preferences export:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows: string[][] = [["user_id", "email", "order_updates", "promotions", "newsletters", "updated_at"]];

  for (const p of prefs ?? []) {
    const userId = String((p as { user_id: string }).user_id);
    let email = "";
    try {
      const { data } = await admin.auth.admin.getUserById(userId);
      email = data.user?.email ?? "";
    } catch {
      email = "";
    }
    rows.push([
      userId,
      email,
      String((p as { order_updates?: boolean }).order_updates ?? ""),
      String((p as { promotions?: boolean }).promotions ?? ""),
      String((p as { newsletters?: boolean }).newsletters ?? ""),
      String((p as { updated_at?: string }).updated_at ?? ""),
    ]);
  }

  const csv = rows.map((line) => line.map((c) => csvEscape(c)).join(",")).join("\r\n");
  const filename = `email-preferences-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
