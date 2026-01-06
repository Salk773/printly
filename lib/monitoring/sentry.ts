/**
 * Sentry error tracking configuration
 * Automatically captures errors from API routes and client components
 */

import "server-only";

let sentryInitialized = false;

/**
 * Initialize Sentry if DSN is configured
 */
export function initSentry() {
  if (sentryInitialized) return;
  
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // Sentry is optional - fail silently if not configured
    return;
  }

  try {
    // Dynamic import to avoid bundling Sentry in development if not needed
    if (process.env.NODE_ENV === "production") {
      // Sentry will be initialized via next.config.mjs
      // This file provides helper functions for manual error reporting
      sentryInitialized = true;
    }
  } catch (error) {
    console.error("Failed to initialize Sentry:", error);
  }
}

/**
 * Capture an exception manually
 */
export async function captureException(error: Error, context?: Record<string, any>) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    // In production, Sentry SDK handles this automatically
    // This is for manual captures or additional context
    if (typeof window !== "undefined") {
      // Client-side
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(error, { extra: context });
    } else {
      // Server-side
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(error, { extra: context });
    }
  } catch (err) {
    // Fail silently if Sentry is not available
    console.error("Sentry capture failed:", err);
  }
}

/**
 * Capture a message manually
 */
export async function captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: Record<string, any>) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    if (typeof window !== "undefined") {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureMessage(message, { level, extra: context });
    } else {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureMessage(message, { level, extra: context });
    }
  } catch (err) {
    console.error("Sentry capture failed:", err);
  }
}

/**
 * Set user context for error tracking
 */
export async function setUserContext(userId: string, email?: string, username?: string) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    if (typeof window !== "undefined") {
      const Sentry = await import("@sentry/nextjs");
      Sentry.setUser({ id: userId, email, username });
    } else {
      const Sentry = await import("@sentry/nextjs");
      Sentry.setUser({ id: userId, email, username });
    }
  } catch (err) {
    console.error("Sentry setUser failed:", err);
  }
}

/**
 * Clear user context
 */
export async function clearUserContext() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    if (typeof window !== "undefined") {
      const Sentry = await import("@sentry/nextjs");
      Sentry.setUser(null);
    } else {
      const Sentry = await import("@sentry/nextjs");
      Sentry.setUser(null);
    }
  } catch (err) {
    console.error("Sentry clearUser failed:", err);
  }
}

// Initialize on module load
initSentry();

