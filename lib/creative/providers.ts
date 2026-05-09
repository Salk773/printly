import "server-only";
import type {
  AudioSuggestion,
  CreativeAsset,
  CreativeDescription,
  CreativeRendition,
  SocialPlatform,
  TrendSuggestion,
} from "./types";

export interface ImageEditResult {
  rendition_type: "edited";
  public_url: string;
  storage_bucket: string;
  storage_path: string | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown>;
}

export interface SocialRenditionDraft {
  rendition_type: "social";
  platform: SocialPlatform;
  public_url: string;
  storage_bucket: string;
  storage_path: string | null;
  width: number;
  height: number;
  metadata: Record<string, unknown>;
}

export interface GeneratedCopy {
  image: {
    title: string;
    description: string;
  };
  captions: Record<
    SocialPlatform,
    {
      title: string;
      description: string;
      caption: string;
      hashtags: string[];
    }
  >;
}

export interface TrendResearchResult {
  platform: SocialPlatform;
  hashtags: TrendSuggestion[];
  audios: AudioSuggestion[];
  source: string;
  metadata: Record<string, unknown>;
}

function readableName(filename: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  return withoutExtension
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Printly product";
}

function baseHashtags(platform: SocialPlatform) {
  const shared = ["#Printly", "#CustomPrints", "#GiftIdeas", "#SmallBusiness"];
  return platform === "tiktok"
    ? [...shared, "#TikTokMadeMeBuyIt", "#ShopTok"]
    : [...shared, "#InstaGifts", "#HomeDecor"];
}

export async function editImage(asset: CreativeAsset): Promise<ImageEditResult> {
  return {
    rendition_type: "edited",
    public_url: asset.public_url,
    storage_bucket: asset.storage_bucket,
    storage_path: asset.storage_path,
    width: null,
    height: null,
    metadata: {
      provider: "fallback",
      note: "No image AI provider is configured; using the uploaded image as the edited rendition.",
    },
  };
}

export async function generateDescriptions(asset: CreativeAsset): Promise<GeneratedCopy> {
  const name = readableName(asset.original_filename);
  const description =
    `A polished product image for ${name}, prepared for Printly marketing and social media use.`;

  return {
    image: {
      title: name,
      description,
    },
    captions: {
      instagram: {
        title: `${name} for Instagram`,
        description: `Instagram-ready caption for ${name}.`,
        caption:
          `Fresh from Printly: ${name}. A clean, giftable piece made to stand out in your feed. Save this for your next custom print idea.`,
        hashtags: baseHashtags("instagram"),
      },
      tiktok: {
        title: `${name} for TikTok`,
        description: `TikTok-ready caption for ${name}.`,
        caption:
          `Watch this custom Printly piece go from simple photo to scroll-stopping gift idea. Which design should we make next?`,
        hashtags: baseHashtags("tiktok"),
      },
    },
  };
}

export async function createSocialRenditions(
  edited: CreativeRendition
): Promise<SocialRenditionDraft[]> {
  return [
    {
      rendition_type: "social",
      platform: "instagram",
      public_url: edited.public_url,
      storage_bucket: edited.storage_bucket,
      storage_path: edited.storage_path,
      width: 1080,
      height: 1350,
      metadata: {
        provider: "fallback",
        format: "instagram_portrait",
        note: "Uses the edited image directly until a rendering provider is configured.",
      },
    },
    {
      rendition_type: "social",
      platform: "tiktok",
      public_url: edited.public_url,
      storage_bucket: edited.storage_bucket,
      storage_path: edited.storage_path,
      width: 1080,
      height: 1920,
      metadata: {
        provider: "fallback",
        format: "tiktok_vertical",
        note: "Uses the edited image directly until a rendering provider is configured.",
      },
    },
  ];
}

export async function researchTrends(
  platform: SocialPlatform,
  seedHashtags: string[]
): Promise<TrendResearchResult> {
  const hashtags = seedHashtags.map((tag, index) => ({
    label: tag,
    reason: "Matched to Printly product content and reusable brand/category intent.",
    score: 100 - index * 5,
  }));

  const audios: AudioSuggestion[] =
    platform === "tiktok"
      ? [
          {
            label: "Trending upbeat product reveal sound",
            reason: "Works well for before/after product edits and reveal videos.",
            score: 88,
            usage_note: "Select the current matching commercial-safe sound inside TikTok before posting.",
            commercial_safe: true,
          },
          {
            label: "Soft aesthetic showcase audio",
            reason: "Fits premium product shots and gift-focused content.",
            score: 79,
            usage_note: "Confirm account music rights before final publish.",
            commercial_safe: true,
          },
        ]
      : [
          {
            label: "Instagram Reels product reveal audio",
            reason: "Useful for quick product transformations and carousel-to-reel edits.",
            score: 84,
            usage_note: "Pick from currently available commercial audio in Instagram.",
            commercial_safe: true,
          },
        ];

  return {
    platform,
    hashtags,
    audios,
    source: "fallback",
    metadata: {
      note: "Replace with a trend data provider or scheduler analytics source when credentials are available.",
    },
  };
}
