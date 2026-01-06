/**
 * Enhanced health monitoring endpoint
 * Provides detailed metrics for monitoring services
 * Requires authorization header for security
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateEnv } from "@/lib/validation/env";
import { logBackgroundJob } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface MonitoringResponse {
  status: "ok" | "fail" | "error";
  timestamp: string;
  checks: {
    database: {
      status: "ok" | "fail";
      latency: number;
      error?: string;
    };
    environment: {
      status: "ok" | "fail";
      missingVars?: string[];
    };
    storage: {
      status: "ok" | "fail";
      latency: number;
    };
    email: {
      status: "ok" | "fail";
      configured: boolean;
    };
  };
  metrics: {
    responseTime: number;
    databaseLatency: number;
    storageLatency: number;
    memoryUsage?: NodeJS.MemoryUsage;
    uptime?: number;
  };
  environment: string;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Optional: Require authorization for detailed monitoring endpoint
  const authHeader = req.headers.get("authorization");
  const expectedToken = process.env.MONITOR_SECRET || process.env.CRON_SECRET;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const checks: MonitoringResponse["checks"] = {
    database: { status: "fail", latency: 0 },
    environment: { status: "fail" },
    storage: { status: "fail", latency: 0 },
    email: { status: "fail", configured: false },
  };

  const metrics: MonitoringResponse["metrics"] = {
    responseTime: 0,
    databaseLatency: 0,
    storageLatency: 0,
  };

  try {
    // Environment check
    try {
      validateEnv();
      checks.environment.status = "ok";
    } catch (error: any) {
      checks.environment.status = "fail";
      checks.environment.missingVars = [error.message];
    }

    // Database connectivity check with latency
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Test database query
      const dbStartTime = Date.now();
      const { error: dbError } = await supabase.from("products").select("id").limit(1);
      const dbLatency = Date.now() - dbStartTime;
      metrics.databaseLatency = dbLatency;
      checks.database.latency = dbLatency;

      if (!dbError) {
        checks.database.status = "ok";
      } else {
        checks.database.error = dbError.message;
      }

      // Test storage
      try {
        const storageStartTime = Date.now();
        const { error: storageError } = await supabase.storage.listBuckets();
        const storageLatency = Date.now() - storageStartTime;
        metrics.storageLatency = storageLatency;
        checks.storage.latency = storageLatency;
        
        if (!storageError) {
          checks.storage.status = "ok";
        }
      } catch (storageErr: any) {
        checks.storage.status = "fail";
      }
    }

    // Email service check
    checks.email.configured = !!(
      process.env.SUPABASE_EDGE_FUNCTION_URL || process.env.ADMIN_EMAIL
    );
    checks.email.status = checks.email.configured ? "ok" : "fail";

    // Memory usage (if available)
    if (typeof process.memoryUsage === "function") {
      metrics.memoryUsage = process.memoryUsage();
    }

    // Uptime
    if (process.uptime) {
      metrics.uptime = Math.floor(process.uptime());
    }

    const responseTime = Date.now() - startTime;
    metrics.responseTime = responseTime;

    const allCriticalChecksPassed = 
      checks.database.status === "ok" && 
      checks.environment.status === "ok";

    const response: MonitoringResponse = {
      status: allCriticalChecksPassed ? "ok" : "fail",
      timestamp,
      checks,
      metrics,
      environment: process.env.NODE_ENV || "development",
    };

    // Log monitoring check
    logBackgroundJob("health-monitor", allCriticalChecksPassed ? "completed" : "failed", {
      checks,
      metrics,
    });

    return NextResponse.json(response, {
      status: allCriticalChecksPassed ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "X-Response-Time": `${responseTime}ms`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    const responseTime = Date.now() - startTime;
    metrics.responseTime = responseTime;

    logBackgroundJob("health-monitor", "failed", {
      error: err.message,
      stack: err.stack,
    });

    const response: MonitoringResponse = {
      status: "error",
      timestamp,
      checks,
      metrics,
      environment: process.env.NODE_ENV || "development",
    };

    return NextResponse.json(response, {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }
}

