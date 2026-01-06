import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { logBackgroundJob } from "@/lib/logger";
import { ADMIN_EMAILS } from "@/lib/adminEmails";
import { escapeHtml } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Combined maintenance endpoint
 * Handles multiple maintenance tasks in a single cron job
 * Tasks:
 * 1. Auto-cancel old pending orders
 * 2. Low stock alerts
 * 3. Log cleanup
 * 4. Backup verification
 */
export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    logBackgroundJob("maintenance", "started", {
      ipAddress,
      timestamp: new Date().toISOString(),
    });

    // Verify this is an internal call
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || "your-secret-token";
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      logBackgroundJob("maintenance", "failed", {
        error: "Unauthorized",
        ipAddress,
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const results: Record<string, any> = {};
    const now = new Date();

    // Task 1: Auto-cancel old pending orders
    try {
      const autoCancelDays = parseInt(process.env.AUTO_CANCEL_DAYS || "30", 10);
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - autoCancelDays);

      const { data: ordersToCancel, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending")
        .lt("created_at", cutoffDate.toISOString());

      if (!fetchError && ordersToCancel && ordersToCancel.length > 0) {
        const orderIds = ordersToCancel.map((o) => o.id);
        const { error: updateError } = await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .in("id", orderIds);

        if (!updateError) {
          results.autoCancel = {
            success: true,
            cancelled: ordersToCancel.length,
          };
        } else {
          results.autoCancel = {
            success: false,
            error: updateError.message,
          };
        }
      } else {
        results.autoCancel = {
          success: true,
          cancelled: 0,
        };
      }
    } catch (error: any) {
      results.autoCancel = {
        success: false,
        error: error.message,
      };
    }

    // Task 2: Low stock alerts
    try {
      const lowStockThreshold = parseInt(process.env.LOW_STOCK_THRESHOLD || "5", 10);
      const { data: lowStockProducts, error: fetchError } = await supabase
        .from("products")
        .select("id, name, price, stock_quantity, image_main")
        .eq("active", true)
        .not("stock_quantity", "is", null)
        .lte("stock_quantity", lowStockThreshold)
        .order("stock_quantity", { ascending: true });

      if (!fetchError && lowStockProducts && lowStockProducts.length > 0) {
        // Send email alert (simplified - you can expand this)
        const adminEmail = ADMIN_EMAILS[0] || process.env.ADMIN_EMAIL || "info@printly.ae";
        const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;
        
        if (edgeFunctionUrl) {
          const productRows = lowStockProducts.map((product) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${escapeHtml(product.name)}</td>
              <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">
                <span style="color: ${product.stock_quantity === 0 ? '#dc2626' : '#f59e0b'}; font-weight: bold;">
                  ${product.stock_quantity}
                </span>
              </td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${product.price.toFixed(2)} AED</td>
            </tr>
          `).join("");

          const emailBody = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><title>Low Stock Alert</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>⚠️ Low Stock Alert</h2>
              <p>The following ${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's' : ''} are running low on stock:</p>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #fef3c7;">
                    <th style="padding: 10px; text-align: left;">Product</th>
                    <th style="padding: 10px; text-align: center;">Stock</th>
                    <th style="padding: 10px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>${productRows}</tbody>
              </table>
            </body>
            </html>
          `;

          await fetch(`${edgeFunctionUrl}/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              to: adminEmail,
              subject: `Low Stock Alert: ${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's' : ''}`,
              html: emailBody,
            }),
          });
        }

        results.lowStock = {
          success: true,
          productsFound: lowStockProducts.length,
        };
      } else {
        results.lowStock = {
          success: true,
          productsFound: 0,
        };
      }
    } catch (error: any) {
      results.lowStock = {
        success: false,
        error: error.message,
      };
    }

    // Task 3: Log cleanup
    try {
      const deleteCutoffDate = new Date(now);
      deleteCutoffDate.setFullYear(deleteCutoffDate.getFullYear() - 1);

      const { count: deleteCount, error: deleteCountError } = await supabase
        .from("logs")
        .select("*", { count: "exact", head: true })
        .lt("created_at", deleteCutoffDate.toISOString());

      if (!deleteCountError) {
        const { error: deleteError } = await supabase
          .from("logs")
          .delete()
          .lt("created_at", deleteCutoffDate.toISOString());

        if (!deleteError) {
          results.logCleanup = {
            success: true,
            deleted: deleteCount || 0,
          };
        } else {
          results.logCleanup = {
            success: false,
            error: deleteError.message,
          };
        }
      } else {
        results.logCleanup = {
          success: false,
          error: deleteCountError.message,
        };
      }
    } catch (error: any) {
      results.logCleanup = {
        success: false,
        error: error.message,
      };
    }

    // Task 4: Backup verification (database connectivity check)
    try {
      const checks = {
        products: false,
        orders: false,
        logs: false,
        categories: false,
      };

      const { error: productsError } = await supabase.from("products").select("id").limit(1);
      if (!productsError) checks.products = true;

      const { error: ordersError } = await supabase.from("orders").select("id").limit(1);
      if (!ordersError) checks.orders = true;

      const { error: logsError } = await supabase.from("logs").select("id").limit(1);
      if (!logsError) checks.logs = true;

      const { error: categoriesError } = await supabase.from("categories").select("id").limit(1);
      if (!categoriesError) checks.categories = true;

      const allChecksPassed = Object.values(checks).every(check => check === true);

      results.backupVerification = {
        success: allChecksPassed,
        checks,
      };
    } catch (error: any) {
      results.backupVerification = {
        success: false,
        error: error.message,
      };
    }

    logBackgroundJob("maintenance", "completed", {
      results,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: "Maintenance tasks completed",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logBackgroundJob("maintenance", "failed", {
      error: error.message,
      stack: error.stack,
      ipAddress,
    });
    console.error("Maintenance error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: "Use POST with authorization header to run maintenance tasks",
    note: "Set CRON_SECRET environment variable for security",
    tasks: [
      "Auto-cancel old pending orders",
      "Low stock alerts",
      "Log cleanup",
      "Backup verification",
    ],
  });
}

