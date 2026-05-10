import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logAdminAction, logApiError } from "@/lib/logger";
import {
  createSocialRenditions,
  editImage,
  generateDescriptions,
  researchTrends,
} from "@/lib/creative/providers";
import { getErrorMessage } from "@/lib/errorMessage";
import type {
  CreativeAsset,
  CreativeDescription,
  CreativeRendition,
  SocialPlatform,
  TrendSnapshot,
} from "@/lib/creative/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ProcessSchema = z.object({
  assetId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  const rawBody = await req.json().catch(() => null);
  // #region agent log
  fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"2eb26c"},body:JSON.stringify({sessionId:"2eb26c",runId:"workflow-process",hypothesisId:"P1,P2,P3",location:"app/api/admin/creative-workflow/process/route.ts:raw-body",message:"Process route received body",data:{body:rawBody,assetIdType:typeof rawBody?.assetId,assetId:String(rawBody?.assetId??""),isLocalId:String(rawBody?.assetId??"").startsWith("local-")},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const parsed = ProcessSchema.safeParse(rawBody);
  if (!parsed.success) {
    // #region agent log
    fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"2eb26c"},body:JSON.stringify({sessionId:"2eb26c",runId:"workflow-process",hypothesisId:"P1,P2,P3",location:"app/api/admin/creative-workflow/process/route.ts:parse-failed",message:"Process route schema validation failed",data:{issues:parsed.error.issues},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const admin = supabaseAdmin();

  try {
    await admin
      .from("creative_assets")
      .update({ status: "processing", error_message: null })
      .eq("id", parsed.data.assetId);

    const { data: asset, error: assetError } = await admin
      .from("creative_assets")
      .select("*")
      .eq("id", parsed.data.assetId)
      .single();

    if (assetError || !asset) {
      throw assetError ?? new Error("Creative asset not found");
    }

    const typedAsset = asset as CreativeAsset;
    const editedDraft = await editImage(typedAsset);
    const { data: edited, error: editedError } = await admin
      .from("creative_renditions")
      .insert({
        asset_id: typedAsset.id,
        rendition_type: editedDraft.rendition_type,
        platform: null,
        storage_bucket: editedDraft.storage_bucket,
        storage_path: editedDraft.storage_path,
        public_url: editedDraft.public_url,
        width: editedDraft.width,
        height: editedDraft.height,
        status: "ready",
        metadata: editedDraft.metadata,
      })
      .select("*")
      .single();

    if (editedError || !edited) {
      throw editedError ?? new Error("Failed to create edited rendition");
    }

    const typedEdited = edited as CreativeRendition;
    const copy = await generateDescriptions(typedAsset);

    const { error: imageDescriptionError } = await admin
      .from("creative_descriptions")
      .insert({
        asset_id: typedAsset.id,
        rendition_id: typedEdited.id,
        platform: null,
        description_type: "image",
        title: copy.image.title,
        description: copy.image.description,
        caption: null,
        hashtags: [],
        metadata: { provider: "fallback" },
      });

    if (imageDescriptionError) {
      throw imageDescriptionError;
    }

    const socialRenditions = await createSocialRenditions(typedEdited);

    for (const renditionDraft of socialRenditions) {
      const platform = renditionDraft.platform;
      const platformCopy = copy.captions[platform];

      const { data: rendition, error: renditionError } = await admin
        .from("creative_renditions")
        .insert({
          asset_id: typedAsset.id,
          rendition_type: "social",
          platform,
          storage_bucket: renditionDraft.storage_bucket,
          storage_path: renditionDraft.storage_path,
          public_url: renditionDraft.public_url,
          width: renditionDraft.width,
          height: renditionDraft.height,
          status: "ready",
          metadata: renditionDraft.metadata,
        })
        .select("*")
        .single();

      if (renditionError || !rendition) {
        throw renditionError ?? new Error(`Failed to create ${platform} rendition`);
      }

      const { data: description, error: descriptionError } = await admin
        .from("creative_descriptions")
        .insert({
          asset_id: typedAsset.id,
          rendition_id: (rendition as CreativeRendition).id,
          platform,
          description_type: "social",
          title: platformCopy.title,
          description: platformCopy.description,
          caption: platformCopy.caption,
          hashtags: platformCopy.hashtags,
          metadata: { provider: "fallback" },
        })
        .select("*")
        .single();

      if (descriptionError || !description) {
        throw descriptionError ?? new Error(`Failed to create ${platform} description`);
      }

      const trend = await researchTrends(platform as SocialPlatform, platformCopy.hashtags);
      const { data: trendSnapshot, error: trendError } = await admin
        .from("trend_snapshots")
        .insert({
          asset_id: typedAsset.id,
          platform,
          hashtags: trend.hashtags,
          audios: trend.audios,
          source: trend.source,
          metadata: trend.metadata,
        })
        .select("*")
        .single();

      if (trendError || !trendSnapshot) {
        throw trendError ?? new Error(`Failed to save ${platform} trend snapshot`);
      }

      const firstAudio = (trendSnapshot as TrendSnapshot).audios?.[0] ?? null;
      const rankedHashtags = (trendSnapshot as TrendSnapshot).hashtags.map((tag) => tag.label);

      const { error: postError } = await admin.from("social_posts").insert({
        asset_id: typedAsset.id,
        rendition_id: (rendition as CreativeRendition).id,
        description_id: (description as CreativeDescription).id,
        trend_snapshot_id: (trendSnapshot as TrendSnapshot).id,
        platform,
        status: "waiting_approval",
        selected_caption: platformCopy.caption,
        selected_hashtags: rankedHashtags,
        selected_audio: firstAudio,
      });

      if (postError) {
        throw postError;
      }
    }

    const { data: refreshed, error: refreshError } = await admin
      .from("creative_assets")
      .update({ status: "ready", error_message: null })
      .eq("id", typedAsset.id)
      .select(
        `
        *,
        creative_renditions(*),
        creative_descriptions(*),
        social_posts(*)
      `
      )
      .single();

    if (refreshError) {
      throw refreshError;
    }

    logAdminAction(
      "process",
      "creative_asset",
      typedAsset.id,
      { socialPlatforms: ["instagram", "tiktok"] },
      authResult.user.id
    );

    return NextResponse.json({ asset: refreshed });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(getErrorMessage(error));
    await admin
      .from("creative_assets")
      .update({ status: "failed", error_message: err.message })
      .eq("id", parsed.data.assetId);
    logApiError("/api/admin/creative-workflow/process", err, undefined, authResult.user.id);
    return NextResponse.json(
      { error: getErrorMessage(err, "Failed to process creative asset") },
      { status: 500 }
    );
  }
}
