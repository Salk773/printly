import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logApiError } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("creative_assets")
      .select(
        `
        *,
        creative_renditions(*),
        creative_descriptions(*),
        social_posts(*)
      `
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({ assets: data ?? [] });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logApiError("/api/admin/creative-workflow", err, undefined, authResult.user.id);
    return NextResponse.json(
      { error: err.message || "Failed to load creative workflow" },
      { status: 500 }
    );
  }
}
