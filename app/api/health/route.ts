import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateEnv } from "@/lib/validation/env";

export const dynamic = "force-dynamic";

interface HealthCheckResponse {
  status: "ok" | "fail" | "error";
  message: string;
  timestamp: string;
  checks: {
    database: "ok" | "fail";
    environment: "ok" | "fail";
    storage?: "ok" | "fail";
    email?: "ok" | "fail";
  };
  metrics: {
    responseTime: number;
    databaseLatency?: number;
    uptime?: number;
  };
  version?: string;
  environment: string;
}

export async function GET() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const checks: HealthCheckResponse["checks"] = {
    database: "fail",
    environment: "fail",
  };
  
  const metrics: HealthCheckResponse["metrics"] = {
    responseTime: 0,
  };

  try {
    // Validate environment variables
    try {
      validateEnv();
      checks.environment = "ok";
    } catch (error: any) {
      console.error("Environment validation failed:", error.message);
      checks.environment = "fail";
    }

    // Check database connectivity with latency measurement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const dbStartTime = Date.now();
      const { error, data } = await supabase.from("products").select("id").limit(1);
      const dbLatency = Date.now() - dbStartTime;
      metrics.databaseLatency = dbLatency;

      if (!error) {
        checks.database = "ok";
      }
    }

    // Check storage connectivity (optional)
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { error } = await supabase.storage.listBuckets();
        checks.storage = error ? "fail" : "ok";
      } catch {
        checks.storage = "fail";
      }
    }

    // Check email service configuration (optional)
    if (process.env.SUPABASE_EDGE_FUNCTION_URL || process.env.ADMIN_EMAIL) {
      checks.email = "ok";
    } else {
      checks.email = "fail";
    }

    const allChecksPassed = checks.database === "ok" && checks.environment === "ok";
    const responseTime = Date.now() - startTime;
    metrics.responseTime = responseTime;

    // Calculate uptime (if process start time is available)
    if (process.uptime) {
      metrics.uptime = Math.floor(process.uptime());
    }

    const response: HealthCheckResponse = {
      status: allChecksPassed ? "ok" : "fail",
      message: allChecksPassed
        ? "All systems operational ✅"
        : "Some checks failed",
      timestamp,
      checks,
      metrics,
      environment: process.env.NODE_ENV || "development",
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: allChecksPassed ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "X-Response-Time": `${responseTime}ms`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Health check error:", err);
    const responseTime = Date.now() - startTime;
    metrics.responseTime = responseTime;
    
    const response: HealthCheckResponse = {
      status: "error",
      message: err.message || "Internal server error",
      timestamp,
      checks,
      metrics,
      environment: process.env.NODE_ENV || "development",
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }
}
