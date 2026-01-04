/**
 * Environment variable validation
 * Validates required environment variables at startup
 */

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NEXT_PUBLIC_SITE_URL?: string;
  ADMIN_EMAIL?: string;
  ADMIN_EMAILS?: string;
  SUPABASE_EDGE_FUNCTION_URL?: string;
  CRON_SECRET?: string;
}

const requiredVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

/**
 * Validate required environment variables
 * Throws error if any required vars are missing
 */
export function validateEnv(): EnvConfig {
  const missing: string[] = [];
  const config: Partial<EnvConfig> = {};

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === "") {
      missing.push(varName);
    } else {
      (config as any)[varName] = value;
    }
  }

  // Check optional variables
  const optionalVars: (keyof EnvConfig)[] = [
    "NEXT_PUBLIC_SITE_URL",
    "ADMIN_EMAIL",
    "ADMIN_EMAILS",
    "SUPABASE_EDGE_FUNCTION_URL",
    "CRON_SECRET",
  ];

  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      (config as any)[varName] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Please check your .env.local file or environment configuration."
    );
  }

  // Validate URL format for Supabase URL
  try {
    new URL(config.NEXT_PUBLIC_SUPABASE_URL!);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL");
  }

  return config as EnvConfig;
}

/**
 * Get environment variable with validation
 * Use this in API routes to ensure env vars are set
 */
export function getEnvVar(name: keyof EnvConfig, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && defaultValue) {
    return defaultValue;
  }
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

