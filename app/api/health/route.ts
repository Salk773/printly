import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabaseServer";
import { logInfo, logError } from "@/lib/logger";

interface HealthCheckResponse {
  status: "ok" | "fail" | "error";
  timestamp: string;
  checks: {
    database: {
      status: "ok" | "fail";
      message?: string;
    };
    email: {
      status: "ok" | "fail" | "warning";
      message?: string;
    };
  };
  version?: string;
}

export async function GET() {
  const startTime = Date.now();
  const response: HealthCheckResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: "fail" },
      email: { status: "warning" },
    },
    version: process.env.npm_package_version || "1.0.0",
  };

  try {
    // Check database connectivity
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.from("products").select("id").limit(1);

      if (error) {
        logError("Database health check failed", error as Error);
        response.checks.database = {
          status: "fail",
          message: error.message,
        };
        response.status = "fail";
      } else {
        response.checks.database = {
          status: "ok",
          message: "Database connected successfully",
        };
        logInfo("Database health check passed");
      }
    } catch (dbError: any) {
      logError("Database connection error", dbError);
      response.checks.database = {
        status: "fail",
        message: dbError.message || "Database connection failed",
      };
      response.status = "fail";
    }

    // Check email configuration
    const adminEmail = process.env.ADMIN_EMAIL;
    const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;

    if (!adminEmail) {
      response.checks.email = {
        status: "warning",
        message: "ADMIN_EMAIL not configured",
      };
    } else if (!edgeFunctionUrl) {
      response.checks.email = {
        status: "warning",
        message: "Email Edge Function not configured (emails will be logged only)",
      };
    } else {
      response.checks.email = {
        status: "ok",
        message: "Email service configured",
      };
    }

    // Check service role key (for admin operations)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logError("SUPABASE_SERVICE_ROLE_KEY not configured", new Error("Missing service role key"));
    }

    const responseTime = Date.now() - startTime;
    logInfo("Health check completed", { responseTime, status: response.status });

    const statusCode = response.status === "ok" ? 200 : response.status === "fail" ? 503 : 200;

    return new Response(JSON.stringify(response, null, 2), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "X-Response-Time": `${responseTime}ms`,
      },
    });
  } catch (err: any) {
    logError("Health check unexpected error", err);
    response.status = "error";
    response.checks.database = {
      status: "fail",
      message: err.message || "Unexpected error",
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
