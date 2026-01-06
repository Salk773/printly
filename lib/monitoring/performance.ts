/**
 * Performance monitoring utilities
 * Track API response times and slow queries
 */

import "server-only";

interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  timestamp: string;
  statusCode?: number;
  error?: string;
}

const SLOW_QUERY_THRESHOLD = 1000; // 1 second
const SLOW_API_THRESHOLD = 500; // 500ms

/**
 * Track API performance
 */
export function trackApiPerformance(
  endpoint: string,
  method: string,
  responseTime: number,
  statusCode?: number,
  error?: string
) {
  const metric: PerformanceMetric = {
    endpoint,
    method,
    responseTime,
    timestamp: new Date().toISOString(),
    statusCode,
    error,
  };

  // Log slow API calls
  if (responseTime > SLOW_API_THRESHOLD) {
    console.warn(`Slow API call detected: ${method} ${endpoint} took ${responseTime}ms`, metric);
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
      // Sentry will capture this automatically via instrumentation
      // But we can add custom context
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureMessage(`Slow API: ${method} ${endpoint}`, {
          level: "warning",
          extra: metric,
        });
      }).catch(() => {
        // Fail silently if Sentry is not available
      });
    }
  }

  return metric;
}

/**
 * Track database query performance
 */
export function trackQueryPerformance(
  query: string,
  responseTime: number,
  table?: string,
  error?: string
) {
  if (responseTime > SLOW_QUERY_THRESHOLD) {
    console.warn(`Slow query detected: ${query.substring(0, 100)} took ${responseTime}ms`, {
      query: query.substring(0, 200),
      table,
      responseTime,
      timestamp: new Date().toISOString(),
    });

    // In production, send to monitoring service
    if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureMessage(`Slow Query: ${table || "unknown"}`, {
          level: "warning",
          extra: {
            query: query.substring(0, 200),
            table,
            responseTime,
          },
        });
      }).catch(() => {
        // Fail silently
      });
    }
  }
}

/**
 * Create performance middleware for API routes
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  endpoint: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    let statusCode: number | undefined;
    let error: string | undefined;

    try {
      const result = await handler(...args);
      
      // Try to extract status code from NextResponse
      if (result && typeof result === "object" && "status" in result) {
        statusCode = result.status as number;
      }

      const responseTime = Date.now() - startTime;
      trackApiPerformance(
        endpoint,
        "GET", // Default, should be passed as parameter
        responseTime,
        statusCode
      );

      return result;
    } catch (err: any) {
      error = err.message;
      const responseTime = Date.now() - startTime;
      trackApiPerformance(endpoint, "GET", responseTime, statusCode, error);
      throw err;
    }
  }) as T;
}

