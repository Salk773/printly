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
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image_main: "",
    images: [] as string[],
    category_id: "",
  });

  // ------------------ AUTH GUARD ------------------
  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/auth/login");
    else if (profile?.role !== "admin") router.push("/");
  }, [user, profile, loading, router]);

  // ------------------ LOAD DATA ------------------
  const loadData = async () => {
    setLoadingData(true);

    const [{ data: cats }, { data: prods, error }] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("products")
        .select("id,name,description,price,image_main,images,category_id,active")
        .order("name"),
    ]);

    if (error) console.error(error);

    setCategories(cats || []);
    setProducts(prods || []);
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
        images: newProduct.images,
        category_id: newProduct.category_id,
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

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
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

      {loadingData && <p>Loading…</p>}

      {/* ---------------- PRODUCTS ---------------- */}
      {tab === "products" && (
        <>
          {/* ADD PRODUCT */}
          <div className="card-soft" style={{ padding: 14, marginBottom: 16 }}>
            <h2>Add product</h2>

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
              type="number"
              placeholder="Price"
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

            <AdminImageUpload
              onUploaded={(url) =>
                setNewProduct({ ...newProduct, image_main: url })
              }
            />

            {/* GALLERY UPLOAD */}
            <AdminImageUpload
              onUploaded={(url) =>
                setNewProduct({
                  ...newProduct,
                  images: [...newProduct.images, url],
                })
              }
            />

            <textarea
              className="textarea"
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
            />

            <button className="btn-primary" onClick={addProduct}>
              Save product
            </button>
          </div>

          {/* LIST */}
          {products.map((p) => (
            <div key={p.id} className="card-soft" style={{ padding: 10 }}>
              <strong>{p.name}</strong>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  className="btn-ghost"
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
        </>
      )}

      {/* ---------------- CATEGORIES ---------------- */}
      {tab === "categories" && (
        <>
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
            <div key={c.id} className="card-soft" style={{ padding: 10 }}>
              {c.name}
              <button
                className="btn-danger"
                onClick={() => deleteCategory(c.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
