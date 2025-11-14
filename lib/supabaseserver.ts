// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

// This client is SAFE for server-side read operations
// It uses the public anon key and respects RLS.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function supabaseServer() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
