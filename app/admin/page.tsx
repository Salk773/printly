"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// ----------------------------
// SUPABASE CLIENT (anon key)
// ----------------------------
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ----------------------------
// TYPES
// ----------------------------
interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_main: string | null;
  category_id: string;
}

// ----------------------------
// MAIN ADMIN PANEL
// ----------------------------
export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const [tab, setTab] = useState<"products" | "categories">("products");

  // PRODUCT STATES
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_main: "",
  });

  // CATEGORY STATES
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");

  // IMAGE UPLOAD
  const [uploading, setUploading] = useState(false);

  // ----------------------------
  // LOGIN
  // ----------------------------
  const handleLogin = () => {
    if (passcode === "printlyadmin123") setUnlocked(true);
    else alert("Wrong passcode");
  };

  // ----------------------------
  // FETCH DATA
  // ----------------------------
  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts(data || []);
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data || []);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // ----------------------------
  // FILE UPLOAD TO SUPABASE
  // ----------------------------
  const uploadImage = async (file: File) => {
    setUploading(true);

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filePath, file);

    if (uploadError) {
      alert("Upload error: " + uploadError.message);
      setUploading(false);
      return null;
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${filePath}`;

    setUploading(false);
    return publicUrl;
  };

  // ----------------------------
  // ADD NEW PRODUCT
  // ----------------------------
  const addProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.category_id ||
      !newProduct.image_main
    ) {
      alert("Fill all fields");
      return;
    }

    const res = await fetch("/api/products", {
      method: "POST",
      body: JSON.stringify({
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        image_main: newProduct.image_main,
        category_id: newProduct.category_id,
      }),
    });

    if (!res.ok) {
      alert("Error adding product");
      return;
    }

    setNewProduct({
      name: "",
      description: "",
      price: "",
      category_id: "",
      image_main: "",
    });

    fetchProducts();
  };

  // ----------------------------
  // DELETE PRODUCT
  // ----------------------------
  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    const res = await fetch("/api/products", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      alert("Delete failed");
      return;
    }

    fetchProducts();
  };

  // ----------------------------
  // EDIT PRODUCT
  // ----------------------------
  const saveEdit = async () => {
    if (!editingProduct) return;

    const res = await fetch("/api/products", {
      method: "PUT",
      body: JSON.stringify(editingProduct),
    });

    if (!res.ok) {
      alert("Error updating product");
      return;
    }

    setEditingProduct(null);
    fetchProducts();
  };

  // ----------------------------
  // ADD CATEGORY
  // ----------------------------
  const addCategory = async () => {
    if (!newCategory.trim()) return;

    const res = await fetch("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: newCategory.trim() }),
    });

    if (!res.ok) {
      alert("Category error");
      return;
    }

    setNewCategory("");
    fetchCategories();
  };

  // ----------------------------
  // DELETE CATEGORY
  // ----------------------------
  const deleteCategory = async (id: string) => {
    if (!confirm("Delete category?")) return;

    await fetch("/api/categories", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

    fetchCategories();
  };

  // ------------------------------------------------
  // UI STARTS HERE
  // ------------------------------------------------
  if (!unlocked) {
    return (
      <main
        style={{
          background: "#0a0a0a",
          color: "white",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <h1>Admin Login</h1>

        <input
          style={{
            marginTop: "10px",
            padding: "10px",
            width: "200px",
            borderRadius: "6px",
          }}
          placeholder="Passcode"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
        />

        <button
          onClick={handleLogin}
          style={{
            marginTop: "15px",
            padding: "10px 20px",
            background: "#c084fc",
            borderRadius: "6px",
            color: "#000",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Enter
        </button>
      </main>
    );
  }

  // ------------------------------------------------
  // FULL ADMIN PANEL
  // ------------------------------------------------
  return (
    <main
      style={{
        background: "#0a0a0a",
        color: "#fff",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>🛠️ Admin Dashboard</h1>

      {/* TABS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <button
          onClick={() => setTab("products")}
          style={{
            background: tab === "products" ? "#c084fc" : "#222",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Products
        </button>

        <button
          onClick={() => setTab("categories")}
          style={{
            background: tab === "categories" ? "#c084fc" : "#222",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Categories
        </button>
      </div>

      {/* ---------------------------- */}
      {/* PRODUCTS TAB */}
      {/* ---------------------------- */}
      {tab === "products" && (
        <>
          <h2>Add Product</h2>

          {/* UPLOAD IMAGE */}
          <input
            type="file"
            accept="image/*"
            style={{ marginTop: "10px" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const url = await uploadImage(file);
              if (url) setNewProduct({ ...newProduct, image_main: url });
            }}
          />

          {newProduct.image_main && (
            <Image
              src={newProduct.image_main}
              alt="preview"
              width={300}
              height={200}
              unoptimized
              style={{
                marginTop: "10px",
                borderRadius: "8px",
                border: "1px solid #333",
              }}
            />
          )}

          {/* PRODUCT FORM */}
          <div style={{ marginTop: "20px" }}>
            <input
              placeholder="Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
            />

            <textarea
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
              style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
            />

            <input
              placeholder="Price"
              type="number"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: e.target.value })
              }
              style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
            />

            <select
              style={{
                padding: "10px",
                width: "100%",
                marginBottom: "10px",
                background: "#111",
                color: "#fff",
              }}
              value={newProduct.category_id}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category_id: e.target.value })
              }
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={addProduct}
              disabled={uploading}
              style={{
                padding: "10px 20px",
                background: "#c084fc",
                borderRadius: "8px",
                color: "#000",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {uploading ? "Uploading..." : "Add Product"}
            </button>
          </div>

          <hr style={{ margin: "40px 0", borderColor: "#333" }} />

          <h2>All Products</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            {products.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#111",
                  padding: "15px",
                  borderRadius: "12px",
                  border: "1px solid #222",
                }}
              >
                {p.image_main && (
                  <Image
                    src={p.image_main}
                    alt={p.name}
                    width={300}
                    height={200}
                    unoptimized
                    style={{
                      borderRadius: "8px",
                      width: "100%",
                      height: "auto",
                      marginBottom: "10px",
                    }}
                  />
                )}

                <h3>{p.name}</h3>
                <p style={{ color: "#aaa" }}>{p.description}</p>
                <p style={{ color: "#c084fc", fontWeight: 600 }}>
                  {p.price} AED
                </p>

                {/* EDIT BUTTON */}
                <button
                  onClick={() => setEditingProduct(p)}
                  style={{
                    marginTop: "10px",
                    padding: "6px 12px",
                    background: "#c084fc",
                    borderRadius: "6px",
                    color: "#000",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Edit
                </button>

                {/* DELETE BUTTON */}
                <button
                  onClick={() => deleteProduct(p.id)}
                  style={{
                    marginTop: "10px",
                    padding: "6px 12px",
                    background: "red",
                    borderRadius: "6px",
                    color: "#fff",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---------------------------- */}
      {/* EDIT POPUP */}
      {/* ---------------------------- */}
      {editingProduct && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "#111",
              padding: "30px",
              borderRadius: "12px",
              width: "400px",
            }}
          >
            <h3>Edit Product</h3>

            <input
              value={editingProduct.name}
              onChange={(e) =>
                setEditingProduct({ ...editingProduct, name: e.target.value })
              }
              style={{ padding: "10px", width: "100%", marginTop: "10px" }}
            />

            <textarea
              value={editingProduct.description}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  description: e.target.value,
                })
              }
              style={{ padding: "10px", width: "100%", marginTop: "10px" }}
            />

            <input
              type="number"
              value={editingProduct.price}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  price: Number(e.target.value),
                })
              }
              style={{ padding: "10px", width: "100%", marginTop: "10px" }}
            />

            <button
              onClick={saveEdit}
              style={{
                padding: "10px 20px",
                background: "#c084fc",
                color: "#000",
                borderRadius: "8px",
                marginTop: "20px",
                width: "100%",
              }}
            >
              Save
            </button>

            <button
              onClick={() => setEditingProduct(null)}
              style={{
                marginTop: "10px",
                padding: "10px 20px",
                width: "100%",
                background: "#333",
                color: "#fff",
                borderRadius: "6px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------- */}
      {/* CATEGORIES TAB */}
      {/* ---------------------------- */}
      {tab === "categories" && (
        <>
          <h2>Add Category</h2>

          <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
            <input
              placeholder="Category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ padding: "10px", flex: 1 }}
            />

            <button
              onClick={addCategory}
              style={{
                padding: "10px 20px",
                background: "#c084fc",
                color: "#000",
                borderRadius: "6px",
              }}
            >
              Add
            </button>
          </div>

          <ul style={{ marginTop: "30px" }}>
            {categories.map((cat) => (
              <li
                key={cat.id}
                style={{
                  background: "#111",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {cat.name}

                <button
                  onClick={() => deleteCategory(cat.id)}
                  style={{
                    background: "red",
                    color: "#fff",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
