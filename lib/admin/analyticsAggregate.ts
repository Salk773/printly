/**
 * Server-safe analytics helpers for order aggregates (used by /api/admin/analytics).
 */

export interface RawOrderItem {
  id?: string;
  name?: string;
  price?: unknown;
  quantity?: unknown;
}

export interface RawOrderRow {
  id: string;
  total?: unknown;
  status?: unknown;
  created_at: string;
  items?: RawOrderItem[] | null;
  guest_email?: string | null;
  guest_name?: string | null;
  shipping_cost?: unknown;
  discount_amount?: unknown;
  coupon_code?: string | null;
}

export interface MonthlySales {
  month: string;
  year: number;
  total: number;
  orderCount: number;
  key: string;
}

export interface ProductPerformance {
  key: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export interface TimeBucket {
  key: string;
  label: string;
  revenue: number;
  orderCount: number;
}

export interface PeriodSummary {
  revenueAed: number;
  ordersAllStatuses: number;
  salesOrdersCount: number;
  averageOrderValue: number;
  shippingCollectedAed: number;
  discountsGivenAed: number;
  merchandiseAfterDiscountAed: number;
}

export interface TopCustomer {
  email: string;
  name: string | null;
  orders: number;
  revenue: number;
}

export interface CustomerInsights {
  uniqueBuyers: number;
  repeatOrdersInPeriod: number;
  topCustomers: TopCustomer[];
}

export function toFiniteNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function normalizeStatus(status: unknown): string {
  return String(status || "").trim().toLowerCase();
}

export function isSalesStatus(status: unknown): boolean {
  const normalized = normalizeStatus(status);
  return (
    normalized === "paid" ||
    normalized === "processing" ||
    normalized === "completed"
  );
}

export function isValidLineItem(item: unknown): item is {
  id?: string;
  name: string;
  price: number;
  quantity: number;
} {
  if (!item || typeof item !== "object") return false;
  const o = item as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    typeof o.price === "number" &&
    typeof o.quantity === "number"
  );
}

export function getOrderTotal(order: RawOrderRow): number {
  const total = toFiniteNumber(order.total);
  if (total > 0) return total;
  if (!Array.isArray(order.items)) return 0;
  return order.items.filter(isValidLineItem).reduce((sum, item) => {
    return sum + toFiniteNumber(item.price) * toFiniteNumber(item.quantity);
  }, 0);
}

export function lineKey(item: { id?: string; name: string }): string {
  const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : "";
  return id || `name:${item.name}`;
}

export function summarizePeriod(orders: RawOrderRow[]): PeriodSummary {
  const salesOrders = orders.filter((o) => isSalesStatus(o.status));
  const revenueAed = salesOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const salesOrdersCount = salesOrders.length;
  const shippingCollectedAed = salesOrders.reduce(
    (s, o) => s + toFiniteNumber(o.shipping_cost),
    0
  );
  const discountsGivenAed = salesOrders.reduce(
    (s, o) => s + toFiniteNumber(o.discount_amount),
    0
  );
  const merchandiseAfterDiscountAed = salesOrders.reduce((s, o) => {
    const t = getOrderTotal(o);
    const ship = toFiniteNumber(o.shipping_cost);
    return s + Math.max(0, t - ship);
  }, 0);

  return {
    revenueAed,
    ordersAllStatuses: orders.length,
    salesOrdersCount,
    averageOrderValue:
      salesOrdersCount > 0 ? revenueAed / salesOrdersCount : 0,
    shippingCollectedAed,
    discountsGivenAed,
    merchandiseAfterDiscountAed,
  };
}

export function funnelCounts(orders: RawOrderRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of orders) {
    const k = normalizeStatus(o.status) || "unknown";
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

export function funnelRevenueByStatus(orders: RawOrderRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of orders) {
    const k = normalizeStatus(o.status) || "unknown";
    out[k] = (out[k] || 0) + getOrderTotal(o);
  }
  return out;
}

