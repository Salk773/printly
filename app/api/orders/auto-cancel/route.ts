import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { logBackgroundJob, logOrderEvent } from "@/lib/logger";
import { ADMIN_EMAILS } from "@/lib/adminEmails";
import { escapeHtml } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Format cancellation email
 */
function formatCancellationEmail(orderData: any): string {
  const orderRef = escapeHtml(
    orderData.order_number || orderData.id.slice(0, 8).toUpperCase()
  );
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Cancelled</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
        <h1 style="margin: 0;">❌ Order Cancelled</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; font-weight: bold; color: #333;">
          Order Reference: <span style="color: #dc2626;">${orderRef}</span>
        </p>
        
        <p style="font-size: 16px; color: #333; margin-top: 20px;">
          We're writing to inform you that your order has been automatically cancelled due to inactivity.
        </p>
        
        <p style="color: #666; margin-top: 15px;">
          Your order was placed on <strong>${new Date(orderData.created_at).toLocaleDateString()}</strong> but no payment was received within the required timeframe.
        </p>
        
        <h2 style="color: #333; border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-top: 30px;">Order Details</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #fee2e2;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ef4444;">Item</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ef4444;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ef4444;">Price</th>
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
              <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ef4444;">Total:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ef4444; color: #dc2626; font-size: 18px;">${orderData.total.toFixed(2)} AED</td>
            </tr>
          </tfoot>
        </table>
        
        <p style="margin-top: 30px; padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
          <strong>What's Next?</strong><br>
          If you'd like to place a new order, please visit our website. We're here to help if you have any questions.
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
 * Send cancellation email
 */
async function sendCancellationEmail(orderData: any): Promise<{ success: boolean; error?: string }> {
  const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;
  const customerEmail = orderData.guest_email || orderData.user_id;

  if (!customerEmail) {
    return { success: false, error: "No customer email found" };
  }

  if (edgeFunctionUrl) {
    try {
      const emailBody = formatCancellationEmail(orderData);
      const response = await fetch(`${edgeFunctionUrl}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: customerEmail,
          subject: `Order Cancelled: ${orderData.order_number || orderData.id.slice(0, 8).toUpperCase()}`,
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
  console.log("📧 Cancellation email would be sent to:", customerEmail);
  return { success: true };
}

/**
 * Auto-cancel old pending orders
 * Cancels orders in "pending" status older than X days (default: 30)
 */
export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    logBackgroundJob("order-auto-cancel", "started", {
      ipAddress,
      timestamp: new Date().toISOString(),
    });

    // Verify this is an internal call
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || "your-secret-token";
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      logBackgroundJob("order-auto-cancel", "failed", {
        error: "Unauthorized",
        ipAddress,
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const autoCancelDays = parseInt(process.env.AUTO_CANCEL_DAYS || "30", 10);

    // Find orders in "pending" status older than X days
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - autoCancelDays);

    const { data: ordersToCancel, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "pending")
      .lt("created_at", cutoffDate.toISOString());

    if (fetchError) {
      logBackgroundJob("order-auto-cancel", "failed", {
        error: fetchError.message,
        ipAddress,
      });
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    if (!ordersToCancel || ordersToCancel.length === 0) {
      logBackgroundJob("order-auto-cancel", "completed", {
        cancelled: 0,
        ipAddress,
      });
      return NextResponse.json({
        success: true,
        message: "No orders to auto-cancel",
        cancelled: 0,
      });
    }

    // Cancel orders and send emails
    const cancelledOrders: string[] = [];
    const emailErrors: Array<{ orderId: string; error: string }> = [];

    for (const order of ordersToCancel) {
      // Update order status to cancelled
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id);

      if (updateError) {
        emailErrors.push({ orderId: order.id, error: updateError.message });
        continue;
      }

      cancelledOrders.push(order.id);

      // Send cancellation email
      const emailResult = await sendCancellationEmail(order);
      if (!emailResult.success) {
        emailErrors.push({ 
          orderId: order.id, 
          error: emailResult.error || "Failed to send email" 
        });
      }

      // Log cancellation event
      logOrderEvent("auto-cancelled", order.id, {
        orderNumber: order.order_number,
        daysOld: Math.floor((now.getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      });
    }

    logBackgroundJob("order-auto-cancel", "completed", {
      cancelled: cancelledOrders.length,
      totalFound: ordersToCancel.length,
      emailErrors: emailErrors.length,
      orderIds: cancelledOrders.slice(0, 10), // Log first 10 IDs
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Auto-cancelled ${cancelledOrders.length} orders`,
      cancelled: cancelledOrders.length,
      totalFound: ordersToCancel.length,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
    });
  } catch (error: any) {
    logBackgroundJob("order-auto-cancel", "failed", {
      error: error.message,
      stack: error.stack,
      ipAddress,
    });
    console.error("Auto-cancel error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: "Use POST with authorization header to trigger auto-cancellation",
    note: "Set CRON_SECRET environment variable for security",
    config: {
      autoCancelDays: process.env.AUTO_CANCEL_DAYS || "30",
    },
  });
}

