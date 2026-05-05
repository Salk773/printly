import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function recordEmailNotificationEvent(params: {
  notification_type: string;
  order_id?: string | null;
  to_email?: string | null;
  status: "sent" | "failed";
  error_message?: string | null;
}): Promise<void> {
  try {
    const admin = supabaseAdmin();
    const { error } = await admin.from("email_notification_events").insert({
      notification_type: params.notification_type,
      order_id: params.order_id ?? null,
      to_email: params.to_email ?? null,
      status: params.status,
      error_message: params.error_message ?? null,
    });
    if (error) {
      console.warn("email_notification_events insert:", error.message);
    }
  } catch (e) {
    console.warn("recordEmailNotificationEvent:", e);
  }
}
