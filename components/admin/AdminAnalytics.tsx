"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminCard from "@/components/admin/AdminCard";

interface PeriodSummary {
  revenueAed: number;
  ordersAllStatuses: number;
  salesOrdersCount: number;
  averageOrderValue: number;
  shippingCollectedAed: number;
  discountsGivenAed: number;
  merchandiseAfterDiscountAed: number;
}

interface ChartPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface MonthlySalesRow {
  key: string;
  month: string;
  year: number;
  total: number;
  orderCount: number;
}

interface ProductPerformance {
  key: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

interface TopCustomer {
  email: string;
  name: string | null;
  orders: number;
  revenue: number;
}

interface AnalyticsPayload {
  preset: string;
  range: {
    from: string | null;
    to: string;
    label: string;
    days: number | null;
  };
  compareRange: { from: string; to: string } | null;
  summary: PeriodSummary;
  compareSummary: PeriodSummary | null;
  growth: {
    revenuePct: number | null;
    ordersPct: number | null;
    aovPct: number | null;
  } | null;
  funnel: Record<string, number>;
  funnelRevenue: Record<string, number>;
  chartSeries: ChartPoint[];
  chartGranularity: "daily" | "monthly";
  monthlySales: MonthlySalesRow[];
  productPerformance: ProductPerformance[];
  customers: {
    uniqueBuyers: number;
    repeatOrdersInPeriod: number;
    topCustomers: TopCustomer[];
  };
  lifetime: PeriodSummary;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatGrowth(pct: number | null): string {
  if (pct === null) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function growthColor(pct: number | null): string {
  if (pct === null) return "#64748b";
  if (pct > 0) return "#22c55e";
  if (pct < 0) return "#ef4444";
  return "#94a3b8";
}

function RevenueBarChart({
  points,
  granularity,
}: {
  points: ChartPoint[];
  granularity: string;
}) {
  if (points.length === 0) {
    return (
      <p style={{ opacity: 0.6, margin: 0 }}>No revenue in this range.</p>
    );
  }

  const maxRev = Math.max(...points.map((p) => p.revenue), 1);
  const h = 140;
  const barW = Math.min(48, Math.max(8, 600 / points.length - 4));

  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      <svg
        width={Math.max(600, points.length * (barW + 6))}
        height={h + 48}
        style={{ display: "block" }}
      >
        {points.map((p, i) => {
          const barH = (p.revenue / maxRev) * h;
          const x = i * (barW + 6) + 8;
          const y = h - barH;
          return (
            <g key={`${p.label}-${i}`}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                fill="url(#revGrad)"
                opacity={0.9}
              />
              <text
                x={x + barW / 2}
                y={h + 14}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={10}
              >
                {p.label.length > 11 ? p.label.slice(0, 9) + "…" : p.label}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
      <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
        {granularity === "daily" ? "By day (UTC)" : "By month"} — see Sales by month table for detail
      </p>
    </div>
  );
}

function exportAnalyticsCsv(data: AnalyticsPayload) {
  const lines: string[] = [];
  const esc = (v: string | number) =>
    `"${String(v).replace(/"/g, '""')}"`;

  lines.push("section,metric,value");
  lines.push(`summary,range,${esc(data.range.label)}`);
  lines.push(`summary,revenue_aed,${data.summary.revenueAed}`);
  lines.push(`summary,sales_orders,${data.summary.salesOrdersCount}`);
  lines.push(`summary,all_orders_any_status,${data.summary.ordersAllStatuses}`);
  lines.push(`summary,aov,${data.summary.averageOrderValue}`);
  lines.push(`summary,shipping_collected,${data.summary.shippingCollectedAed}`);
  lines.push(`summary,discounts_given,${data.summary.discountsGivenAed}`);
  lines.push(
    `summary,merchandise_est,${data.summary.merchandiseAfterDiscountAed}`
  );

  lines.push("funnel,status,order_count,sum_order_totals");
  for (const [status, count] of Object.entries(data.funnel).sort(
    (a, b) => b[1] - a[1]
  )) {
    lines.push(
      `funnel,${esc(status)},${count},${data.funnelRevenue[status] ?? 0}`
    );
  }

  lines.push("chart,label,revenue,orders");
  for (const p of data.chartSeries) {
    lines.push(`chart,${esc(p.label)},${p.revenue},${p.orders}`);
  }

  lines.push("month,label,orders,revenue");
  for (const m of data.monthlySales) {
    lines.push(
      `month,${esc(`${m.month} ${m.year}`)},${m.orderCount},${m.total}`
    );
  }

  lines.push("product,key,name,qty_sold,revenue,line_count");
  for (const p of data.productPerformance) {
    lines.push(
      `product,${esc(p.key)},${esc(p.name)},${p.totalQuantity},${p.totalRevenue},${p.orderCount}`
    );
  }

  lines.push(`customers,unique_buyers,,${data.customers.uniqueBuyers}`);
  lines.push(
    `customers,repeat_orders_in_range,,${data.customers.repeatOrdersInPeriod}`
  );
  lines.push("top_customer,email,name,orders,revenue");
  for (const c of data.customers.topCustomers) {
    lines.push(
      `top_customer,${esc(c.email)},${esc(c.name ?? "")},${c.orders},${c.revenue}`
    );
  }

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `printly-analytics-${data.preset}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAnalytics() {
  const [preset, setPreset] = useState<
    "7d" | "30d" | "90d" | "all" | "custom"
  >("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        setError("Not authenticated");
        return;
      }

      const token = session.data.session.access_token;
      let url = `/api/admin/analytics?preset=${encodeURIComponent(preset)}`;
      if (preset === "custom") {
        if (!customFrom?.trim() || !customTo?.trim()) {
          setError("Choose start and end dates for a custom range.");
          setLoading(false);
          return;
        }
        url += `&from=${encodeURIComponent(customFrom.trim())}&to=${encodeURIComponent(customTo.trim())}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let msg = "Failed to fetch analytics";
        try {
          const body = await response.json();
          if (body?.error) msg = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const json = (await response.json()) as AnalyticsPayload;
      setData(json);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    if (preset === "custom") return;
    fetchAnalytics();
  }, [preset, fetchAnalytics]);

  const funnelRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.funnel).sort((a, b) => b[1] - a[1]);
  }, [data]);

  if (loading && !data) {
    return <p>Loading analytics…</p>;
  }

  if (error && !data) {
    return <p style={{ color: "#ef4444" }}>Error: {error}</p>;
  }

  if (!data) {
    return <p>No data available</p>;
  }

  return (
    <div>
      {/* Controls */}
      <AdminCard maxWidth={900} style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          {(
            [
              ["7d", "Last 7 days"],
              ["30d", "Last 30 days"],
              ["90d", "Last 90 days"],
              ["all", "All time"],
              ["custom", "Custom"],
            ] as const
          ).map(([p, label]) => (
            <button
              key={p}
              type="button"
              className={preset === p ? "btn-primary" : "btn-ghost"}
              onClick={() => setPreset(p)}
              style={{ fontSize: 13 }}
            >
              {label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <label style={{ fontSize: 13, color: "#94a3b8" }}>
              From{" "}
              <input
                type="date"
                className="input"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{ marginLeft: 8 }}
              />
            </label>
            <label style={{ fontSize: 13, color: "#94a3b8" }}>
              To{" "}
              <input
                type="date"
                className="input"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{ marginLeft: 8 }}
              />
            </label>
            <button type="button" className="btn-primary" onClick={fetchAnalytics}>
              Apply range
            </button>
          </div>
        )}

        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
          <strong style={{ color: "#e5e7eb" }}>Selected range:</strong>{" "}
          {data.range.label}
          {data.range.days != null ? ` · ${data.range.days} days` : ""}
        </p>
        {loading && (
          <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>Refreshing…</p>
        )}
      </AdminCard>

      {error && (
        <p style={{ color: "#f97316", marginBottom: 16 }}>{error}</p>
      )}

      {/* Summary — selected period */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <AdminCard>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
              Revenue (range)
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e" }}>
              {formatCurrency(data.summary.revenueAed)}
            </div>
            {data.growth && (
              <div
                style={{
                  fontSize: 12,
                  marginTop: 6,
                  color: growthColor(data.growth.revenuePct),
                }}
              >
                vs prior period: {formatGrowth(data.growth.revenuePct)}
              </div>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
              Orders in revenue
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>
              {data.summary.salesOrdersCount}
            </div>
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>
              Paid / processing / completed
            </div>
            {data.growth && (
              <div
                style={{
                  fontSize: 12,
                  marginTop: 6,
                  color: growthColor(data.growth.ordersPct),
                }}
              >
                vs prior: {formatGrowth(data.growth.ordersPct)}
              </div>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
              AOV (range)
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#8b5cf6" }}>
              {formatCurrency(data.summary.averageOrderValue)}
            </div>
            {data.growth && (
              <div
                style={{
                  fontSize: 12,
                  marginTop: 6,
                  color: growthColor(data.growth.aovPct),
                }}
              >
                vs prior: {formatGrowth(data.growth.aovPct)}
              </div>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
              All orders (range)
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b" }}>
              {data.summary.ordersAllStatuses}
            </div>
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>
              Every status in range
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Shipping & discounts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <AdminCard>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>
            Shipping collected (range)
          </div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>
            {formatCurrency(data.summary.shippingCollectedAed)}
          </div>
        </AdminCard>
        <AdminCard>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>
            Discounts given (range)
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#f472b6" }}>
            {formatCurrency(data.summary.discountsGivenAed)}
          </div>
        </AdminCard>
        <AdminCard>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>
            Merchandise total (est.)
          </div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>
            {formatCurrency(data.summary.merchandiseAfterDiscountAed)}
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
            Order total minus shipping, revenue orders only
          </div>
        </AdminCard>
      </div>

      {/* Lifetime (when range is not all time) */}
      {data.preset !== "all" && (
        <AdminCard maxWidth={900} style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, fontSize: 16 }}>All-time (store)</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              fontSize: 14,
            }}
          >
            <span>
              <strong>{formatCurrency(data.lifetime.revenueAed)}</strong>{" "}
              <span style={{ opacity: 0.65 }}>revenue</span>
            </span>
            <span>
              <strong>{data.lifetime.salesOrdersCount}</strong>{" "}
              <span style={{ opacity: 0.65 }}>paid+ orders</span>
            </span>
            <span>
              <strong>{data.lifetime.ordersAllStatuses}</strong>{" "}
              <span style={{ opacity: 0.65 }}>orders (any status)</span>
            </span>
          </div>
        </AdminCard>
      )}

      {/* Funnel */}
      <AdminCard maxWidth={900} style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>
          Order funnel (range)
        </h2>
        {funnelRows.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No orders in this range.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(148,163,184,0.25)" }}>
                  <th style={{ textAlign: "left", padding: "10px 8px" }}>Status</th>
                  <th style={{ textAlign: "right", padding: "10px 8px" }}>Orders</th>
                  <th style={{ textAlign: "right", padding: "10px 8px" }}>
                    Sum of order totals
                  </th>
                </tr>
              </thead>
              <tbody>
                {funnelRows.map(([status, count], idx) => (
                  <tr
                    key={status}
                    style={{
                      borderBottom:
                        idx < funnelRows.length - 1
                          ? "1px solid rgba(148,163,184,0.12)"
                          : "none",
                    }}
                  >
                    <td style={{ padding: "10px 8px", textTransform: "capitalize" }}>
                      {status}
                    </td>
                    <td style={{ textAlign: "right", padding: "10px 8px" }}>{count}</td>
                    <td style={{ textAlign: "right", padding: "10px 8px" }}>
                      {formatCurrency(data.funnelRevenue[status] ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Chart */}
      <AdminCard maxWidth={900} style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>
          Revenue trend
        </h2>
        <RevenueBarChart
          points={data.chartSeries}
          granularity={data.chartGranularity}
        />
      </AdminCard>

      {/* Monthly breakdown table */}
      <AdminCard maxWidth={900} style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>Sales by month (range)</h2>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => exportAnalyticsCsv(data)}
            style={{ fontSize: 13 }}
          >
            Export CSV
          </button>
        </div>
        {data.monthlySales.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No monthly breakdown in this range.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(148,163,184,0.25)" }}>
                  <th style={{ textAlign: "left", padding: "12px 8px" }}>Month</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>Orders</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>Revenue</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>AOV</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlySales.map((month, idx) => (
                  <tr
                    key={month.key}
                    style={{
                      borderBottom:
                        idx < data.monthlySales.length - 1
                          ? "1px solid rgba(148,163,184,0.12)"
                          : "none",
                    }}
                  >
                    <td style={{ padding: "12px 8px" }}>
                      {month.month} {month.year}
                    </td>
                    <td style={{ textAlign: "right", padding: "12px 8px" }}>
                      {month.orderCount}
                    </td>
                    <td style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600 }}>
                      {formatCurrency(month.total)}
                    </td>
                    <td style={{ textAlign: "right", padding: "12px 8px", opacity: 0.75 }}>
                      {month.orderCount > 0
                        ? formatCurrency(month.total / month.orderCount)
                        : formatCurrency(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Products */}
      <AdminCard maxWidth={900} style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>
          Product performance (range)
        </h2>
        <p style={{ fontSize: 12, opacity: 0.6, marginTop: -8, marginBottom: 12 }}>
          Grouped by product id when stored on line items; otherwise by name.
        </p>
        {data.productPerformance.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No product lines in revenue orders.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(148,163,184,0.25)" }}>
                  <th style={{ textAlign: "left", padding: "12px 8px" }}>Product</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>Qty</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>Revenue</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>Lines</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>Avg price</th>
                </tr>
              </thead>
              <tbody>
                {data.productPerformance.map((product, idx) => (
                  <tr
                    key={product.key}
                    style={{
                      borderBottom:
                        idx < data.productPerformance.length - 1
                          ? "1px solid rgba(148,163,184,0.12)"
                          : "none",
                    }}
                  >
                    <td style={{ padding: "12px 8px", fontWeight: 500 }}>
                      {product.name}
                    </td>
                    <td style={{ textAlign: "right", padding: "12px 8px" }}>
                      {product.totalQuantity}
                    </td>
                    <td style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600, color: "#22c55e" }}>
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td style={{ textAlign: "right", padding: "12px 8px" }}>
                      {product.orderCount}
                    </td>
                    <td style={{ textAlign: "right", padding: "12px 8px", opacity: 0.75 }}>
                      {product.totalQuantity > 0
                        ? formatCurrency(product.totalRevenue / product.totalQuantity)
                        : formatCurrency(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Customers */}
      <AdminCard maxWidth={900} style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>
          Customers (range)
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          <span>
            <strong>{data.customers.uniqueBuyers}</strong>{" "}
            <span style={{ opacity: 0.65 }}>unique buyers (revenue orders)</span>
          </span>
          <span>
            <strong>{data.customers.repeatOrdersInPeriod}</strong>{" "}
            <span style={{ opacity: 0.65 }}>
              repeat orders (returning or 2nd+ in range)
            </span>
          </span>
        </div>
        {data.customers.topCustomers.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No customer email on revenue orders.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(148,163,184,0.25)" }}>
                  <th style={{ textAlign: "left", padding: "12px 8px" }}>Email</th>
                  <th style={{ textAlign: "left", padding: "12px 8px" }}>Name</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>Orders</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.customers.topCustomers.map((c, idx) => (
                  <tr
                    key={c.email}
                    style={{
                      borderBottom:
                        idx < data.customers.topCustomers.length - 1
                          ? "1px solid rgba(148,163,184,0.12)"
                          : "none",
                    }}
                  >
                    <td style={{ padding: "12px 8px", wordBreak: "break-all" }}>
                      {c.email}
                    </td>
                    <td style={{ padding: "12px 8px" }}>{c.name ?? "—"}</td>
                    <td style={{ textAlign: "right", padding: "12px 8px" }}>{c.orders}</td>
                    <td style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600 }}>
                      {formatCurrency(c.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Storefront / traffic note */}
      <AdminCard maxWidth={900}>
        <h3 style={{ marginTop: 0, fontSize: 15 }}>Traffic &amp; marketing</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
          Order analytics above come from your database only (sales, funnel, customers).
          For visits, traffic sources, campaigns, and on-site behavior, connect a tool such as{" "}
          <a href="https://plausible.io" target="_blank" rel="noopener noreferrer" style={{ color: "#c084fc" }}>
            Plausible
          </a>
          ,{" "}
          <a href="https://marketingplatform.google.com" target="_blank" rel="noopener noreferrer" style={{ color: "#c084fc" }}>
            GA4
          </a>
          , or similar and embed or link reports from your deployment docs.
        </p>
      </AdminCard>
    </div>
  );
}
