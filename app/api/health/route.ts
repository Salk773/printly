import "server-only";
import { createClient } from "@supabase/supabase-js";

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
    // Check environment variables
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasSupabaseUrl && hasAnonKey && hasServiceKey) {
      checks.environment = "ok";
    }

    // Check database connectivity
    if (hasSupabaseUrl && hasAnonKey) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

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
