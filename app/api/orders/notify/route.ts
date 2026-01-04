import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { ADMIN_EMAILS } from "@/lib/adminEmails";
import { OrderNotifySchema, validateRequest } from "@/lib/validation/schemas";
import { sanitizeOrderDataForEmail, escapeHtml } from "@/lib/security/sanitize";

interface OrderEmailData {
  orderId: string;
  orderNumber: string | null;
  customerEmail: string;
  customerName: string | null;
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

function formatOrderEmail(data: OrderEmailData, isAdmin: boolean): string {
  // Sanitize all user inputs
  const sanitized = sanitizeOrderDataForEmail(data);
  const orderRef = escapeHtml(
    sanitized.orderNumber || sanitized.orderId.slice(0, 8).toUpperCase()
  );
  
  let emailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isAdmin ? "New Order" : "Order Confirmation"}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #c084fc, #a855f7); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
        <h1 style="margin: 0;">${isAdmin ? "🛒 New Order Received" : "✅ Order Confirmation"}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; font-weight: bold; color: #333;">
          Order Reference: <span style="color: #a855f7;">${orderRef}</span>
        </p>
        
        ${isAdmin ? `
          <h2 style="color: #333; border-bottom: 2px solid #c084fc; padding-bottom: 10px;">Customer Information</h2>
          <p><strong>Name:</strong> ${sanitized.customerName || "Guest"}</p>
          <p><strong>Email:</strong> ${sanitized.customerEmail}</p>
          <p><strong>Phone:</strong> ${sanitized.phone}</p>
          <p><strong>Address:</strong><br>
            ${sanitized.address?.line1 || ""}<br>
            ${sanitized.address?.line2 ? sanitized.address.line2 + "<br>" : ""}
            ${sanitized.address?.city || ""}, ${sanitized.address?.state || ""}<br>
            ${sanitized.address?.postalCode || ""}
          </p>
        ` : `
          <p>Thank you for your order! We've received your order and will contact you shortly to confirm.</p>
          <p><strong>Contact:</strong> ${sanitized.phone}</p>
          <p><strong>Delivery Address:</strong><br>
            ${sanitized.address?.line1 || ""}<br>
            ${sanitized.address?.line2 ? sanitized.address.line2 + "<br>" : ""}
            ${sanitized.address?.city || ""}, ${sanitized.address?.state || ""}<br>
            ${sanitized.address?.postalCode || ""}
          </p>
        `}
        
        <h2 style="color: #333; border-bottom: 2px solid #c084fc; padding-bottom: 10px; margin-top: 30px;">Order Details</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #e9d5ff;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #c084fc;">Item</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #c084fc;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #c084fc;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${(sanitized.items || []).map(item => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${(item.price * item.quantity).toFixed(2)} AED</td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #c084fc;">Total:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #c084fc; color: #a855f7; font-size: 18px;">${sanitized.total.toFixed(2)} AED</td>
            </tr>
          </tfoot>
        </table>
        
        ${sanitized.notes ? `
          <h3 style="color: #333; margin-top: 20px;">Notes:</h3>
          <p style="background: #fff; padding: 10px; border-left: 4px solid #c084fc; border-radius: 4px;">${sanitized.notes}</p>
        ` : ""}
        
        ${isAdmin ? `
          <p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
            <strong>Action Required:</strong> Please review this order and contact the customer to confirm.
          </p>
        ` : `
          <p style="margin-top: 30px; padding: 15px; background: #d1ecf1; border-left: 4px solid #0c5460; border-radius: 4px;">
            <strong>Next Steps:</strong> We'll contact you shortly to confirm your order and arrange delivery.
          </p>
        `}
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>Printly.ae - 3D Printing Marketplace</p>
      </div>
    </body>
    </html>
  `;

  return emailBody;
}

function formatProcessingEmail(data: OrderEmailData): string {
  // Sanitize all user inputs
  const sanitized = sanitizeOrderDataForEmail(data);
  const orderRef = escapeHtml(
    sanitized.orderNumber || sanitized.orderId.slice(0, 8).toUpperCase()
  );
  
  let emailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Processing</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
        <h1 style="margin: 0;">🔄 Order Now Processing</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; font-weight: bold; color: #333;">
          Order Reference: <span style="color: #2563eb;">${orderRef}</span>
        </p>
        
        <p style="font-size: 16px; color: #333; margin-top: 20px;">
          Great news! Your order is now being processed. Our team has started working on your items.
        </p>
        
        <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 30px;">Order Details</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #dbeafe;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #3b82f6;">Item</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #3b82f6;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #3b82f6;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${(sanitized.items || []).map(item => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${(item.price * item.quantity).toFixed(2)} AED</td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #3b82f6;">Total:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #3b82f6; color: #2563eb; font-size: 18px;">${sanitized.total.toFixed(2)} AED</td>
            </tr>
          </tfoot>
        </table>
        
        <p style="margin-top: 30px; padding: 15px; background: #dbeafe; border-left: 4px solid #2563eb; border-radius: 4px;">
          <strong>What's Next?</strong><br>
          We're currently processing your order. You'll receive another email once your order is completed and ready for delivery.
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
  console.log("Body:", htmlBody.substring(0, 200) + "...");

  // For now, return success in development
  // Replace this with actual email service integration
  return { success: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateRequest(OrderNotifySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: (validation as { success: false; error: string }).error },
        { status: 400 }
      );
    }

    const { type, orderData } = validation.data;

    const isAdmin = type === "admin";
    const isProcessing = type === "processing";
    
    // Sanitize order data before using
    // Schema validation guarantees all required fields are present
    const sanitizedOrderData = sanitizeOrderDataForEmail({
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber ?? null,
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName ?? null,
      phone: orderData.phone,
      address: orderData.address,
      items: orderData.items as Array<{ name: string; price: number; quantity: number }>,
      total: orderData.total,
      notes: orderData.notes ?? null,
    });
    
    const recipientEmail = isAdmin
      ? ADMIN_EMAILS[0] || process.env.ADMIN_EMAIL || "info@printly.ae"
      : sanitizedOrderData.customerEmail;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 }
      );
    }

    const orderRef = sanitizedOrderData.orderNumber || sanitizedOrderData.orderId.slice(0, 8).toUpperCase();
    let subject: string;
    let emailBody: string;

    // Convert sanitized data to OrderEmailData format
    const emailData: OrderEmailData = {
      orderId: sanitizedOrderData.orderId,
      orderNumber: sanitizedOrderData.orderNumber,
      customerEmail: sanitizedOrderData.customerEmail,
      customerName: sanitizedOrderData.customerName,
      phone: sanitizedOrderData.phone,
      address: sanitizedOrderData.address,
      items: sanitizedOrderData.items,
      total: sanitizedOrderData.total,
      notes: sanitizedOrderData.notes,
    };

    if (isProcessing) {
      subject = `Order Processing: ${escapeHtml(orderRef)}`;
      emailBody = formatProcessingEmail(emailData);
    } else {
      subject = isAdmin
        ? `New Order: ${escapeHtml(orderRef)}`
        : `Order Confirmation: ${escapeHtml(orderRef)}`;
      emailBody = formatOrderEmail(emailData, isAdmin);
    }

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

