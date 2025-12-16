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

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [tab, setTab] = useState<"products" | "categories">("products");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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

  // Protect admin access
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

  const loadData = async () => {
    setLoadingData(true);

    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("products").select("*").order("name"),
    ]);

    setCategories(cats || []);
    setProducts(prods || []);
    setLoadingData(false);
  };

  useEffect(() => {
    if (user && profile?.role === "admin") loadData();
  }, [user, profile]);

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

    if (error) {
      console.error(error);
      loadData();
    }
  };

  if (!user || profile?.role !== "admin") {
    return <p style={{ marginTop: 40 }}>Checking admin access...</p>;
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

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <button
          className="btn-ghost"
          style={{ borderColor: tab === "products" ? "#c084fc" : undefined }}
          onClick={() => setTab("products")}
        >
          Products
        </button>

        <button
          className="btn-ghost"
          style={{ borderColor: tab === "categories" ? "#c084fc" : undefined }}
          onClick={() => setTab("categories")}
        >
          Categories
        </button>
      </div>

      {loadingData && <p style={{ color: "#9ca3af" }}>Loading…</p>}

      {tab === "categories" && (
        <>
          <div className="card-soft" style={{ padding: 14, marginBottom: 16 }}>
            <h2>Add category</h2>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <input
                className="input"
                placeholder="Name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button className="btn-primary" onClick={addCategory}>
                Add
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {categories.map((c) => (
              <div
                key={c.id}
                className="card-soft"
                style={{
                  padding: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{c.name}</span>
                <button
                  className="btn-danger"
                  onClick={() => deleteCategory(c.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "products" && (
        <>
          <div className="card-soft" style={{ padding: 14, marginBottom: 16 }}>
            <h2 style={{ fontSize: "1rem" }}>Add product</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                gap: 10,
                marginTop: 8,
              }}
            >
              <input
                className="input"
                placeholder="Name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />

              <input
                className="input"
                placeholder="Price (AED)"
                type="number"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
              />

              <select
                className="select"
                value={newProduct.category_id}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category_id: e.target.value })
                }
              >
                <option value="">Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <AdminImageUpload
                onUploaded={(url) =>
                  setNewProduct({ ...newProduct, image_main: url })
                }
              />

              {newProduct.image_main && (
                <img
                  src={newProduct.image_main}
                  style={{
                    width: 120,
                    marginTop: 8,
                    borderRadius: 8,
                    border: "1px solid #333",
                  }}
                />
              )}
            </div>

            <textarea
              className="textarea"
              placeholder="Short description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
              style={{ marginTop: 8, minHeight: 70 }}
            />

            <button
              className="btn-primary"
              style={{ marginTop: 10 }}
              onClick={addProduct}
            >
              Save product
            </button>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
            {products.map((p) => (
              <div
                key={p.id}
                className="card-soft"
                style={{
                  padding: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                    {p.price.toFixed(2)} AED
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn-ghost"
                    style={{
                      background: p.active ? "#22c55e20" : "#f8717120",
                      color: p.active ? "#22c55e" : "#f87171",
                      border: `1px solid ${p.active ? "#22c55e" : "#f87171"}`,
                      borderRadius: 6,
                      fontWeight: 600,
                      padding: "4px 10px",
                    }}
                    onClick={() => toggleActive(p)}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </button>

                  <button
                    className="btn-ghost"
                    onClick={() => setEditingProduct(p)}
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
