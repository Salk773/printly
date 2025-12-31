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

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_main: string;
  images: string[] | null;
  category_id: string | null;
  active: boolean;
};

type OrderItem = {
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  guest_name: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
  notes: string | null;
};

/* ============== CONSTANTS ============== */

const ADMIN_CACHE_KEY = "printly_is_admin";
const MAX_GALLERY = 8;

/* ============== PAGE =================== */

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [tab, setTab] = useState<
    "products" | "categories" | "homepage" | "orders"
  >("products");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const [newCategory, setNewCategory] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image_main: "",
    images: [] as string[],
    category_id: "",
  });

  const [homepageImages, setHomepageImages] = useState<string[]>([]);

  /* ---------- ADMIN CHECK ---------- */
  useEffect(() => {
    if (loading) return;

    if (!user) {
      sessionStorage.removeItem(ADMIN_CACHE_KEY);
      router.replace("/auth/login");
      return;
    }

    const cached = sessionStorage.getItem(ADMIN_CACHE_KEY);
    if (cached === "true") {
      setIsAdmin(true);
      setAdminChecked(true);
      return;
    }

    if (!ADMIN_EMAILS.includes(user.email ?? "")) {
      router.replace("/");
      return;
    }

    sessionStorage.setItem(ADMIN_CACHE_KEY, "true");
    setIsAdmin(true);
    setAdminChecked(true);
  }, [user, loading, router]);

  /* ---------- LOAD DATA ---------- */
  const loadData = useCallback(async () => {
    setLoadingData(true);

    const [
      { data: cats },
      { data: prods },
      { data: gallery },
      { data: ordersData },
    ] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("products")
        .select(
          "id,name,description,price,image_main,images,category_id,active"
        )
        .order("name"),
      supabase.storage.from("uploads").list("home-gallery"),
      supabase.from("orders").select("*").order("created_at", {
        ascending: false,
      }),
    ]);

    setCategories(cats || []);
    setProducts(prods || []);
    setOrders((ordersData as Order[]) || []);

    const urls =
      gallery?.map(
        (f) =>
          supabase.storage
            .from("uploads")
            .getPublicUrl(`home-gallery/${f.name}`).data.publicUrl
      ) || [];

    setHomepageImages(urls);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (isAdmin && adminChecked) loadData();
  }, [isAdmin, adminChecked, loadData]);

  /* ---------- ORDER STATUS ---------- */
  const updateOrderStatus = async (order: Order, status: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status } : o))
    );

    await supabase.from("orders").update({ status }).eq("id", order.id);
  };

  /* ---------- RENDER GATES ---------- */
  if (!adminChecked) return <p>Checking admin access…</p>;
  if (!isAdmin) return null;

  /* ---------- UI ---------- */
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

      {viewingOrder && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Order {viewingOrder.id}</h3>

            <p>
              <strong>Customer:</strong>{" "}
              {viewingOrder.guest_name || "Registered user"}
              <br />
              {viewingOrder.guest_email}
            </p>

            <p>
              <strong>Status:</strong> {viewingOrder.status}
              <br />
              <strong>Created:</strong>{" "}
              {new Date(viewingOrder.created_at).toLocaleString()}
            </p>

            <ul>
              {viewingOrder.items.map((i, idx) => (
                <li key={idx}>
                  {i.name} × {i.quantity} — $
                  {(i.price * i.quantity).toFixed(2)}
                </li>
              ))}
            </ul>

            <strong>Total: ${viewingOrder.total.toFixed(2)}</strong>

            {viewingOrder.notes && (
              <p>
                <strong>Notes:</strong> {viewingOrder.notes}
              </p>
            )}

            <button className="btn-ghost" onClick={() => setViewingOrder(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      <h1>Admin Panel</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button className="btn-ghost" onClick={() => setTab("products")}>
          Products
        </button>
        <button className="btn-ghost" onClick={() => setTab("categories")}>
          Categories
        </button>
        <button className="btn-ghost" onClick={() => setTab("homepage")}>
          Homepage
        </button>
        <button className="btn-ghost" onClick={() => setTab("orders")}>
          Orders
        </button>
      </div>

      {loadingData && <p>Loading…</p>}

      {/* ORDERS */}
      {tab === "orders" && (
        <div style={{ maxWidth: 900 }}>
          {orders.map((o) => (
            <div
              key={o.id}
              className="card-soft"
              style={{
                padding: 14,
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div>
                <strong>{o.guest_name || "Registered user"}</strong>
                <div style={{ fontSize: 12 }}>{o.guest_email}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{o.id}</div>
              </div>

              <div>{o.items.length} items</div>
              <div>${o.total.toFixed(2)}</div>
              <div>{new Date(o.created_at).toLocaleString()}</div>

              <select
                className="select"
                value={o.status}
                onChange={(e) => updateOrderStatus(o, e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                className="btn-ghost"
                onClick={() => setViewingOrder(o)}
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
