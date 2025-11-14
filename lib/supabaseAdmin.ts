// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

// This file is SERVER-ONLY. Do not import it in client components.
// It uses the Service Role key which must never be exposed to the browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-side secret

export const supabaseAdmin = () =>
  createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
