export type SocialPlatform = "instagram" | "tiktok";

export type CreativeAssetStatus =
  | "uploaded"
  | "processing"
  | "ready"
  | "failed"
  | "archived";

export type SocialPostStatus =
  | "draft"
  | "waiting_approval"
  | "approved"
  | "publishing"
  | "published"
  | "failed"
  | "rejected";

export interface CreativeAsset {
  id: string;
  original_filename: string;
  storage_bucket: string;
  storage_path: string;
  public_url: string;
  content_type: string | null;
  file_size: number | null;
  status: CreativeAssetStatus;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_by_email: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreativeRendition {
  id: string;
  asset_id: string;
  rendition_type: "edited" | "social";
  platform: SocialPlatform | null;
  storage_bucket: string;
  storage_path: string | null;
  public_url: string;
  width: number | null;
  height: number | null;
  status: "processing" | "ready" | "failed";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreativeDescription {
  id: string;
  asset_id: string;
  rendition_id: string | null;
  platform: SocialPlatform | null;
  description_type: "image" | "caption" | "social";
  title: string;
  description: string;
  caption: string | null;
  hashtags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TrendSuggestion {
  label: string;
  reason: string;
  score: number;
}

export interface AudioSuggestion extends TrendSuggestion {
  usage_note: string;
  commercial_safe: boolean;
}

export interface TrendSnapshot {
  id: string;
  asset_id: string;
  platform: SocialPlatform;
  hashtags: TrendSuggestion[];
  audios: AudioSuggestion[];
  source: string;
  metadata: Record<string, unknown>;
  captured_at: string;
}

export interface SocialPost {
  id: string;
  asset_id: string;
  rendition_id: string | null;
  description_id: string | null;
  trend_snapshot_id: string | null;
  platform: SocialPlatform;
  status: SocialPostStatus;
  selected_caption: string;
  selected_hashtags: string[];
  selected_audio: AudioSuggestion | null;
  scheduled_for: string | null;
  approved_by: string | null;
  approved_at: string | null;
  publish_provider: string | null;
  provider_post_id: string | null;
  publish_result: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreativeWorkflowItem extends CreativeAsset {
  creative_renditions?: CreativeRendition[];
  creative_descriptions?: CreativeDescription[];
  social_posts?: SocialPost[];
}
