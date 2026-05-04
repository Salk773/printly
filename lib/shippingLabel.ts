import type { Order } from "@/app/admin/page";

/** Lines for ship-to block (thermal-friendly, no HTML). */
export function shipToLines(order: Order): string[] {
  const lines: string[] = [];
  const name = order.guest_name?.trim();
  if (name) lines.push(name);
  const phone = order.phone?.trim();
  if (phone) lines.push(phone);
  const a1 = order.address_line_1?.trim();
  if (a1) lines.push(a1);
  const a2 = order.address_line_2?.trim();
  if (a2) lines.push(a2);
  const tail = [order.city, order.state, order.postal_code].filter(Boolean).join(", ").trim();
  if (tail) lines.push(tail);
  return lines;
}

export function orderIdentifier(order: Order): string {
  if (order.order_number?.trim()) return `Order #${order.order_number.trim()}`;
  return `Order ${order.id.slice(0, 8)}…`;
}

export function formatItemLines(order: Order): string[] {
  const raw = order.items;
  const items = Array.isArray(raw) ? raw : [];
  return items.map((i: { name?: string; quantity?: number }) => {
    const q = typeof i.quantity === "number" ? i.quantity : 1;
    const n = (i.name || "Item").trim();
    return `${n} × ${q}`;
  });
}
