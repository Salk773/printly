import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logAdminAction, logApiError } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ApproveSchema = z.object({
  postId: z.string().uuid(),
  caption: z.string().min(1).optional(),
  hashtags: z.array(z.string()).optional(),
  selectedAudio: z.record(z.unknown()).nullable().optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  const parsed = ApproveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const update: Record<string, unknown> = {
      status: "approved",
      approved_by: authResult.user.id,
      approved_at: new Date().toISOString(),
      error_message: null,
    };

    if (parsed.data.caption) update.selected_caption = parsed.data.caption;
    if (parsed.data.hashtags) update.selected_hashtags = parsed.data.hashtags;
    if ("selectedAudio" in parsed.data) update.selected_audio = parsed.data.selectedAudio;
    if ("scheduledFor" in parsed.data) update.scheduled_for = parsed.data.scheduledFor;

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("social_posts")
      .update(update)
      .eq("id", parsed.data.postId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    logAdminAction(
      "approve",
      "social_post",
      parsed.data.postId,
      { platform: data.platform },
      authResult.user.id
    );

    return NextResponse.json({ post: data });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logApiError("/api/admin/creative-workflow/approve", err, undefined, authResult.user.id);
    return NextResponse.json(
      { error: err.message || "Failed to approve social post" },
      { status: 500 }
    );
  }
}
