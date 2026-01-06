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
 * Format low stock alert email
 */
function formatLowStockEmail(products: any[]): string {
  const productRows = products.map((product) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${escapeHtml(product.name)}</td>
      <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">
        <span style="color: ${product.stock_quantity === 0 ? '#dc2626' : '#f59e0b'}; font-weight: bold;">
          ${product.stock_quantity}
        </span>
      </td>
      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${product.price.toFixed(2)} AED</td>
      <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://printly.ae'}/products/${product.id}" 
           style="color: #a855f7; text-decoration: none;">View Product</a>
      </td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Low Stock Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
        <h1 style="margin: 0;">⚠️ Low Stock Alert</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          The following products are running low on stock and may need to be restocked soon.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white;">
          <thead>
            <tr style="background: #fef3c7;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #f59e0b;">Product Name</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #f59e0b;">Stock</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #f59e0b;">Price</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #f59e0b;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
        
        <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <strong>Action Required:</strong><br>
          Please review these products and consider restocking them to avoid running out of inventory.
        </p>
        
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          You can manage products in the <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://printly.ae'}/admin" style="color: #a855f7;">Admin Panel</a>.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>Printly.ae - 3D Printing Marketplace</p>
        <p style="margin-top: 5px; color: #999;">This is an automated alert. Threshold: ${process.env.LOW_STOCK_THRESHOLD || 5} units</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send low stock alert email to admin
 */
async function sendLowStockEmail(products: any[]): Promise<{ success: boolean; error?: string }> {
  const adminEmail = ADMIN_EMAILS[0] || process.env.ADMIN_EMAIL || "info@printly.ae";
  const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;

  if (edgeFunctionUrl) {
    try {
      const emailBody = formatLowStockEmail(products);
      const response = await fetch(`${edgeFunctionUrl}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: adminEmail,
          subject: `Low Stock Alert: ${products.length} product${products.length > 1 ? 's' : ''} running low`,
          html: emailBody,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Email send error:", error);
      return { success: false, error: error.message };
    }
  }

  // Fallback: Log email (for development)
  console.log("📧 Low stock alert email would be sent to:", adminEmail);
  console.log("Products with low stock:", products.map(p => `${p.name} (${p.stock_quantity})`).join(", "));
  return { success: true };
}

/**
 * Check for low stock products and send alerts
 */
export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    logBackgroundJob("low-stock-alert", "started", {
      ipAddress,
      timestamp: new Date().toISOString(),
    });

    // Verify this is an internal call
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || "your-secret-token";
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      logBackgroundJob("low-stock-alert", "failed", {
        error: "Unauthorized",
        ipAddress,
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const lowStockThreshold = parseInt(process.env.LOW_STOCK_THRESHOLD || "5", 10);

    // Find products with low stock
    // Only check active products that have stock_quantity set (not null)
    const { data: lowStockProducts, error: fetchError } = await supabase
      .from("products")
      .select("id, name, price, stock_quantity, image_main")
      .eq("active", true)
      .not("stock_quantity", "is", null)
      .lte("stock_quantity", lowStockThreshold)
      .order("stock_quantity", { ascending: true });

    if (fetchError) {
      logBackgroundJob("low-stock-alert", "failed", {
        error: fetchError.message,
        ipAddress,
      });
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    if (!lowStockProducts || lowStockProducts.length === 0) {
      logBackgroundJob("low-stock-alert", "completed", {
        productsFound: 0,
        threshold: lowStockThreshold,
        ipAddress,
      });
      return NextResponse.json({
        success: true,
        message: "No products with low stock",
        productsFound: 0,
        threshold: lowStockThreshold,
      });
    }

    // Send email alert
    const emailResult = await sendLowStockEmail(lowStockProducts);

    if (!emailResult.success) {
      logBackgroundJob("low-stock-alert", "failed", {
        error: emailResult.error || "Failed to send email",
        productsFound: lowStockProducts.length,
        ipAddress,
      });
      return NextResponse.json(
        { 
          error: emailResult.error || "Failed to send email",
          productsFound: lowStockProducts.length,
        },
        { status: 500 }
      );
    }

    logBackgroundJob("low-stock-alert", "completed", {
      productsFound: lowStockProducts.length,
      threshold: lowStockThreshold,
      productIds: lowStockProducts.slice(0, 10).map(p => p.id), // Log first 10 IDs
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Low stock alert sent for ${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's' : ''}`,
      productsFound: lowStockProducts.length,
      threshold: lowStockThreshold,
      products: lowStockProducts.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock_quantity,
      })),
    });
  } catch (error: any) {
    logBackgroundJob("low-stock-alert", "failed", {
      error: error.message,
      stack: error.stack,
      ipAddress,
    });
    console.error("Low stock alert error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: "Use POST with authorization header to check for low stock products",
    note: "Set CRON_SECRET environment variable for security",
    config: {
      lowStockThreshold: process.env.LOW_STOCK_THRESHOLD || "5",
    },
  });
}

