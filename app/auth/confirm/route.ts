import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email",
    });

    if (!error) {
      // Redirect to verification success page
      return NextResponse.redirect(
        new URL(`/auth/verify-email?token=${token_hash}&type=${type}`, requestUrl.origin)
      );
    }
  }

  // Redirect to login with error
  return NextResponse.redirect(new URL("/auth/login?error=verification_failed", requestUrl.origin));
}

