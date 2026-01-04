/**
 * HTML and email sanitization utilities
 * Prevents XSS attacks in email templates and user-generated content
 */

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sanitize text for use in HTML attributes
 */
export function escapeAttribute(text: string | null | undefined): string {
  return escapeHtml(text).replace(/\n/g, " ");
}

/**
 * Sanitize email address (basic validation)
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Sanitize user input for email templates
 * Escapes HTML and limits length
 */
export function sanitizeForEmail(
  text: string | null | undefined,
  maxLength: number = 1000
): string {
  if (!text) return "";
  const trimmed = text.trim();
  const truncated = trimmed.length > maxLength ? trimmed.substring(0, maxLength) + "..." : trimmed;
  return escapeHtml(truncated);
}

/**
 * Sanitize order data for email templates
 */
export function sanitizeOrderDataForEmail(data: {
  orderId?: string;
  orderNumber?: string | null;
  customerName?: string | null;
  customerEmail: string;
  phone?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
  };
  notes?: string | null;
  items?: Array<{ name: string; price: number; quantity: number }>;
  total?: number;
}): {
  orderId: string;
  orderNumber: string | null;
  customerName: string | null;
  customerEmail: string;
  phone: string;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string | null;
  };
  notes: string | null;
  items: Array<{ name: string; price: number; quantity: number }>;
  total: number;
} {
  return {
    orderId: data.orderId ? sanitizeForEmail(data.orderId, 50) : (data.orderId || ""),
    orderNumber: data.orderNumber ? sanitizeForEmail(data.orderNumber, 50) : null,
    customerName: sanitizeForEmail(data.customerName, 100),
    customerEmail: sanitizeEmail(data.customerEmail),
    phone: sanitizeForEmail(data.phone, 50) || "",
    address: data.address
      ? {
          line1: sanitizeForEmail(data.address.line1, 200) || "",
          line2: data.address.line2 ? sanitizeForEmail(data.address.line2, 200) : null,
          city: sanitizeForEmail(data.address.city, 100) || "",
          state: sanitizeForEmail(data.address.state, 100) || "",
          postalCode: data.address.postalCode ? sanitizeForEmail(data.address.postalCode, 20) : null,
        }
      : {
          line1: "",
          line2: null,
          city: "",
          state: "",
          postalCode: null,
        },
    notes: data.notes ? sanitizeForEmail(data.notes, 500) : null,
    items: data.items?.map((item) => ({
      name: sanitizeForEmail(item.name, 200),
      price: item.price,
      quantity: item.quantity,
    })) || [],
    total: data.total || 0,
  };
}

