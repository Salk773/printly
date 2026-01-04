import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

interface OrderEmailData {
  orderId: string;
  orderNumber: string | null;
  customerName: string | null;
  customerEmail: string;
  phone: string;
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode?: string | null;
  };
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  notes?: string | null;
}

/**
 * Format order details for email
 */
function formatOrderEmail(data: OrderEmailData, isAdmin: boolean): string {
  const { orderNumber, customerName, customerEmail, phone, address, items, total, notes } = data;

  const orderNum = orderNumber || data.orderId.slice(0, 8).toUpperCase();
  const customer = customerName || "Guest Customer";

  let emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #a855f7;">${isAdmin ? "New Order Received" : "Order Confirmation"}</h2>
      
      <p><strong>Order Number:</strong> ${orderNum}</p>
      
      ${isAdmin ? `
        <h3 style="color: #c084fc; margin-top: 20px;">Customer Information</h3>
        <p><strong>Name:</strong> ${customer}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Phone:</strong> ${phone}</p>
      ` : `
        <p>Thank you for your order, ${customer}!</p>
        <p>We've received your order and will process it shortly.</p>
      `}
      
      <h3 style="color: #c084fc; margin-top: 20px;">Delivery Address</h3>
      <p>
        ${address.line1}<br>
        ${address.line2 ? `${address.line2}<br>` : ""}
        ${address.city}, ${address.state}${address.postalCode ? ` ${address.postalCode}` : ""}
      </p>
      
      <h3 style="color: #c084fc; margin-top: 20px;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #0f172a; color: white;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: right;">Quantity</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr style="border-bottom: 1px solid #1e293b;">
              <td style="padding: 10px;">${item.name}</td>
              <td style="padding: 10px; text-align: right;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right;">${item.price.toFixed(2)} AED</td>
              <td style="padding: 10px; text-align: right;">${(item.price * item.quantity).toFixed(2)} AED</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">${total.toFixed(2)} AED</td>
          </tr>
        </tfoot>
      </table>
      
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
      
      ${isAdmin ? `
        <p style="margin-top: 30px; color: #64748b; font-size: 0.9em;">
          Please process this order in the admin panel.
        </p>
      ` : `
        <p style="margin-top: 30px; color: #64748b; font-size: 0.9em;">
          You will receive updates about your order via email.
        </p>
      `}
      
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 30px 0;">
      <p style="color: #64748b; font-size: 0.85em; text-align: center;">
        Printly - Made layer by layer.
      </p>
    </div>
  `;

  return emailBody;
}

/**
 * Send email using Supabase Edge Function or fallback to console
 * In production, you should set up a Supabase Edge Function for email
 * For now, we'll use a simple approach that can be extended
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> {
  // Check if Supabase Edge Function URL is configured
  const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;

  if (edgeFunctionUrl) {
    try {
      const response = await fetch(`${edgeFunctionUrl}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to,
          subject,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Edge Function email error:", error);
      return { success: false, error: error.message };
    }
  }

  // Fallback: Log email (for development)
  // In production, you should configure an email service
  console.log("📧 Email would be sent:");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Body:", htmlBody);

  // For now, return success in development
  // Replace this with actual email service integration
  return { success: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, orderData } = body;

    if (!orderData || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const isAdmin = type === "admin";
    const recipientEmail = isAdmin
      ? process.env.ADMIN_EMAIL || "info@printly.ae"
      : orderData.customerEmail;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 }
      );
    }

    const subject = isAdmin
      ? `New Order: ${orderData.orderNumber || orderData.orderId.slice(0, 8).toUpperCase()}`
      : `Order Confirmation: ${orderData.orderNumber || orderData.orderId.slice(0, 8).toUpperCase()}`;

    const emailBody = formatOrderEmail(orderData, isAdmin);

    const result = await sendEmail(recipientEmail, subject, emailBody);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    console.error("Order notification error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

