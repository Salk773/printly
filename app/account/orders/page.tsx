"use client";

import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Order {
  id: string;
  order_number: string | null;
  items: Array<{ name: string; price: number; quantity: number }>;
  total: number;
  status: string;
  created_at: string;
  shipping_cost?: number;
  discount_amount?: number;
}

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error loading orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#22c55e";
      case "processing":
        return "#3b82f6";
      case "paid":
        return "#3b82f6";
      case "cancelled":
        return "#ef4444";
      case "refunded":
        return "#8b5cf6";
      default:
        return "#f59e0b";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "completed":
        return "rgba(34, 197, 94, 0.1)";
      case "processing":
        return "rgba(59, 130, 246, 0.1)";
      case "paid":
        return "rgba(59, 130, 246, 0.1)";
      case "cancelled":
        return "rgba(239, 68, 68, 0.1)";
      case "refunded":
        return "rgba(139, 92, 246, 0.1)";
      default:
        return "rgba(245, 158, 11, 0.1)";
    }
  };

  if (loading || loadingOrders) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0a0f1f",
          color: "#e5e7eb",
          padding: "40px 20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0f1f",
        color: "#e5e7eb",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Link
          href="/account"
          style={{
            color: "#9ca3af",
            fontSize: "0.9rem",
            textDecoration: "none",
            marginBottom: 20,
            display: "inline-block",
          }}
        >
          ← Back to Account
        </Link>

        <h1 style={{ fontSize: "2rem", marginBottom: 10, fontWeight: 700 }}>
          Order History
        </h1>
        <p style={{ color: "#9ca3af", marginBottom: 30 }}>
          View all your past orders and track their status.
        </p>

        {orders.length === 0 ? (
          <div
            style={{
              padding: 40,
              borderRadius: 20,
              background: "#0f172a",
              border: "1px dashed rgba(148,163,184,0.4)",
              textAlign: "center",
            }}
          >
            <p style={{ marginBottom: 16, color: "#9ca3af" }}>
              You haven't placed any orders yet.
            </p>
            <Link
              href="/products"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #c084fc, #a855f7)",
                color: "#020617",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {orders.map((order) => {
              const subtotal = order.items.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
              );
              const finalTotal =
                subtotal + (order.shipping_cost || 0) - (order.discount_amount || 0);

              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  style={{
                    background: "#0f172a",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: 16,
                    padding: 20,
                    textDecoration: "none",
                    color: "inherit",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px rgba(0,0,0,0.45)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 16,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                          Order {order.order_number || order.id.slice(0, 8)}
                        </h2>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 999,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: getStatusBg(order.status),
                            color: getStatusColor(order.status),
                          }}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </div>
                      <p
                        style={{
                          color: "#9ca3af",
                          fontSize: "0.85rem",
                          marginBottom: 8,
                        }}
                      >
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""} • {finalTotal.toFixed(2)} AED
                      </p>
                    </div>
                    <div
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        color: "#c084fc",
                      }}
                    >
                      {finalTotal.toFixed(2)} AED
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

