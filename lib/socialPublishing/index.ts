import "server-only";
import type { SocialPlatform, SocialPost } from "@/lib/creative/types";

export interface PublishPayload {
  post: SocialPost;
  mediaUrl: string | null;
  platform: SocialPlatform;
}

export interface PublishResult {
  provider: string;
  providerPostId: string | null;
  status: "published" | "draft";
  result: Record<string, unknown>;
}

async function publishViaScheduler(payload: PublishPayload): Promise<PublishResult> {
  const webhookUrl = process.env.SOCIAL_SCHEDULER_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      provider: "fallback-scheduler",
      providerPostId: `draft_${payload.post.id}`,
      status: "draft",
      result: {
        message:
          "No SOCIAL_SCHEDULER_WEBHOOK_URL configured. Created an internal draft instead of publishing.",
        platform: payload.platform,
        mediaUrl: payload.mediaUrl,
      },
    };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.SOCIAL_SCHEDULER_API_KEY
        ? { Authorization: `Bearer ${process.env.SOCIAL_SCHEDULER_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      platform: payload.platform,
      caption: payload.post.selected_caption,
      hashtags: payload.post.selected_hashtags,
      audio: payload.post.selected_audio,
      mediaUrl: payload.mediaUrl,
      scheduledFor: payload.post.scheduled_for,
      sourcePostId: payload.post.id,
    }),
  });

  const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      typeof result.error === "string"
        ? result.error
        : `Scheduler publish failed with status ${response.status}`
    );
  }

  return {
    provider: "scheduler-webhook",
    providerPostId:
      typeof result.id === "string"
        ? result.id
        : typeof result.postId === "string"
          ? result.postId
          : null,
    status: "published",
    result,
  };
}

export async function publishSocialPost(payload: PublishPayload): Promise<PublishResult> {
  return publishViaScheduler(payload);
}
