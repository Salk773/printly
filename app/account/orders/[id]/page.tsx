"use client";

import { useAuth } from "@/context/AuthProvider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
  id?: string;
}

interface Order {
  id: string;
  order_number: string | null;
  guest_name: string | null;
  guest_email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
  notes: string | null;
  shipping_cost?: number;
  discount_amount?: number;
  coupon_code?: string | null;
}

export default function OrderDetailsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && orderId) {
      loadOrder();
    }
  }, [user, orderId]);

  const loadOrder = async () => {
    if (!user || !orderId) return;

    setLoadingOrder(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error("Order not found");
        router.push("/account/orders");
        return;
      }
      setOrder(data);

      // Fetch product images for items that don't have images
      const itemsNeedingImages = data.items.filter((item: OrderItem) => !item.image && item.id);
      if (itemsNeedingImages.length > 0) {
        const productIds = itemsNeedingImages.map((item: OrderItem) => item.id).filter(Boolean);
        const { data: products } = await supabase
          .from("products")
          .select("id, image_main")
          .in("id", productIds);

        if (products) {
          const imageMap: Record<string, string> = {};
          products.forEach((p: any) => {
            if (p.image_main) imageMap[p.id] = p.image_main;
          });
          setProductImages(imageMap);
        }
      }
    } catch (error: any) {
      console.error("Error loading order:", error);
      toast.error("Failed to load order details");
      router.push("/account/orders");
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleCancel = async () => {
    if (!order || cancelling) return;

    if (
      order.status !== "pending" &&
      order.status !== "paid"
    ) {
      toast.error("This order cannot be cancelled");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to cancel this order? This action cannot be undone."
      )
    ) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to cancel order");
      }

      toast.success("Order cancelled successfully");
      loadOrder(); // Reload order to get updated status
    } catch (error: any) {
      console.error("Cancel error:", error);
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
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

  if (loading || loadingOrder) {
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

  if (!user || !order) {
    return null;
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const finalTotal =
    subtotal + (order.shipping_cost || 0) - (order.discount_amount || 0);

  const canCancel =
    order.status === "pending" || order.status === "paid";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0f1f",
        color: "#e5e7eb",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link
          href="/account/orders"
          style={{
            color: "#9ca3af",
            fontSize: "0.9rem",
            textDecoration: "none",
            marginBottom: 20,
            display: "inline-block",
          }}
        >
          ← Back to Orders
        </Link>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 30,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: 10, fontWeight: 700 }}>
              Order {order.order_number || order.id.slice(0, 8)}
            </h1>
            <p style={{ color: "#9ca3af" }}>
              Placed on{" "}
              {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: "0.85rem",
              fontWeight: 600,
              background: getStatusBg(order.status),
              color: getStatusColor(order.status),
            }}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {/* Order Items */}
        <div
          style={{
            background: "#0f172a",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: "1.2rem", marginBottom: 20 }}>Order Items</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {order.items.map((item, idx) => {
              // Try to get image from order item, fetched product image, or placeholder
              const itemImage = item.image || productImages[item.id || ""] || "/placeholder-product.png";
              
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    paddingBottom: 16,
                    borderBottom:
                      idx < order.items.length - 1
                        ? "1px solid rgba(148,163,184,0.1)"
                        : "none",
                  }}
                >
                  <img
                    src={itemImage}
                    alt={item.name}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      objectFit: "cover",
                      border: "1px solid rgba(148,163,184,0.15)",
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>
                      {item.name}
                    </p>
                    <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: "1rem" }}>
                      {(item.price * item.quantity).toFixed(2)} AED
                    </p>
                    <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                      {item.price.toFixed(2)} AED each
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping Address */}
        <div
          style={{
            background: "#0f172a",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: "1.2rem", marginBottom: 16 }}>
            Shipping Address
          </h2>
          <div style={{ color: "#9ca3af", lineHeight: 1.8 }}>
            <p>{order.guest_name || "N/A"}</p>
            <p>{order.address_line_1}</p>
            {order.address_line_2 && <p>{order.address_line_2}</p>}
            <p>
              {order.city}, {order.state} {order.postal_code || ""}
            </p>
            {order.phone && <p>Phone: {order.phone}</p>}
          </div>
        </div>

        {/* Order Summary */}
        <div
          style={{
            background: "#0f172a",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: "1.2rem", marginBottom: 20 }}>
            Order Summary
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#9ca3af",
              }}
            >
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)} AED</span>
            </div>
            {order.shipping_cost && order.shipping_cost > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#9ca3af",
                }}
              >
                <span>Shipping</span>
                <span>{order.shipping_cost.toFixed(2)} AED</span>
              </div>
            )}
            {order.discount_amount && order.discount_amount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#22c55e",
                }}
              >
                <span>
                  Discount {order.coupon_code && `(${order.coupon_code})`}
                </span>
                <span>-{order.discount_amount.toFixed(2)} AED</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.2rem",
                fontWeight: 700,
                paddingTop: 12,
                borderTop: "1px solid rgba(148,163,184,0.2)",
              }}
            >
              <span>Total</span>
              <span style={{ color: "#c084fc" }}>
                {finalTotal.toFixed(2)} AED
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div
            style={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Notes</h2>
            <p style={{ color: "#9ca3af" }}>{order.notes}</p>
          </div>
        )}

        {/* Cancel Button */}
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            style={{
              padding: "12px 24px",
              borderRadius: 999,
              border: "1px solid #ef4444",
              background: "transparent",
              color: "#ef4444",
              fontWeight: 600,
              cursor: cancelling ? "wait" : "pointer",
              fontSize: "0.95rem",
            }}
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        )}
      </div>
    </main>
  );
}

