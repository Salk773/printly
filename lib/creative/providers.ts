import "server-only";
import type {
  AudioSuggestion,
  CreativeAsset,
  CreativeDescription,
  CreativeRendition,
  SocialPlatform,
  TrendSuggestion,
} from "./types";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

function bananaConfig() {
  const apiKey = process.env.AI_IMAGE_PROVIDER_API_KEY;
  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: (process.env.AI_IMAGE_PROVIDER_BASE_URL || "https://aiberm.com").replace(/\/$/, ""),
    model: process.env.AI_IMAGE_PROVIDER_MODEL || "gemini-3-pro-image-preview",
  };
}

function agentLog(hypothesisId: string, message: string, data: Record<string, unknown>) {
  // #region agent log
  fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"2eb26c"},body:JSON.stringify({sessionId:"2eb26c",runId:"banana-provider",hypothesisId,location:"lib/creative/providers.ts",message,data,timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

async function downloadImageForProvider(publicUrl: string, fallbackMimeType: string | null) {
  const response = await fetch(publicUrl);
  if (!response.ok) {
    throw new Error(`Failed to download source image (${response.status})`);
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0] || fallbackMimeType || "image/png";
  const data = Buffer.from(await response.arrayBuffer()).toString("base64");
  return { mimeType, data };
}

async function getGalleryStyleReferences(limit = 3) {
  const admin = supabaseAdmin();
  const { data, error } = await admin.storage
    .from("uploads")
    .list("home-gallery", { sortBy: { column: "name", order: "asc" }, limit: 20 });

  if (error || !data?.length) {
    agentLog("T1", "No gallery style references available", {
      reason: error?.message || "empty-gallery",
    });
    return [];
  }

  const imageFiles = data
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file.name))
    .slice(0, limit);

  const references = await Promise.all(
    imageFiles.map(async (file) => {
      const publicUrl = admin.storage
        .from("uploads")
        .getPublicUrl(`home-gallery/${file.name}`).data.publicUrl;

      try {
        const image = await downloadImageForProvider(publicUrl, null);
        return { fileName: file.name, ...image };
      } catch {
        return null;
      }
    })
  );

  const usableReferences = references.filter(
    (reference): reference is { fileName: string; mimeType: string; data: string } =>
      Boolean(reference)
  );

  agentLog("T1", "Loaded gallery style references for Banana prompt", {
    requested: imageFiles.length,
    usable: usableReferences.length,
    files: usableReferences.map((reference) => reference.fileName),
  });

  return usableReferences;
}

function imagePartFromResponse(body: any) {
  const parts = body?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;

  return parts.find((part) => part?.inlineData?.data || part?.inline_data?.data) ?? null;
}

