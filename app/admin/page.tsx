"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { createClient } from "@supabase/supabase-js";

import AdminImageUpload from "@/components/AdminImageUpload";
import EditProductModal from "@/components/EditProductModal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ------------------ TYPES ------------------
type Category = { id: string; name: string };

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_main: string;
  category_id: string | null;
  active: boolean;
};

type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

type Order = {
  id: string;
  created_at: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  items: any[];
  total: number;
  status: OrderStatus;
  notes: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [tab, setTab] = useState<"products" | "categories" | "orders">(
    "products"
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newCategory, setNewCategory] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image_main: "",
    category_id: "",
  });

  // ------------------ PROTECT ADMIN ------------------
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (profile?.role !== "admin") {
      router.push("/");
    }
  }, [user, profile, loading, router]);

  // ------------------ LOAD DATA ------------------
  const loadData = async () => {
    setLoadingData(true);

    const [{ data: cats }, { data: prods }, { data: ords }] =
      await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("products").select("*").order("name"),
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

    setCategories(cats || []);
    setProducts(prods || []);
    setOrders(ords || []);
    setLoadingData(false);
  };

  useEffect(() => {
    if (user && profile?.role === "admin") loadData();
  }, [user, profile]);

  // ------------------ ORDER STATUS UPDATE ------------------
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    // Optimistic UI
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      alert("Failed to update order status");
      loadData();
    }
  };

  // ------------------ UI ------------------
  if (!user || profile?.role !== "admin") {
    return <p style={{ marginTop: 40 }}>Checking admin access…</p>;
  }

  return (
    <div style={{ marginTop: 24 }}>
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSaved={loadData}
        />
      )}

      <h1 style={{ fontSize: "1.4rem", marginBottom: 12 }}>Admin Panel</h1>

      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {["products", "categories", "orders"].map((t) => (
          <button
            key={t}
            className="btn-ghost"
            style={{ borderColor: tab === t ? "#c084fc" : undefined }}
            onClick={() => setTab(t as any)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loadingData && <p style={{ color: "#9ca3af" }}>Loading…</p>}

      {/* ------------------ ORDERS TAB ------------------ */}
      {tab === "orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.length === 0 && (
            <p style={{ color: "#9ca3af" }}>No orders yet.</p>
          )}

          {orders.map((o) => (
            <div key={o.id} className="card-soft" style={{ padding: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <strong>Order #{o.id.slice(0, 8)}</strong>

                <select
                  value={o.status}
                  onChange={(e) =>
                    updateOrderStatus(o.id, e.target.value as OrderStatus)
                  }
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "#020617",
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                {new Date(o.created_at).toLocaleString()}
              </div>

              <div style={{ marginTop: 8, fontSize: "0.9rem" }}>
                {o.user_id
                  ? "Registered user"
                  : `${o.guest_name} (${o.guest_email})`}
              </div>

              <ul style={{ marginTop: 8, fontSize: "0.9rem" }}>
                {o.items?.map((i: any, idx: number) => (
                  <li key={idx}>
                    {i.name} × {i.quantity}
                  </li>
                ))}
              </ul>

              {o.notes && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: "0.85rem",
                    color: "#cbd5f5",
                  }}
                >
                  Notes: {o.notes}
                </div>
              )}

              <div style={{ marginTop: 10, fontWeight: 700 }}>
                Total: {o.total.toFixed(2)} AED
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCTS & CATEGORIES stay exactly as before */}
    </div>
  );
}
