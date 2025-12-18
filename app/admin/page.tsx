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

  /* ---------- AUTH GUARD (FIXED) ---------- */
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

  /* ---------- LOAD DATA ---------- */
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
    if (user && profile?.role === "admin") loadData();
  }, [user, profile, loadData]);

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

  const toggleActive = async (p: Product) => {
    setProducts((prev) =>
      prev.map((x) =>
        x.id === p.id ? { ...x, active: !p.active } : x
      )
    );

    await supabase
      .from("products")
      .update({ active: !p.active })
      .eq("id", p.id);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadData();
  };

  if (loading) return <p style={{ marginTop: 40 }}>Checking admin access…</p>;
  if (!user || profile?.role !== "admin") return null;

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
      </div>

      {loadingData && <p>Loading…</p>}

      {/* ---------- PRODUCTS ---------- */}
      {tab === "products" && (
        <>
          <div className="card-soft" style={{ padding: 20, maxWidth: 760 }}>
            <h2>Add product</h2>

            <input
              className="input"
              placeholder="Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct((p) => ({ ...p, name: e.target.value }))
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct((p) => ({ ...p, price: e.target.value }))
              }
            />

            <select
              className="select"
              value={newProduct.category_id}
              onChange={(e) =>
                setNewProduct((p) => ({
                  ...p,
                  category_id: e.target.value,
                }))
              }
            >
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <strong>Main image</strong>
            <AdminImageUpload
              onUploaded={(url) =>
                setNewProduct((p) => ({ ...p, image_main: url }))
              }
            />

            {newProduct.image_main && (
              <img
                src={newProduct.image_main}
                style={{ width: 160, marginTop: 8, borderRadius: 8 }}
              />
            )}

            <strong>Gallery images</strong>
            <AdminImageUpload
              onUploaded={(url) =>
                setNewProduct((p) => ({
                  ...p,
                  images: [...p.images, url],
                }))
              }
            />

            {newProduct.images.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {newProduct.images.map((url) => (
                  <img
                    key={url}
                    src={url}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                ))}
              </div>
            )}

            <textarea
              className="textarea"
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct((p) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
            />

            <button className="btn-primary" onClick={addProduct}>
              Save product
            </button>
          </div>

          {products.map((p) => (
            <div
              key={p.id}
              className="card-soft"
              style={{
                padding: 14,
                marginTop: 10,
                maxWidth: 760,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {p.image_main && (
                <img
                  src={p.image_main}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    objectFit: "cover",
                  }}
                />
              )}

              <strong style={{ flex: 1 }}>{p.name}</strong>

              <button
                className="btn-ghost"
                onClick={() => toggleActive(p)}
                style={{ color: p.active ? "#22c55e" : "#ef4444" }}
              >
                {p.active ? "Active" : "Inactive"}
              </button>

              <button
                className="btn-ghost"
                onClick={() => setEditingProduct({ ...p })}
              >
                Edit
              </button>

              <button
                className="btn-danger"
                onClick={() => deleteProduct(p.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </>
      )}

      {/* ---------- CATEGORIES ---------- */}
      {tab === "categories" && (
        <div style={{ maxWidth: 520 }}>
          <input
            className="input"
            placeholder="New category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button className="btn-primary" onClick={addCategory}>
            Add
          </button>

          {categories.map((c) => (
            <div
              key={c.id}
              className="card-soft"
              style={{ padding: 12, marginTop: 10 }}
            >
              {editingCategoryId === c.id ? (
                <>
                  <input
                    className="input"
                    value={editingCategoryName}
                    onChange={(e) =>
                      setEditingCategoryName(e.target.value)
                    }
                  />
                  <button
                    className="btn-primary"
                    onClick={() => saveCategoryRename(c.id)}
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <strong>{c.name}</strong>
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
