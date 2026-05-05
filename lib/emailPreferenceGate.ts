import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Returns whether the user opted in to order-related customer emails.
 * Guests and users without a row default to true.
 */
export async function userWantsOrderUpdateEmails(
  userId: string | null | undefined
): Promise<boolean> {
  if (!userId) return true;
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("email_preferences")
    .select("order_updates")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return true;
  return data.order_updates !== false;
}
