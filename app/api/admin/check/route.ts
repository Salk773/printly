import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { verifyAdmin } from "@/lib/auth/adminAuth";

/**
 * API endpoint to check if current user is an admin
 * Used by client-side admin page to verify admin status
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAdmin(req);

    if (!authResult.authorized) {
      return NextResponse.json(
        { isAdmin: false, error: authResult.error },
        { status: authResult.error?.includes("not an admin") ? 403 : 401 }
      );
    }

    return NextResponse.json({
      isAdmin: true,
      user: {
        id: authResult.user!.id,
        email: authResult.user!.email,
      },
    });
  } catch (error: any) {
    console.error("Admin check error:", error);
    return NextResponse.json(
      { isAdmin: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

