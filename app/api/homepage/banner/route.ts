import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/auth/rateLimit";
import { logApiCall, logAdminAction, logApiError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const BANNER_CONFIG_KEY = "homepage-banner-config.json";

/**
 * GET /api/homepage/banner
 * Get homepage banner content
 */
export async function GET() {
  try {
    const admin = supabaseAdmin();
    
    // Try to get banner config from storage
    const { data, error } = await admin.storage
      .from("uploads")
      .download(`config/${BANNER_CONFIG_KEY}`);

    if (error || !data) {
      // Return default values if config doesn't exist
      return NextResponse.json({
        title: "How Printly works",
        description: "Curated ready-to-print designs in PLA+ and PETG.",
      });
    }

    const text = await data.text();
    const config = JSON.parse(text);

    return NextResponse.json({
      title: config.title || "How Printly works",
      description: config.description || "Curated ready-to-print designs in PLA+ and PETG.",
    });
  } catch (error: any) {
    console.error("Error fetching banner config:", error);
    // Return default values on error
    return NextResponse.json({
      title: "How Printly works",
      description: "Curated ready-to-print designs in PLA+ and PETG.",
    });
  }
}

/**
 * POST /api/homepage/banner
 * Update homepage banner content (admin only)
 */
export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimitMiddleware(req, RATE_LIMITS.admin);
    if (rateLimitResponse) return rateLimitResponse;

    // Require admin authentication
    const authResult = await requireAdmin(req);
    if (!authResult.authorized) {
      logApiCall("POST", "/api/homepage/banner", 401, { ipAddress });
      return (authResult as { authorized: false; response: NextResponse }).response;
    }

    const user = authResult.user;
    logApiCall("POST", "/api/homepage/banner", undefined, { ipAddress }, user.id, ipAddress);

    const body = await req.json().catch(() => null);
    if (!body || !body.title || !body.description) {
      logApiCall("POST", "/api/homepage/banner", 400, { 
        error: "Title and description are required",
        ipAddress 
      }, user.id, ipAddress);
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const config = {
      title: body.title.trim(),
      description: body.description.trim(),
      updatedAt: new Date().toISOString(),
    };

    const admin = supabaseAdmin();
    
    // Convert config to blob
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });

    // Upload to storage (create config folder if needed)
    const { error: uploadError } = await admin.storage
      .from("uploads")
      .upload(`config/${BANNER_CONFIG_KEY}`, blob, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) {
      logApiError("/api/homepage/banner", uploadError, {
        ipAddress,
      }, user.id, ipAddress);
      console.error("Error saving banner config:", uploadError);
      return NextResponse.json(
        { error: "Failed to save banner configuration" },
        { status: 500 }
      );
    }

    // Log admin action
    logAdminAction(
      "update",
      "homepage_banner",
      undefined,
      {
        title: config.title,
        description: config.description,
        ipAddress,
      },
      user.id,
      ipAddress
    );

    logApiCall("POST", "/api/homepage/banner", 200, {
      title: config.title,
      ipAddress,
    }, user.id, ipAddress);

    return NextResponse.json({
      success: true,
      message: "Banner updated successfully",
      config: {
        title: config.title,
        description: config.description,
      },
    });
  } catch (error: any) {
    logApiError("/api/homepage/banner", error, { ipAddress });
    console.error("Error updating banner config:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

