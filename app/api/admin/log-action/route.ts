import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { logAdminAction } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/log-action
 * Log admin actions from client-side
 * Admin-only access
 */
export async function POST(req: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(req);
    if (!authResult.authorized) {
      return (authResult as { authorized: false; response: NextResponse }).response;
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { action, resource, resourceId, metadata } = body;

    if (!action || !resource) {
      return NextResponse.json(
        { error: "Action and resource are required" },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    // Log the admin action
    logAdminAction(
      action,
      resource,
      resourceId,
      metadata,
      authResult.user.id,
      ipAddress
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Log action error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

