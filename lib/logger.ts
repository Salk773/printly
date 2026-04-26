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

interface InMemoryLogEntry {
  id: string;
  level: LogLevel;
  message: string;
  category: LogCategory;
  metadata?: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  created_at: string;
}

const MAX_IN_MEMORY_LOGS = 500;
const globalWithLogs = globalThis as typeof globalThis & { __inMemoryLogs?: InMemoryLogEntry[] };

function pushInMemoryLog(entry: InMemoryLogEntry) {
  if (!globalWithLogs.__inMemoryLogs) {
    globalWithLogs.__inMemoryLogs = [];
  }
  globalWithLogs.__inMemoryLogs.unshift(entry);
  if (globalWithLogs.__inMemoryLogs.length > MAX_IN_MEMORY_LOGS) {
    globalWithLogs.__inMemoryLogs.length = MAX_IN_MEMORY_LOGS;
  }
}

export function getInMemoryLogs() {
  return [...(globalWithLogs.__inMemoryLogs || [])];
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
    // #region agent log
    fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"f31495"},body:JSON.stringify({sessionId:"f31495",runId:"debug-logs-2",hypothesisId:"L6",location:"lib/logger.ts:write-start",message:"Logger writeToDatabase start",data:{level,category,hasUserId:Boolean(userId),hasIp:Boolean(ipAddress)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const supabase = supabaseServer();
    
    const logEntry: DatabaseLogEntry = {
      level,
      message,
      category,
      metadata: metadata || {},
      user_id: userId,
      ip_address: ipAddress,
    };

    pushInMemoryLog({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      level,
      message,
      category,
      metadata: metadata || {},
      user_id: userId,
      ip_address: ipAddress,
      created_at: new Date().toISOString(),
    });

    // Await insert so logs are not dropped on short-lived requests.
    await supabase.from("logs").insert([logEntry]);
    console.log("[LOGS_DEBUG][WRITE_OK]", {
      level,
      category,
      message,
    });
    // #region agent log
    fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"f31495"},body:JSON.stringify({sessionId:"f31495",runId:"debug-logs-2",hypothesisId:"L7",location:"lib/logger.ts:write-success",message:"Logger insert success",data:{level,category},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  } catch (error) {
    console.error("[LOGS_DEBUG][WRITE_ERROR]", {
      level,
      category,
      message,
      errorMessage: error instanceof Error ? error.message : "unknown",
      errorCode: typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : undefined,
    });
    // #region agent log
    fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"f31495"},body:JSON.stringify({sessionId:"f31495",runId:"debug-logs-2",hypothesisId:"L8",location:"lib/logger.ts:write-error",message:"Logger insert failed",data:{errorMessage:error instanceof Error ? error.message : "unknown"},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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

