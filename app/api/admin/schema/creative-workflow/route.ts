import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schemaSql = `
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight_text TEXT,
  ADD COLUMN IF NOT EXISTS dimensions_text TEXT;

COMMENT ON COLUMN public.products.weight_text IS 'Free-form weight label for product detail (e.g. 250 g, 2.5 kg)';
COMMENT ON COLUMN public.products.dimensions_text IS 'Free-form dimensions label (e.g. 30 x 20 x 5 cm)';

CREATE TABLE IF NOT EXISTS public.creative_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_filename TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'uploads',
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  content_type TEXT,
  file_size BIGINT,
  status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'processing', 'ready', 'failed', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.creative_renditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.creative_assets(id) ON DELETE CASCADE,
  rendition_type TEXT NOT NULL CHECK (rendition_type IN ('edited', 'social')),
  platform TEXT CHECK (platform IN ('instagram', 'tiktok')),
  storage_bucket TEXT NOT NULL DEFAULT 'uploads',
  storage_path TEXT,
  public_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  status TEXT NOT NULL DEFAULT 'ready'
    CHECK (status IN ('processing', 'ready', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.creative_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.creative_assets(id) ON DELETE CASCADE,
  rendition_id UUID REFERENCES public.creative_renditions(id) ON DELETE SET NULL,
  platform TEXT CHECK (platform IN ('instagram', 'tiktok')),
  description_type TEXT NOT NULL CHECK (description_type IN ('image', 'caption', 'social')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trend_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.creative_assets(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  hashtags JSONB NOT NULL DEFAULT '[]'::jsonb,
  audios JSONB NOT NULL DEFAULT '[]'::jsonb,
  source TEXT NOT NULL DEFAULT 'fallback',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.creative_assets(id) ON DELETE CASCADE,
  rendition_id UUID REFERENCES public.creative_renditions(id) ON DELETE SET NULL,
  description_id UUID REFERENCES public.creative_descriptions(id) ON DELETE SET NULL,
  trend_snapshot_id UUID REFERENCES public.trend_snapshots(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  status TEXT NOT NULL DEFAULT 'waiting_approval'
    CHECK (status IN ('draft', 'waiting_approval', 'approved', 'publishing', 'published', 'failed', 'rejected')),
  selected_caption TEXT NOT NULL,
  selected_hashtags TEXT[] NOT NULL DEFAULT '{}',
  selected_audio JSONB,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  publish_provider TEXT,
  provider_post_id TEXT,
  publish_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creative_assets_created_at ON public.creative_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_assets_status ON public.creative_assets(status);
CREATE INDEX IF NOT EXISTS idx_creative_renditions_asset_id ON public.creative_renditions(asset_id);
CREATE INDEX IF NOT EXISTS idx_creative_descriptions_asset_id ON public.creative_descriptions(asset_id);
CREATE INDEX IF NOT EXISTS idx_trend_snapshots_asset_platform ON public.trend_snapshots(asset_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_asset_id ON public.social_posts(asset_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON public.social_posts(platform);

CREATE OR REPLACE FUNCTION public.set_creative_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_creative_assets_updated_at ON public.creative_assets;
CREATE TRIGGER set_creative_assets_updated_at
  BEFORE UPDATE ON public.creative_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_creative_workflow_updated_at();

DROP TRIGGER IF EXISTS set_creative_renditions_updated_at ON public.creative_renditions;
CREATE TRIGGER set_creative_renditions_updated_at
  BEFORE UPDATE ON public.creative_renditions
  FOR EACH ROW EXECUTE FUNCTION public.set_creative_workflow_updated_at();

DROP TRIGGER IF EXISTS set_social_posts_updated_at ON public.social_posts;
CREATE TRIGGER set_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_creative_workflow_updated_at();

ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_renditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
`;

function connectionString() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!password || !supabaseUrl) return null;

  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  const conn = connectionString();
  if (!conn) {
    return NextResponse.json(
      {
        success: false,
        needsDatabaseCredentials: true,
        message:
          "Add DATABASE_URL or SUPABASE_DB_PASSWORD to .env.local, then run setup again. You can also paste the SQL into Supabase SQL Editor.",
        sql: schemaSql.trim(),
      },
      { status: 200 }
    );
  }

  try {
    const pg = await import("pg");
    const client = new pg.Client({
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    try {
      await client.query(schemaSql);
    } finally {
      await client.end();
    }

    return NextResponse.json({
      success: true,
      message: "Product columns and social workflow tables are ready.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to set up database schema"),
        sql: schemaSql.trim(),
      },
      { status: 500 }
    );
  }
}
