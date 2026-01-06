/**
 * Next.js instrumentation file
 * Runs once when the server starts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize server-side Sentry
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Initialize edge runtime Sentry
    await import("./sentry.edge.config");
  }
}

