import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getAdminEmails } from "@/lib/adminEmails";

/**
 * Server-side admin authorization middleware
 * Verifies user is authenticated and has admin privileges
 */
export async function verifyAdmin(req: NextRequest): Promise<{
  authorized: boolean;
  user?: { id: string; email: string };
  error?: string;
}> {
  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        authorized: false,
        error: "Missing or invalid authorization header",
      };
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client with anon key to verify user session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        authorized: false,
        error: "Server configuration error",
      };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    // Verify the token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user || !user.email) {
      return {
        authorized: false,
        error: "Invalid or expired token",
      };
    }

    // Check if user email is in admin list
    const adminEmails = getAdminEmails();
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return {
        authorized: false,
        error: "User is not an admin",
      };
    }

    return {
      authorized: true,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch (error: any) {
    console.error("Admin auth error:", error);
    return {
      authorized: false,
      error: error.message || "Authentication failed",
    };
  }
}

/**
 * Middleware wrapper for admin API routes
 * Returns 401/403 if user is not authorized
 */
export async function requireAdmin(
  req: NextRequest
): Promise<
  | { authorized: false; response: NextResponse }
  | { authorized: true; user: { id: string; email: string } }
> {
  const authResult = await verifyAdmin(req);

  if (!authResult.authorized) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: authResult.error?.includes("not an admin") ? 403 : 401 }
      ),
    };
  }

  return {
    authorized: true as const,
    user: authResult.user!,
  };
}

