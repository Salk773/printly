/**
 * Email service for sending order notifications
 * Uses Supabase Edge Functions for email delivery
 */

export interface OrderEmailData {
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
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  try {
    const response = await fetch("/api/orders/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "customer",
        orderData: data,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to send email" }));
      console.error("Email API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return false;
  }
}

/**
 * Send order notification email to admin
 */
export async function sendAdminOrderNotification(data: OrderEmailData): Promise<boolean> {
  try {
    const response = await fetch("/api/orders/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "admin",
        orderData: data,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to send email" }));
      console.error("Email API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending admin notification email:", error);
    return false;
  }
}