export function buildMonthlySales(orders: RawOrderRow[]): MonthlySales[] {
  const salesOrders = orders.filter((o) => isSalesStatus(o.status));
  const monthlySalesMap = new Map<string, MonthlySales>();

  for (const order of salesOrders) {
    const date = new Date(order.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthName = date.toLocaleString("default", { month: "long" });

    if (!monthlySalesMap.has(monthKey)) {
      monthlySalesMap.set(monthKey, {
        key: monthKey,
        month: monthName,
        year: date.getFullYear(),
        total: 0,
        orderCount: 0,
      });
    }

    const row = monthlySalesMap.get(monthKey)!;
    row.total += getOrderTotal(order);
    row.orderCount += 1;
  }

  return Array.from(monthlySalesMap.values())
    .sort((a, b) => b.key.localeCompare(a.key));
}

/** Daily buckets (UTC date key) for charts */
export function buildDailySales(orders: RawOrderRow[]): TimeBucket[] {
  const salesOrders = orders.filter((o) => isSalesStatus(o.status));
  const map = new Map<string, TimeBucket>();

  for (const order of salesOrders) {
    const d = new Date(order.created_at);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    const label = key;

    if (!map.has(key)) {
      map.set(key, { key, label, revenue: 0, orderCount: 0 });
    }
    const b = map.get(key)!;
    b.revenue += getOrderTotal(order);
    b.orderCount += 1;
  }

  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export function buildProductPerformance(orders: RawOrderRow[]): ProductPerformance[] {
  const salesOrders = orders.filter((o) => isSalesStatus(o.status));
  const productMap = new Map<string, ProductPerformance>();

  for (const order of salesOrders) {
    if (!order.items || !Array.isArray(order.items)) continue;

    for (const item of order.items) {
      if (!isValidLineItem(item)) continue;
      const key = lineKey(item);
      const displayName = item.name.trim() || key;

      if (!productMap.has(key)) {
        productMap.set(key, {
          key,
          name: displayName,
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0,
        });
      }

      const p = productMap.get(key)!;
      const qty = toFiniteNumber(item.quantity);
      const price = toFiniteNumber(item.price);
      p.totalQuantity += qty;
      p.totalRevenue += price * qty;
      p.orderCount += 1;
    }
  }

  return Array.from(productMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );
}

/**
 * @param emailsWithSalesBeforePeriod — guest_email values (lowercased) that already had
 *   at least one paid/processing/completed order before the selected range starts.
 */
export function customerInsights(
  ordersInPeriod: RawOrderRow[],
  emailsWithSalesBeforePeriod: Set<string>
): CustomerInsights {
  const salesInPeriod = ordersInPeriod
    .filter((o) => isSalesStatus(o.status))
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  const emailToOrders = new Map<
    string,
    { revenue: number; orders: number; name: string | null }
  >();

  for (const o of salesInPeriod) {
    const email = String(o.guest_email || "").trim().toLowerCase();
    if (!email) continue;
    const rev = getOrderTotal(o);
    const prev = emailToOrders.get(email);
    const name = o.guest_name ? String(o.guest_name) : null;
    if (!prev) {
      emailToOrders.set(email, { revenue: rev, orders: 1, name });
    } else {
      emailToOrders.set(email, {
        revenue: prev.revenue + rev,
        orders: prev.orders + 1,
        name: prev.name || name,
      });
    }
  }

  const seenEmailInPeriod = new Set<string>();
  let repeatOrdersInPeriod = 0;

  for (const o of salesInPeriod) {
    const email = String(o.guest_email || "").trim().toLowerCase();
    if (!email) continue;
    const priorOutsidePeriod = emailsWithSalesBeforePeriod.has(email);
    const priorInsidePeriod = seenEmailInPeriod.has(email);
    if (priorOutsidePeriod || priorInsidePeriod) repeatOrdersInPeriod += 1;
    seenEmailInPeriod.add(email);
  }

  const topCustomers: TopCustomer[] = Array.from(emailToOrders.entries())
    .map(([email, v]) => ({
      email,
      name: v.name,
      orders: v.orders,
      revenue: v.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);

  return {
    uniqueBuyers: emailToOrders.size,
    repeatOrdersInPeriod,
    topCustomers,
  };
}

export function growthPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export interface ChartPoint {
  label: string;
  revenue: number;
  orders: number;
}

export function buildChartSeries(
  orders: RawOrderRow[],
  granularity: "daily" | "monthly"
): ChartPoint[] {
  if (granularity === "daily") {
    return buildDailySales(orders).map((b) => ({
      label: b.label,
      revenue: b.revenue,
      orders: b.orderCount,
    }));
  }
  return buildMonthlySales(orders).map((m) => ({
    label: `${m.month} ${m.year}`,
    revenue: m.total,
    orders: m.orderCount,
  }));
}

/** Inclusive calendar-day span in UTC (start-of-day to start-of-day). */
export function daysBetweenInclusive(from: Date, to: Date): number {
  const a = startOfUtcDay(from).getTime();
  const b = startOfUtcDay(to).getTime();
  return Math.max(1, Math.floor((b - a) / 86400000) + 1);
}

export function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
}

export function endOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
}
