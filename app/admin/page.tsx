"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { createClient } from "@supabase/supabase-js";

import AdminImageUpload from "@/components/AdminImageUpload";
import EditProductModal from "@/components/EditProductModal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Category = { id: string; name: string };

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

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [tab, setTab] = useState<"products" | "categories">("products");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/auth/login");
    else if (profile?.role !== "admin") router.push("/");
  }, [user, profile, loading, router]);

  /* ---------------- LOAD ---------------- */
  const loadData = useCallback(async () => {
    setLoadingData(true);

    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("products")
        .select(
          "id,name,description,price,image_main,images,category_id,active"
        )
        .order("name"),
    ]);

    setCategories(cats || []);
    setProducts(prods || []);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (user && profile?.role === "admin") {
      loadData();
    }
  }, [user, profile, loadData]);

  /* ---------------- CATEGORY ---------------- */
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

  /* ---------------- PRODUCT ---------------- */
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
        images: newProduct.images,
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

  if (!user || profile?.role !== "admin") {
    return <p style={{ marginTop: 40 }}>Checking admin access…</p>;
  }

  /* ---------------- UI ---------------- */
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

      <h1 style={{ fontSize: "1.4rem", marginBottom: 12 }}>
        Admin Panel
      </h1>

      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          className="btn-ghost"
          style={{
            borderColor: tab === "products" ? "#c084fc" : undefined,
          }}
          onClick={() => setTab("products")}
        >
          Products
        </button>
        <button
          className="btn-ghost"
          style={{
            borderColor: tab === "categories" ? "#c084fc" : undefined,
          }}
          onClick={() => setTab("categories")}
        >
          Categories
        </button>
      </div>

      {loadingData && <p>Loading…</p>}

      {/* ---------------- CATEGORIES ---------------- */}
      {tab === "categories" && (
        <div style={{ maxWidth: 520 }}>
          <h2>Categories</h2>

          <input
            className="input"
            placeholder="New category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button
            className="btn-primary"
            style={{ marginTop: 8 }}
            onClick={addCategory}
          >
            Add category
          </button>

          {categories.map((c) => (
            <div
              key={c.id}
              className="card-soft"
              style={{
                padding: 12,
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {editingCategoryId === c.id ? (
                <>
                  <input
                    className="input"
                    autoFocus
                    value={editingCategoryName}
                    onChange={(e) =>
                      setEditingCategoryName(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveCategoryRename(c.id);
                      if (e.key === "Escape") {
                        setEditingCategoryId(null);
                        setEditingCategoryName("");
                      }
                    }}
                  />
                  <button
                    className="btn-primary"
                    onClick={() => saveCategoryRename(c.id)}
                  >
                    Save
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setEditingCategoryName("");
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <strong style={{ flex: 1 }}>{c.name}</strong>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setEditingCategoryId(c.id);
                      setEditingCategoryName(c.name);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => deleteCategory(c.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
