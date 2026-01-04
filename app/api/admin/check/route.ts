import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { verifyAdmin } from "@/lib/auth/adminAuth";
import { logApiCall, logApiError } from "@/lib/logger";

/**
 * API endpoint to check if current user is an admin
 * Used by client-side admin page to verify admin status
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    const authResult = await verifyAdmin(req);

    if (!authResult.authorized) {
      const statusCode = authResult.error?.includes("not an admin") ? 403 : 401;
      logApiCall("GET", "/api/admin/check", statusCode, { 
        error: authResult.error,
        ipAddress 
      }, undefined, ipAddress);
      return NextResponse.json(
        { isAdmin: false, error: authResult.error },
        { status: statusCode }
      );
    }

    logApiCall("GET", "/api/admin/check", 200, {
      userId: authResult.user!.id,
      email: authResult.user!.email,
      ipAddress,
    }, authResult.user!.id, ipAddress);

    return NextResponse.json({
      isAdmin: true,
      user: {
        id: authResult.user!.id,
        email: authResult.user!.email,
      },
    });
  } catch (error: any) {
    logApiError("/api/admin/check", error, { ipAddress });
    console.error("Admin check error:", error);
    return NextResponse.json(
      { isAdmin: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

