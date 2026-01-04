import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateEnv } from "@/lib/validation/env";

interface HealthCheckResponse {
  status: "ok" | "fail" | "error";
  message: string;
  timestamp: string;
  checks: {
    database: "ok" | "fail";
    environment: "ok" | "fail";
  };
  version?: string;
}

export async function GET() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const checks: HealthCheckResponse["checks"] = {
    database: "fail",
    environment: "fail",
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

    // Check database connectivity
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { error } = await supabase.from("products").select("id").limit(1);

      if (!error) {
        checks.database = "ok";
      }
    }

    const allChecksPassed = checks.database === "ok" && checks.environment === "ok";
    const responseTime = Date.now() - startTime;

    const response: HealthCheckResponse = {
      status: allChecksPassed ? "ok" : "fail",
      message: allChecksPassed
        ? "All systems operational ✅"
        : "Some checks failed",
      timestamp,
      checks,
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: allChecksPassed ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "X-Response-Time": `${responseTime}ms`,
      },
    });
  } catch (err: any) {
    console.error("Health check error:", err);
    const response: HealthCheckResponse = {
      status: "error",
      message: err.message || "Internal server error",
      timestamp,
      checks,
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
