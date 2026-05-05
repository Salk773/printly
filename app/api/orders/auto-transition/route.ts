import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { logBackgroundJob, logOrderEvent } from "@/lib/logger";
import { escapeHtml } from "@/lib/security/sanitize";
import { userWantsOrderUpdateEmails } from "@/lib/emailPreferenceGate";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Format completion email
 */
function formatCompletionEmail(orderData: any): string {
  const orderRef = escapeHtml(
    orderData.order_number || orderData.id.slice(0, 8).toUpperCase()
  );
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Completed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
        <h1 style="margin: 0;">✅ Order Completed</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; font-weight: bold; color: #333;">
          Order Reference: <span style="color: #059669;">${orderRef}</span>
        </p>
        
        <p style="font-size: 16px; color: #333; margin-top: 20px;">
          Great news! Your order has been completed and is ready for delivery.
        </p>
        
        <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-top: 30px;">Order Details</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #d1fae5;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #10b981;">Item</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #10b981;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #10b981;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${(orderData.items || []).map((item: any) => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${escapeHtml(item.name)}</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${(item.price * item.quantity).toFixed(2)} AED</td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #10b981;">Total:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #10b981; color: #059669; font-size: 18px;">${orderData.total.toFixed(2)} AED</td>
            </tr>
          </tfoot>
        </table>
        
        <p style="margin-top: 30px; padding: 15px; background: #d1fae5; border-left: 4px solid #10b981; border-radius: 4px;">
          <strong>What's Next?</strong><br>
          Your order is now ready for delivery. We'll contact you shortly to arrange delivery to your address.
        </p>
        
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          If you have any questions, please contact us at info@printly.ae
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>Printly.ae - 3D Printing Marketplace</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send completion email to customer
 */
async function sendCompletionEmail(orderData: any): Promise<{
  success: boolean;
  error?: string;
  skipped?: boolean;
}> {
  const wants = await userWantsOrderUpdateEmails(orderData.user_id);
  if (!wants) {
    return { success: true, skipped: true };
  }

  const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;
  const customerEmail = orderData.guest_email
    ? String(orderData.guest_email).trim()
    : "";

  if (!customerEmail) {
    return { success: false, error: "No customer email found" };
  }

  if (edgeFunctionUrl) {
    try {
      const emailBody = formatCompletionEmail(orderData);
      const response = await fetch(`${edgeFunctionUrl}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: customerEmail,
          subject: `Order Completed: ${orderData.order_number || orderData.id.slice(0, 8).toUpperCase()}`,
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
  console.log("📧 Completion email would be sent to:", customerEmail);
  return { success: true };
}

/**
 * Automatic order status transitions:
 * - pending -> paid (via payment webhook or manual admin action)
 * - processing -> completed (after X days, configurable)
 * 
 * This endpoint can be called via cron job or webhook
 */
export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    logBackgroundJob("order-auto-transition", "started", {
      ipAddress,
      timestamp: new Date().toISOString(),
    });

    // Verify this is an internal call (add auth header check in production)
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || "your-secret-token";
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      logBackgroundJob("order-auto-transition", "failed", {
        error: "Unauthorized",
        ipAddress,
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const processingToCompletedDays = 7; // Auto-complete after 7 days in processing

    // Find orders in "processing" status older than X days
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - processingToCompletedDays);

    const { data: ordersToComplete, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "processing")
      .lt("created_at", cutoffDate.toISOString());

    if (fetchError) {
      logBackgroundJob("order-auto-transition", "failed", {
        error: fetchError.message,
        ipAddress,
      });
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    if (!ordersToComplete || ordersToComplete.length === 0) {
      logBackgroundJob("order-auto-transition", "completed", {
        updated: 0,
        ipAddress,
      });
      return NextResponse.json({
        success: true,
        message: "No orders to auto-transition",
        updated: 0,
      });
    }

    // Update orders to completed and send completion emails
    const orderIds = ordersToComplete.map((o) => o.id);
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .in("id", orderIds);

    if (updateError) {
      logBackgroundJob("order-auto-transition", "failed", {
        error: updateError.message,
        orderCount: ordersToComplete.length,
        ipAddress,
      });
      return NextResponse.json(
        { error: "Failed to update orders" },
        { status: 500 }
      );
    }

    // Send completion emails
    const emailResults: Array<{ orderId: string; success: boolean; error?: string }> = [];
    for (const order of ordersToComplete) {
      const emailResult = await sendCompletionEmail(order);
      emailResults.push({
        orderId: order.id,
        success: emailResult.success,
        error: emailResult.error,
      });

      // Log completion event
      if (emailResult.success) {
        logOrderEvent("auto-completed", order.id, {
          orderNumber: order.order_number,
          emailSent: !emailResult.skipped,
          emailSkipped: Boolean(emailResult.skipped),
        });
      }
    }

    const successfulEmails = emailResults.filter(r => r.success).length;
    const failedEmails = emailResults.filter(r => !r.success);

    logBackgroundJob("order-auto-transition", "completed", {
      updated: ordersToComplete.length,
      emailsSent: successfulEmails,
      emailsFailed: failedEmails.length,
      orderIds: orderIds.slice(0, 10), // Log first 10 IDs
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Auto-transitioned ${ordersToComplete.length} orders to completed`,
      updated: ordersToComplete.length,
      emailsSent: successfulEmails,
      emailsFailed: failedEmails.length,
      emailErrors: failedEmails.length > 0 ? failedEmails : undefined,
    });
  } catch (error: any) {
    logBackgroundJob("order-auto-transition", "failed", {
      error: error.message,
      stack: error.stack,
      ipAddress,
    });
    console.error("Auto-transition error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: "Use POST with authorization header to trigger auto-transitions",
    note: "Set CRON_SECRET environment variable for security",
  });
}

