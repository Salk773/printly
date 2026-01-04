"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { ADMIN_EMAILS } from "@/lib/adminEmails";

import EditProductModal from "@/components/EditProductModal";
import AdminTabs from "@/components/admin/AdminTabs";
import AdminHomepage from "@/components/admin/AdminHomepage";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminOrders from "@/components/admin/AdminOrders";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";

/* ================= TYPES ================= */

export type Category = { id: string; name: string };

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_main: string;
  images: string[] | null;
  category_id: string | null;
  active: boolean;
  featured?: boolean;
};

export type OrderItem = { name: string; price: number; quantity: number };

export type Order = {
  id: string;
  order_number: string | null;
  guest_email: string | null;
  guest_name: string | null;
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
  archived?: boolean;
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
    featured: false,
  });

  /* ---------- ADMIN CHECK ---------- */
  useEffect(() => {
    if (loading) return;

    if (!user) {
      sessionStorage.removeItem(ADMIN_CACHE_KEY);
      router.replace("/auth/login");
      return;
    }

    if (sessionStorage.getItem(ADMIN_CACHE_KEY) === "true") {
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

    const [{ data: cats }, { data: prods }, { data: ords }, gallery] =
      await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("products").select("*").order("name"),
        supabase.from("orders").select("*").order("created_at", {
          ascending: false,
        }),
        supabase.storage.from("uploads").list("home-gallery"),
      ]);

    setCategories(cats || []);
    setProducts(prods || []);
    setOrders((ords as Order[]) || []);

    const urls =
      gallery.data?.map(
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

  /* ---------- PRODUCT HELPERS ---------- */
  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image_main) return;

    await supabase.from("products").insert([
      {
        ...newProduct,
        price: Number(newProduct.price),
        images: newProduct.images.slice(0, MAX_GALLERY),
        active: true,
        featured: newProduct.featured || false,
      },
    ]);

    setNewProduct({
      name: "",
      description: "",
      price: "",
      image_main: "",
      images: [],
      category_id: "",
      featured: false,
    });

    loadData();
  };

  const toggleActive = async (p: Product) => {
    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x))
    );

    const { error } = await supabase
      .from("products")
      .update({ active: !p.active })
      .eq("id", p.id);

    if (error) loadData();
  };

  /* ---------- RENDER GATES ---------- */
  if (!adminChecked) return <p>Checking admin access…</p>;
  if (!isAdmin) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <AdminTabs setTab={setTab} />

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSaved={loadData}
        />
      )}

      {tab === "homepage" && (
        <AdminHomepage
          images={homepageImages}
          onDelete={async (url) => {
            const path = url.split("/uploads/")[1];
            if (path) {
              await supabase.storage.from("uploads").remove([path]);
              loadData();
            }
          }}
          onUploaded={loadData}
        />
      )}

      {tab === "products" && (
        <AdminProducts
          products={products}
          categories={categories}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          addProduct={addProduct}
          toggleActive={toggleActive}
          deleteProduct={async (id) => {
            await supabase.from("products").delete().eq("id", id);
            loadData();
          }}
          onEdit={setEditingProduct}
        />
      )}

      {tab === "categories" && (
        <AdminCategories
          categories={categories}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          editingCategoryId={editingCategoryId}
          editingCategoryName={editingCategoryName}
          setEditingCategoryName={setEditingCategoryName}
          onAdd={async () => {
            await supabase.from("categories").insert([
              {
                name: newCategory,
                slug: newCategory.toLowerCase().replace(/\s+/g, "-"),
              },
            ]);
            setNewCategory("");
            loadData();
          }}
          onEdit={(c) => {
            setEditingCategoryId(c.id);
            setEditingCategoryName(c.name);
          }}
          onSave={async (id) => {
            await supabase
              .from("categories")
              .update({
                name: editingCategoryName,
                slug: editingCategoryName.toLowerCase().replace(/\s+/g, "-"),
              })
              .eq("id", id);
            setEditingCategoryId(null);
            setEditingCategoryName("");
            loadData();
          }}
          onDelete={async (id) => {
            await supabase.from("categories").delete().eq("id", id);
            loadData();
          }}
        />
      )}

      {tab === "orders" && (
        <AdminOrders
          orders={orders}
          setOrders={setOrders}
          reload={loadData}
          onView={setViewingOrder}
        />
      )}

      {viewingOrder && (
        <OrderDetailsModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
        />
      )}

      {loadingData && <p>Loading…</p>}
    </div>
  );
}
