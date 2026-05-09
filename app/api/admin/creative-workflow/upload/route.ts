import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logAdminAction, logApiError } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UploadSchema = z.object({
  original_filename: z.string().min(1),
  storage_bucket: z.string().min(1).default("uploads"),
  storage_path: z.string().min(1),
  public_url: z.string().url(),
  content_type: z.string().optional().nullable(),
  file_size: z.number().int().positive().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  try {
    const parsed = UploadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("creative_assets")
      .insert({
        ...parsed.data,
        status: "uploaded",
        created_by: authResult.user.id,
        created_by_email: authResult.user.email,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    logAdminAction(
      "upload",
      "creative_asset",
      data.id,
      { storagePath: data.storage_path },
      authResult.user.id
    );

    return NextResponse.json({ asset: data });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logApiError("/api/admin/creative-workflow/upload", err, undefined, authResult.user.id);
    return NextResponse.json(
      { error: err.message || "Failed to register upload" },
      { status: 500 }
    );
  }
}
