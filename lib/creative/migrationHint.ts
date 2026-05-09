import { getErrorMessage } from "@/lib/errorMessage";

export function creativeWorkflowMigrationHint(error: unknown) {
  const message = getErrorMessage(error, "");
  const normalized = message.toLowerCase();

  if (
    normalized.includes("creative_assets") ||
    normalized.includes("creative_renditions") ||
    normalized.includes("creative_descriptions") ||
    normalized.includes("social_posts") ||
    normalized.includes("trend_snapshots")
  ) {
    return (
      "The social workflow database tables are missing. Run " +
      "migrations/015_create_creative_workflow.sql in Supabase, then refresh the page."
    );
  }

  return null;
}
