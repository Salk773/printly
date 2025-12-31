"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { ADMIN_EMAILS } from "@/lib/adminEmails";

import AdminImageUpload from "@/components/AdminImageUpload";
import AdminHomepageImageUpload from "@/components/AdminHomepageImageUpload";
import EditProductModal from "@/components/EditProductModal";

/* ================= TYPES ================= */

type Category = { id: string; name: string };

type Product = {
  id: string;
  name: string;
  price: number;
  image_main: string;
  images: string[] | null;
  category_id: string | null;
  active: boolean;
};

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
  notes: string | null;
};

/* ================= PAGE ================= */

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [tab, setTab] = useState<"products" | "categories" | "homepage" | "orders">("products");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  /* ---------- AUTH ---------- */
  useEffect(() => {
    if (loading) return;
    if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
      router.replace("/");
    }
  }, [user, loading, router]);

  /* ---------- LOAD DATA ---------- */
  const loadData = useCallback(async () => {
    setLoadingData(true);

    const [{ data: cats }, { data: prods }, { data: ordersData }] =
      await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase
          .from("products")
          .select("id,name,price,image_main,images,category_id,active")
          .order("name"),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
      ]);

    setCategories(cats || []);
    setProducts(prods || []);
    setOrders((ordersData as Order[]) || []);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---------- UI ---------- */

  return (
    <div className="admin-container">
      <h1>Admin Panel</h1>

      {/* TABS */}
      <div className="tabs">
        {["products", "categories", "homepage", "orders"].map((t) => (
          <button
            key={t}
            className={tab === t ? "tab active" : "tab"}
            onClick={() => setTab(t as any)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loadingData && <p>Loading…</p>}

      {/* PRODUCTS */}
      {tab === "products" && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="cell-product">
                  {p.image_main && <img src={p.image_main} />}
                  {p.name}
                </td>
                <td>${p.price}</td>
                <td>
                  <span className={p.active ? "badge green" : "badge red"}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button onClick={() => setEditingProduct(p)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* CATEGORIES */}
      {tab === "categories" && (
        <div className="card">
          <div className="row">
            <input
              placeholder="New category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button
              onClick={async () => {
                await supabase.from("categories").insert({ name: newCategory });
                setNewCategory("");
                loadData();
              }}
            >
              Add
            </button>
          </div>
          {categories.map((c) => (
            <div key={c.id} className="row space-between">
              <strong>{c.name}</strong>
              <button
                onClick={async () => {
                  await supabase.from("categories").delete().eq("id", c.id);
                  loadData();
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* HOMEPAGE */}
      {tab === "homepage" && (
        <div className="card">
          <AdminHomepageImageUpload onUploaded={loadData} />
        </div>
      )}

      {/* ORDERS */}
      {tab === "orders" && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  No orders found
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="mono">{o.id.slice(0, 8)}</td>
                <td>
                  {o.guest_name}
                  <br />
                  <small>{o.guest_email}</small>
                </td>
                <td>{o.items.length}</td>
                <td>${o.total}</td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) =>
                      supabase.from("orders").update({ status: e.target.value }).eq("id", o.id)
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
