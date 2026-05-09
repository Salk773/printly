import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSocialRenditions } from "@/lib/creative/providers";
import type { CreativeRendition } from "@/lib/creative/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RenditionsSchema = z.object({
  editedRenditionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  const parsed = RenditionsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: edited, error } = await admin
    .from("creative_renditions")
    .select("*")
    .eq("id", parsed.data.editedRenditionId)
    .eq("rendition_type", "edited")
    .single();

  if (error || !edited) {
    return NextResponse.json(
      { error: error?.message || "Edited rendition not found" },
      { status: 404 }
    );
  }

  const drafts = await createSocialRenditions(edited as CreativeRendition);
  const { data, error: insertError } = await admin
    .from("creative_renditions")
    .insert(
      drafts.map((draft) => ({
        asset_id: (edited as CreativeRendition).asset_id,
        rendition_type: draft.rendition_type,
        platform: draft.platform,
        storage_bucket: draft.storage_bucket,
        storage_path: draft.storage_path,
        public_url: draft.public_url,
        width: draft.width,
        height: draft.height,
        status: "ready",
        metadata: draft.metadata,
      }))
    )
    .select("*");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ renditions: data ?? [] });
}
