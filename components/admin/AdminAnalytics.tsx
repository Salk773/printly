"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminCard from "@/components/admin/AdminCard";

interface MonthlySales {
  month: string;
  year: number;
  total: number;
  orderCount: number;
}

interface ProductPerformance {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

interface AnalyticsData {
  lifetimeSales: number;
  monthlySales: MonthlySales[];
  productPerformance: ProductPerformance[];
  totalOrders: number;
  activeOrders: number;
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          setError("Not authenticated");
          return;
        }

        const token = session.data.session.access_token;
        const response = await fetch("/api/admin/analytics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err: any) {
        console.error("Analytics fetch error:", err);
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <p>Loading analytics...</p>;
  }

  if (error) {
    return <p style={{ color: "#ef4444" }}>Error: {error}</p>;
  }

  if (!data) {
    return <p>No data available</p>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div>
      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <AdminCard>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
              Lifetime Sales
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#22c55e" }}>
              {formatCurrency(data.lifetimeSales)}
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
              Total Orders
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#3b82f6" }}>
              {data.totalOrders}
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
              {data.activeOrders} active
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
              Average Order Value
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#8b5cf6" }}>
              {data.activeOrders > 0
                ? formatCurrency(data.lifetimeSales / data.activeOrders)
                : formatCurrency(0)}
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Monthly Sales */}
      <AdminCard maxWidth={900} style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20 }}>
          Monthly Sales
        </h2>
        {data.monthlySales.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No sales data available</p>
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
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>
                    Month
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600 }}>
                    Orders
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600 }}>
                    Revenue
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600 }}>
                    Avg Order Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.monthlySales.map((month, idx) => (
                  <tr
                    key={`${month.year}-${month.month}`}
                    style={{
                      borderBottom: idx < data.monthlySales.length - 1 ? "1px solid #f3f4f6" : "none",
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
                    <td style={{ textAlign: "right", padding: "12px 8px", opacity: 0.7 }}>
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

      {/* Product Performance */}
      <AdminCard maxWidth={900}>
        <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20 }}>
          Product Performance
        </h2>
        {data.productPerformance.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No product sales data available</p>
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
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>
                    Product Name
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600 }}>
                    Quantity Sold
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600 }}>
                    Revenue
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600 }}>
                    Orders
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600 }}>
                    Avg Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.productPerformance.map((product, idx) => (
                  <tr
                    key={product.name}
                    style={{
                      borderBottom: idx < data.productPerformance.length - 1 ? "1px solid #f3f4f6" : "none",
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
                    <td style={{ textAlign: "right", padding: "12px 8px", opacity: 0.7 }}>
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
    </div>
  );
}

