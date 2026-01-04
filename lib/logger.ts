/**
 * Logging utility for application errors and events
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  error?: Error;
  metadata?: Record<string, any>;
}

/**
 * Log an entry to console (and potentially to external service in production)
 */
function log(level: LogLevel, message: string, error?: Error, metadata?: Record<string, any>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    error,
    metadata,
  };

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    const logMethod = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    logMethod(`[${level.toUpperCase()}] ${message}`, error || metadata || "");
  }

  // In production, you can send logs to an external service
  // Example: Sentry, LogRocket, or your own logging service
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to external logging service
    // Example:
    // if (level === "error") {
    //   Sentry.captureException(error || new Error(message), { extra: metadata });
    // }
  }
}

/**
 * Log an info message
 */
export function logInfo(message: string, metadata?: Record<string, any>) {
  log("info", message, undefined, metadata);
}

/**
 * Log a warning message
 */
export function logWarn(message: string, metadata?: Record<string, any>) {
  log("warn", message, undefined, metadata);
}

/**
 * Log an error message
 */
export function logError(message: string, error?: Error, metadata?: Record<string, any>) {
  log("error", message, error, metadata);
}

/**
 * Log API errors with context
 */
export function logApiError(endpoint: string, error: Error, requestData?: Record<string, any>) {
  logError(`API Error: ${endpoint}`, error, {
    endpoint,
    requestData,
  });
}

/**
 * Log order-related events
 */
export function logOrderEvent(event: string, orderId: string, metadata?: Record<string, any>) {
  logInfo(`Order Event: ${event}`, {
    orderId,
    ...metadata,
  });
}

