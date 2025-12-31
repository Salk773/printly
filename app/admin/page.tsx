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

type Order = {
  id: string;
  user_email: string | null;
  total: number | null;
  status: string | null;
  created_at: string | null;
  items: any[] | null;
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
  const [homepageImages, setHomepageImages] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
      { data: ords },
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
    setOrders(ords || []);

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

  /* ---------- HELPERS ---------- */

  const toggleActive = async (p: Product) => {
    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x))
    );
    await supabase
      .from("products")
      .update({ active: !p.active })
      .eq("id", p.id);
  };

  const updateOrderStatus = async (id: string, status: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    await supabase.from("orders").update({ status }).eq("id", id);
  };

  /* ---------- RENDER ---------- */
  if (!adminChecked) return <p>Checking admin access…</p>;
  if (!isAdmin) return null;

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

      <h1>Admin Panel</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setTab("products")}>Products</button>
        <button onClick={() => setTab("categories")}>Categories</button>
        <button onClick={() => setTab("homepage")}>Homepage</button>
        <button onClick={() => setTab("orders")}>Orders</button>
      </div>

      {/* PRODUCTS */}
      {tab === "products" &&
        products.map((p) => (
          <div key={p.id}>
            <strong>{p.name}</strong>
            <button onClick={() => toggleActive(p)}>
              {p.active ? "Active" : "Inactive"}
            </button>
            <button onClick={() => setEditingProduct(p)}>Edit</button>
          </div>
        ))}

      {/* CATEGORIES */}
      {tab === "categories" &&
        categories.map((c) => (
          <div key={c.id}>
            <strong>{c.name}</strong>
          </div>
        ))}

      {/* HOMEPAGE */}
      {tab === "homepage" && (
        <>
          <AdminHomepageImageUpload onUploaded={loadData} />
          {homepageImages.map((u) => (
            <img key={u} src={u} width={120} />
          ))}
        </>
      )}

      {/* ORDERS */}
      {tab === "orders" &&
        orders.map((o) => (
          <div key={o.id}>
            <strong>{o.user_email || "Guest"}</strong>
            <select
              value={o.status || "pending"}
              onChange={(e) =>
                updateOrderStatus(o.id, e.target.value)
              }
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        ))}
    </div>
  );
}
