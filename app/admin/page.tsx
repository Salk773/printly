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

/* ============== CONSTANTS ============== */

const ADMIN_CACHE_KEY = "printly_is_admin";
const MAX_GALLERY = 8;

/* ============== PAGE =================== */

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [tab, setTab] = useState<"products" | "categories" | "homepage">(
    "products"
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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

  /* ---------- ADMIN CHECK (ONCE PER SESSION) ---------- */
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

    const allowed = ADMIN_EMAILS.includes(user.email ?? "");
    if (!allowed) {
      sessionStorage.removeItem(ADMIN_CACHE_KEY);
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
      { data: cats, error: catsErr },
      { data: prods, error: prodsErr },
      { data: gallery },
    ] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("products")
        .select("id,name,description,price,image_main,images,category_id,active")
        .order("name"),
      supabase.storage.from("uploads").list("home-gallery"),
    ]);

    if (catsErr) console.error(catsErr);
    if (prodsErr) console.error(prodsErr);

    setCategories(cats || []);
    setProducts(prods || []);

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

    await supabase.from("categories").insert([
      {
        name: newCategory,
        slug: newCategory.toLowerCase().replace(/\s+/g, "-"),
      },
    ]);

    setNewCategory("");
    loadData();
  };

  const saveCategoryRename = async (id: string) => {
    if (!editingCategoryName.trim()) return;

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
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadData();
  };

  /* ---------- PRODUCT ---------- */
  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image_main) {
      alert("Fill all required fields");
      return;
    }

    await supabase.from("products").insert([
      {
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        image_main: newProduct.image_main,
        images: newProduct.images.slice(0, MAX_GALLERY),
        category_id: newProduct.category_id || null,
        active: true,
      },
    ]);

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
    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x))
    );

    const { error } = await supabase
      .from("products")
      .update({ active: !p.active })
      .eq("id", p.id);

    if (error) {
      console.error(error);
      loadData();
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadData();
  };

  /* ---------- ADD PRODUCT IMAGE HELPERS ---------- */

  const addNewGalleryImage = (url: string) => {
    setNewProduct((p) => {
      if (p.images.length >= MAX_GALLERY) return p;
      if (p.images.includes(url)) return p;
      return { ...p, images: [...p.images, url] };
    });
  };

  /* ---------- HOMEPAGE IMAGE ---------- */

  const deleteHomepageImage = async (url: string) => {
    if (!confirm("Delete this homepage image?")) return;
    const path = url.split("/uploads/")[1];
    if (!path) return;
    await supabase.storage.from("uploads").remove([path]);
    loadData();
  };

  /* ---------- RENDER GATES ---------- */
  if (!adminChecked) {
    return <p style={{ marginTop: 40 }}>Checking admin access…</p>;
  }

  if (!isAdmin) {
    return null;
  }

  /* ---------- UI ---------- */
  return (
    <div style={{ marginTop: 24 }}>
      {editingProduct && (
        <EditProductModal
          key={editingProduct.id}
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSaved={loadData}
        />
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
      </div>

      {loadingData && <p>Loading…</p>}

      {/* HOMEPAGE */}
      {tab === "homepage" && (
        <div className="card-soft" style={{ padding: 20, maxWidth: 760 }}>
          <h2>Homepage Gallery</h2>

          <AdminHomepageImageUpload onUploaded={loadData} />

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 12,
              flexWrap: "wrap",
            }}
          >
            {homepageImages.map((url) => (
              <div key={url} style={{ position: "relative" }}>
                <img
                  src={url}
                  style={{
                    width: 120,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <button
                  className="btn-danger"
                  style={{ position: "absolute", top: 4, right: 4 }}
                  onClick={() => deleteHomepageImage(url)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      {tab === "products" && (
        <>
          {/* unchanged product UI */}
        </>
      )}

      {/* CATEGORIES */}
      {tab === "categories" && (
        <div style={{ maxWidth: 520 }}>
          {/* unchanged category UI */}
        </div>
      )}
    </div>
  );
}
