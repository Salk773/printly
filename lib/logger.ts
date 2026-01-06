/**
 * Logging utility for application errors and events
 * Now includes database persistence via Supabase
 */

import "server-only";
import { supabaseServer } from "./supabaseServer";

type LogLevel = "info" | "warn" | "error";
type LogCategory = "api" | "admin" | "background" | "error" | "system";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  error?: Error;
  metadata?: Record<string, any>;
}

interface DatabaseLogEntry {
  level: LogLevel;
  message: string;
  category: LogCategory;
  metadata?: Record<string, any>;
  user_id?: string;
  ip_address?: string;
}

/**
 * Write log entry to database (non-blocking, fails silently)
 */
async function writeToDatabase(
  level: LogLevel,
  message: string,
  category: LogCategory,
  metadata?: Record<string, any>,
  userId?: string,
  ipAddress?: string
) {
  try {
    const supabase = supabaseServer();
    
    const logEntry: DatabaseLogEntry = {
      level,
      message,
      category,
      metadata: metadata || {},
      user_id: userId,
      ip_address: ipAddress,
    };

    // Don't await - fire and forget to avoid blocking
    (async () => {
      try {
        await supabase.from("logs").insert([logEntry]);
        // Success - no action needed
      } catch (err) {
        // Silently fail - don't break the application if logging fails
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to write log to database:", err);
        }
      }
    })();
  } catch (error) {
    // Silently fail - don't break the application if logging fails
    if (process.env.NODE_ENV === "development") {
      console.error("Logger error:", error);
    }
  }
}

/**
 * Log an entry to console and database
 */
function log(
  level: LogLevel,
  message: string,
  category: LogCategory = "system",
  error?: Error,
  metadata?: Record<string, any>,
  userId?: string,
  ipAddress?: string
) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    error,
    metadata,
  };

  // Prepare metadata with error details if present
  const logMetadata = {
    ...metadata,
    ...(error && {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
    }),
  };

  // Always log to console in development
  if (process.env.NODE_ENV === "development") {
    const logMethod = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    logMethod(`[${level.toUpperCase()}] [${category.toUpperCase()}] ${message}`, error || logMetadata || "");
  }

  // Write to database (non-blocking)
  writeToDatabase(level, message, category, logMetadata, userId, ipAddress);
}

/**
 * Log an info message
 */
export function logInfo(message: string, metadata?: Record<string, any>, userId?: string, ipAddress?: string) {
  log("info", message, "system", undefined, metadata, userId, ipAddress);
}

/**
 * Log a warning message
 */
export function logWarn(message: string, metadata?: Record<string, any>, userId?: string, ipAddress?: string) {
  log("warn", message, "system", undefined, metadata, userId, ipAddress);
}

/**
 * Log an error message
 */
export function logError(message: string, error?: Error, metadata?: Record<string, any>, userId?: string, ipAddress?: string) {
  log("error", message, "error", error, metadata, userId, ipAddress);
}

/**
 * Log API errors with context
 */
export function logApiError(endpoint: string, error: Error, requestData?: Record<string, any>, userId?: string, ipAddress?: string) {
  log("error", `API Error: ${endpoint}`, "api", error, {
    endpoint,
    requestData,
  }, userId, ipAddress);
}

/**
 * Log order-related events
 */
export function logOrderEvent(event: string, orderId: string, metadata?: Record<string, any>, userId?: string, ipAddress?: string) {
  log("info", `Order Event: ${event}`, "system", undefined, {
    orderId,
    ...metadata,
  }, userId, ipAddress);
}

/**
 * Log API route calls
 */
export function logApiCall(
  method: string,
  endpoint: string,
  statusCode?: number,
  metadata?: Record<string, any>,
  userId?: string,
  ipAddress?: string
) {
  const message = `${method} ${endpoint}${statusCode ? ` - ${statusCode}` : ""}`;
  const level: LogLevel = statusCode && statusCode >= 400 ? "error" : statusCode && statusCode >= 300 ? "warn" : "info";
  log(level, message, "api", undefined, metadata, userId, ipAddress);
}

/**
 * Log admin panel actions
 */
export function logAdminAction(
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, any>,
  userId?: string,
  ipAddress?: string
) {
  const message = `Admin Action: ${action} ${resource}${resourceId ? ` (${resourceId})` : ""}`;
  log("info", message, "admin", undefined, metadata, userId, ipAddress);
}

/**
 * Log background jobs and cron tasks
 */
export function logBackgroundJob(
  jobName: string,
  status: "started" | "completed" | "failed",
  metadata?: Record<string, any>,
  error?: Error
) {
  const message = `Background Job: ${jobName} - ${status}`;
  const level: LogLevel = status === "failed" ? "error" : "info";
  log(level, message, "background", error, metadata);
}

/**
 * Log system-level events
 */
export function logSystemEvent(event: string, metadata?: Record<string, any>) {
  log("info", `System Event: ${event}`, "system", undefined, metadata);
}

