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

type Order = {
  id: string;
  created_at: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  items: any[];
  total: number;
  status: string;
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

  // ------------------ PROTECT ADMIN ACCESS ------------------
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (profile?.role !== "admin") {
      router.push("/");
      return;
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

  // ------------------ CATEGORY ------------------
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const slug = newCategory.toLowerCase().replace(/\s+/g, "-");

    await supabase.from("categories").insert([{ name: newCategory, slug }]);
    setNewCategory("");
    loadData();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadData();
  };

  // ------------------ PRODUCT ------------------
  const addProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.image_main ||
      !newProduct.category_id
    ) {
      alert("Fill all required fields");
      return;
    }

    await supabase.from("products").insert([
      {
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        image_main: newProduct.image_main,
        category_id: newProduct.category_id,
        active: true,
      },
    ]);

    setNewProduct({
      name: "",
      description: "",
      price: "",
      image_main: "",
      category_id: "",
    });

    loadData();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadData();
  };

  const toggleActive = async (product: Product) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, active: !product.active } : p
      )
    );

    const { error } = await supabase
      .from("products")
      .update({ active: !product.active })
      .eq("id", product.id);

    if (error) loadData();
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.length === 0 && (
            <p style={{ color: "#9ca3af" }}>No orders yet.</p>
          )}

          {orders.map((o) => (
            <div key={o.id} className="card-soft" style={{ padding: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <strong>Order #{o.id.slice(0, 8)}</strong>
                <span style={{ color: "#c084fc" }}>{o.status}</span>
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

      {/* ------------------ PRODUCTS & CATEGORIES ------------------ */}
      {/* unchanged — exactly your existing logic below */}
      {tab === "categories" && (
        <>
          {/* existing category UI */}
        </>
      )}

      {tab === "products" && (
        <>
          {/* existing product UI */}
        </>
      )}
    </div>
  );
}
