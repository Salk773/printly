// printly/lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY client
// Uses SERVICE ROLE KEY (never expose to browser)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = () =>
  createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
