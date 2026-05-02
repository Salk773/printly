import "server-only";
import { siteUrl } from "@/lib/stripe";

type OrderRow = {
  id: string;
  order_number: string | null;
  guest_email: string | null;
  guest_name: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  items: unknown;
  total: number;
  notes: string | null;
};

export async function sendPaidOrderEmails(order: OrderRow): Promise<void> {
  const customerEmail = order.guest_email;
  if (!customerEmail) return;

  const rawItems = Array.isArray(order.items) ? order.items : [];
  const items = rawItems.map((i: any) => ({
    name: String(i?.name ?? ""),
    price: Number(i?.price ?? 0),
    quantity: Math.max(1, Math.floor(Number(i?.quantity ?? 1))),
  }));

  const base = siteUrl();
  const orderData = {
    orderId: order.id,
    orderNumber: order.order_number,
    customerEmail,
    customerName: order.guest_name,
    phone: order.phone || "",
    address: {
      line1: order.address_line_1 || "",
      line2: order.address_line_2,
      city: order.city || "",
      state: order.state || "",
      postalCode: order.postal_code,
    },
    items,
    total: Number(order.total),
    notes: order.notes,
  };

  await Promise.all([
    fetch(`${base}/api/orders/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "customer", orderData }),
    }),
    fetch(`${base}/api/orders/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "admin", orderData }),
    }),
  ]);
}
