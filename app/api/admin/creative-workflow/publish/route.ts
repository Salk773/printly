import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logAdminAction, logApiError } from "@/lib/logger";
import { publishSocialPost } from "@/lib/socialPublishing";
import { getErrorMessage } from "@/lib/errorMessage";
import type { CreativeRendition, SocialPost } from "@/lib/creative/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PublishSchema = z.object({
  postId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  const parsed = PublishSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const admin = supabaseAdmin();

  try {
    const { data: post, error: postError } = await admin
      .from("social_posts")
      .select("*")
      .eq("id", parsed.data.postId)
      .single();

    if (postError || !post) {
      throw postError ?? new Error("Social post not found");
    }

    const typedPost = post as SocialPost;
    if (typedPost.status !== "approved" && typedPost.status !== "failed") {
      return NextResponse.json(
        { error: "Post must be approved before publishing" },
        { status: 400 }
      );
    }

    await admin
      .from("social_posts")
      .update({ status: "publishing", error_message: null })
      .eq("id", typedPost.id);

    let mediaUrl: string | null = null;
    if (typedPost.rendition_id) {
      const { data: rendition } = await admin
        .from("creative_renditions")
        .select("*")
        .eq("id", typedPost.rendition_id)
        .single();
      mediaUrl = (rendition as CreativeRendition | null)?.public_url ?? null;
    }

    const publishResult = await publishSocialPost({
      post: typedPost,
      mediaUrl,
      platform: typedPost.platform,
    });

    const { data: updated, error: updateError } = await admin
      .from("social_posts")
      .update({
        status: publishResult.status === "published" ? "published" : "draft",
        publish_provider: publishResult.provider,
        provider_post_id: publishResult.providerPostId,
        publish_result: publishResult.result,
        error_message: null,
      })
      .eq("id", typedPost.id)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    logAdminAction(
      "publish",
      "social_post",
      typedPost.id,
      { platform: typedPost.platform, provider: publishResult.provider },
      authResult.user.id
    );

    return NextResponse.json({ post: updated });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(getErrorMessage(error));
    await admin
      .from("social_posts")
      .update({ status: "failed", error_message: err.message })
      .eq("id", parsed.data.postId);
    logApiError("/api/admin/creative-workflow/publish", err, undefined, authResult.user.id);
    return NextResponse.json(
      { error: getErrorMessage(err, "Failed to publish social post") },
      { status: 500 }
    );
  }
}
