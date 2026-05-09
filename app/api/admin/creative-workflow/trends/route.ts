import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { researchTrends } from "@/lib/creative/providers";
import type { SocialPlatform } from "@/lib/creative/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TrendsSchema = z.object({
  platform: z.enum(["instagram", "tiktok"]),
  hashtags: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  const parsed = TrendsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const trends = await researchTrends(
    parsed.data.platform as SocialPlatform,
    parsed.data.hashtags
  );

  return NextResponse.json({ trends });
}
