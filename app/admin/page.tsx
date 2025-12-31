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
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
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

    if (!ADMIN_EMAILS.includes(user.email ?? "")) {
      router.replace("/");
      return;
    }

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

  /* ---------- CATEGORY ---------- */
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await supabase.from("categories").insert({
      name: newCategory,
      slug: newCategory.toLowerCase().replace(/\s+/g, "-"),
    });
    setNewCategory("");
    loadData();
  };

  const saveCategoryRename = async (id: string) => {
    await supabase
      .from("categories")
      .update({ name: editingCategoryName })
      .eq("id", id);
    setEditingCategoryId(null);
    setEditingCategoryName("");
    loadData();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadData();
  };

  /* ---------- PRODUCT ---------- */
  const addProduct = async () => {
    await supabase.from("products").insert({
      name: newProduct.name,
      description: newProduct.description,
      price: Number(newProduct.price),
      image_main: newProduct.image_main,
      images: newProduct.images,
      category_id: newProduct.category_id || null,
      active: true,
    });
    setNewProduct({
      name: "",
      description: "",
      price: "",
      image_main: "",
      images: [],
      category_id: "",
    });
    loadData();
  };

  const toggleActive = async (p: Product) => {
    await supabase
      .from("products")
      .update({ active: !p.active })
      .eq("id", p.id);
    loadData();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete product?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadData();
  };

  /* ---------- ORDERS ---------- */
  const updateOrderStatus = async (order: Order, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", order.id);
    loadData();
  };

  if (!adminChecked) return <p>Checking admin access…</p>;

  /* ================= UI ================= */

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
            <ul>
              {viewingOrder.items.map((i, idx) => (
                <li key={idx}>
                  {i.name} × {i.quantity}
                </li>
              ))}
            </ul>
            <button onClick={() => setViewingOrder(null)}>Close</button>
          </div>
        </div>
      )}

      <h1>Admin Panel</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setTab("products")}>Products</button>
        <button onClick={() => setTab("categories")}>Categories</button>
        <button onClick={() => setTab("homepage")}>Homepage</button>
        <button onClick={() => setTab("orders")}>Orders</button>
      </div>

      {loadingData && <p>Loading…</p>}

      {/* PRODUCTS */}
      {tab === "products" &&
        products.map((p) => (
          <div key={p.id}>
            <strong>{p.name}</strong>
            <button onClick={() => toggleActive(p)}>
              {p.active ? "Active" : "Inactive"}
            </button>
            <button onClick={() => setEditingProduct(p)}>Edit</button>
            <button onClick={() => deleteProduct(p.id)}>Delete</button>
          </div>
        ))}

      {/* CATEGORIES */}
      {tab === "categories" && (
        <>
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button onClick={addCategory}>Add</button>
          {categories.map((c) => (
            <div key={c.id}>
              {c.name}
              <button onClick={() => deleteCategory(c.id)}>Delete</button>
            </div>
          ))}
        </>
      )}

      {/* HOMEPAGE */}
      {tab === "homepage" && (
        <>
          <AdminHomepageImageUpload onUploaded={loadData} />
          {homepageImages.map((url) => (
            <img key={url} src={url} width={120} />
          ))}
        </>
      )}

      {/* ORDERS */}
      {tab === "orders" &&
        orders.map((o) => (
          <div key={o.id}>
            {o.guest_email} — ${o.total}
            <select
              value={o.status}
              onChange={(e) => updateOrderStatus(o, e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="completed">Completed</option>
            </select>
            <button onClick={() => setViewingOrder(o)}>View</button>
          </div>
        ))}
    </div>
  );
}
