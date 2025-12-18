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
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image_main: "",
    images: [] as string[],
    category_id: "",
  });

  /* AUTH */
  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/auth/login");
    else if (profile?.role !== "admin") router.push("/");
  }, [user, profile, loading, router]);

  /* LOAD */
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
    if (user && profile?.role === "admin" && products.length === 0) {
      loadData();
    }
  }, [user, profile, products.length, loadData]);

  /* PRODUCT */
  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image_main) {
      alert("Missing required fields");
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

  /* UI */
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

      {tab === "products" && (
        <>
          <div className="card-soft" style={{ padding: 14, marginBottom: 16 }}>
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

            {/* MAIN IMAGE */}
            <AdminImageUpload
              onUploaded={(url) =>
                setNewProduct((p) => ({ ...p, image_main: url }))
              }
            />

            {/* ✅ MAIN IMAGE PREVIEW (FIX) */}
            {newProduct.image_main && (
              <img
                src={newProduct.image_main}
                style={{
                  width: 140,
                  marginTop: 8,
                  borderRadius: 8,
                  border: "1px solid #334155",
                }}
              />
            )}

            {/* GALLERY */}
            <AdminImageUpload
              onUploaded={(url) =>
                setNewProduct((p) => ({
                  ...p,
                  images: [...p.images, url],
                }))
              }
            />

            {/* ✅ GALLERY PREVIEW (FIX) */}
            {newProduct.images.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 8,
                  flexWrap: "wrap",
                }}
              >
                {newProduct.images.map((url) => (
                  <img
                    key={url}
                    src={url}
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid #334155",
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
        </>
      )}
    </div>
  );
}