async function uploadGeneratedImage(params: {
  assetId: string;
  kind: string;
  imageBase64: string;
  mimeType: string;
}) {
  const extension = params.mimeType.includes("webp")
    ? "webp"
    : params.mimeType.includes("jpeg") || params.mimeType.includes("jpg")
      ? "jpg"
      : "png";
  const storagePath = `creative-renditions/${params.assetId}/${params.kind}-${Date.now()}.${extension}`;
  const buffer = Buffer.from(params.imageBase64, "base64");
  const admin = supabaseAdmin();

  const { error } = await admin.storage.from("uploads").upload(storagePath, buffer, {
    contentType: params.mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload Banana output: ${error.message}`);
  }

  const { data } = admin.storage.from("uploads").getPublicUrl(storagePath);
  if (!data.publicUrl) {
    throw new Error("Failed to create public URL for Banana output");
  }

  return {
    publicUrl: data.publicUrl,
    storageBucket: "uploads",
    storagePath,
  };
}

async function generateBananaImage(params: {
  sourceUrl: string;
  sourceMimeType: string | null;
  assetId: string;
  kind: string;
  prompt: string;
  aspectRatio?: string;
  width: number | null;
  height: number | null;
}) {
  const config = bananaConfig();
  if (!config) return null;

  agentLog("B1", "Banana provider enabled", {
    provider: "banana-pro-ai-studio",
    model: config.model,
    baseUrl: config.baseUrl,
    kind: params.kind,
    hasApiKey: Boolean(config.apiKey),
  });

  const source = await downloadImageForProvider(params.sourceUrl, params.sourceMimeType);
  const styleReferences = await getGalleryStyleReferences();
  agentLog("B2", "Downloaded source image for Banana edit", {
    kind: params.kind,
    mimeType: source.mimeType,
    bytesBase64Length: source.data.length,
    styleReferenceCount: styleReferences.length,
  });

  const generationConfig: Record<string, unknown> = {
    responseModalities: ["TEXT", "IMAGE"],
  };

  if (params.aspectRatio) {
    generationConfig.imageConfig = {
      aspectRatio: params.aspectRatio,
      imageSize: "2K",
    };
  }

  const parts = [
    {
      inlineData: {
        mimeType: source.mimeType,
        data: source.data,
      },
    },
    ...styleReferences.map((reference) => ({
      inlineData: {
        mimeType: reference.mimeType,
        data: reference.data,
      },
    })),
    {
      text:
        "The first image is the product photo to edit. Any following images are Printly homepage/gallery style references only. Match their visual theme, lighting, background mood, product staging, composition, and brand feel, but do not copy their exact objects or layout. " +
        params.prompt,
    },
  ];

  const response = await fetch(`${config.baseUrl}/v1beta/models/${config.model}:generateContent`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts,
        },
      ],
      generationConfig,
    }),
  });

  const body = await response.json().catch(() => null);
  agentLog("B3", "Banana API response received", {
    kind: params.kind,
    ok: response.ok,
    status: response.status,
    hasCandidates: Array.isArray(body?.candidates),
    errorMessage: body?.error?.message,
  });

  if (!response.ok) {
    throw new Error(body?.error?.message || `Banana image API failed (${response.status})`);
  }

  const imagePart = imagePartFromResponse(body);
  const imageBase64 = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
  const imageMimeType = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || "image/png";

  if (!imageBase64) {
    throw new Error("Banana image API did not return an image");
  }

  const uploaded = await uploadGeneratedImage({
    assetId: params.assetId,
    kind: params.kind,
    imageBase64,
    mimeType: imageMimeType,
  });

  agentLog("B4", "Uploaded Banana output to Supabase storage", {
    kind: params.kind,
    storagePath: uploaded.storagePath,
    mimeType: imageMimeType,
  });

  return {
    public_url: uploaded.publicUrl,
    storage_bucket: uploaded.storageBucket,
    storage_path: uploaded.storagePath,
    width: params.width,
    height: params.height,
    metadata: {
      provider: "banana-pro-ai-studio",
      model: config.model,
      source: config.baseUrl,
      prompt: params.prompt,
    },
  };
}

export async function editImage(asset: CreativeAsset): Promise<ImageEditResult> {
  const banana = await generateBananaImage({
    sourceUrl: asset.public_url,
    sourceMimeType: asset.content_type,
    assetId: asset.id,
    kind: "edited",
    prompt:
      "Polish this product photo for Printly's ecommerce gallery. Keep the product accurate, preserve its shape/material/color, clean up lighting and background, and make it feel like it belongs beside the existing Printly gallery photos. Do not add text or logos.",
    width: null,
    height: null,
  });

  if (banana) {
    return {
      rendition_type: "edited",
      ...banana,
    };
  }

  agentLog("B1", "Banana provider not configured; using fallback image", {
    provider: "fallback",
    hasApiKey: false,
  });

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
  const instagram = await generateBananaImage({
    sourceUrl: edited.public_url,
    sourceMimeType: null,
    assetId: edited.asset_id,
    kind: "instagram",
    prompt:
      "Create an Instagram-ready product image from this edited product photo. Follow the existing Printly gallery theme for background styling, lighting, color palette, and product staging. Make it premium and scroll-stopping with enough negative space for a caption overlay, but do not add text.",
    aspectRatio: "4:5",
    width: 1080,
    height: 1350,
  });

  const tiktok = await generateBananaImage({
    sourceUrl: edited.public_url,
    sourceMimeType: null,
    assetId: edited.asset_id,
    kind: "tiktok",
    prompt:
      "Create a TikTok/Reels vertical product visual from this edited product photo. Follow the existing Printly gallery theme while making the composition more dynamic for vertical social content. Use premium lighting and tasteful branded styling, but do not add text.",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
  });

  if (instagram && tiktok) {
    return [
      {
        rendition_type: "social",
        platform: "instagram",
        ...instagram,
        width: 1080,
        height: 1350,
      },
      {
        rendition_type: "social",
        platform: "tiktok",
        ...tiktok,
        width: 1080,
        height: 1920,
      },
    ];
  }

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
