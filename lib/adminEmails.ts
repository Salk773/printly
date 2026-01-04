/**
 * Get admin emails from environment variable or fallback to hardcoded list
 * Environment variable format: ADMIN_EMAILS=email1@example.com,email2@example.com
 */
export function getAdminEmails(): string[] {
  // Check environment variable first
  const envEmails = process.env.ADMIN_EMAILS;
  if (envEmails) {
    return envEmails
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);
  }

  // Fallback to hardcoded list
  return [
    "info@printly.ae",
    // add more if needed
  ];
}

// Export for backward compatibility
export const ADMIN_EMAILS = getAdminEmails();
