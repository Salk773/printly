// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

const API_CATEGORIES = "/api/categories";
const API_PRODUCTS = "/api/products";

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
  image_main: string;
  category_id: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");

  const PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE;

  const checkPasscode = () => {
    if (passcodeInput === PASSCODE) setAuthorized(true);
    else alert("Wrong passcode.");
  };

  const [tab, setTab] = useState<"products" | "categories">("products");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingEdit, setUploadingEdit] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image_main: "",
    category_id: "",
  });

  const [newCategory, setNewCategory] = useState("");

  const [editing, setEditing] = useState<Product | null>(null);
  const [editingDraft, setEditingDraft] = useState({
    name: "",
    description: "",
    price: "",
    image_main: "",
    category_id: "",
  });

  async function loadCategories() {
    const res = await fetch(API_CATEGORIES);
    const json = await res.json();
    if (json.success) setCategories(json.categories);
  }

  async function loadProducts() {
    const res = await fetch(API_PRODUCTS);
    const json = await res.json();
    if (json.success) setProducts(json.products);
  }

  useEffect(() => {
    if (authorized) {
      loadCategories();
      loadProducts();
    }
  }, [authorized]);

  // --------- IMAGE UPLOAD HELPERS ---------
  async function uploadImage(file: File): Promise<string | null> {
    try {
      setUploading(true);
      const path = `products/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("uploads")
        .upload(path, file);

      if (error) {
        console.error("Upload error:", error.message);
        alert("Error uploading image");
        setUploading(false);
        return null;
      }

      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      setUploading(false);
      return data.publicUrl;
    } catch (e) {
      console.error(e);
      setUploading(false);
      return null;
    }
  }

  async function uploadEditImage(file: File): Promise<string | null> {
    try {
      setUploadingEdit(true);
      const path = `products/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("uploads")
        .upload(path, file);

      if (error) {
        console.error("Upload error:", error.message);
        alert("Error uploading image");
        setUploadingEdit(false);
        return null;
      }

      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      setUploadingEdit(false);
      return data.publicUrl;
    } catch (e) {
      console.error(e);
      setUploadingEdit(false);
      return null;
    }
  }

  // --------- CATEGORY CRUD ---------
  async function addCategory() {
    if (!newCategory.trim()) return alert("Category name required.");

    const res = await fetch(API_CATEGORIES, {
      method: "POST",
      body: JSON.stringify({ name: newCategory }),
    });

    const json = await res.json();

    if (!json.success) return alert(json.message);

    setNewCategory("");
    loadCategories();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete category?")) return;

    const res = await fetch(`${API_CATEGORIES}?id=${id}`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (!json.success) alert(json.message);
    else loadCategories();
  }

  // --------- PRODUCT CRUD ---------
  async function addProduct() {
    const { name, description, price, image_main, category_id } = newProduct;

    if (!name || !price || !image_main || !category_id)
      return alert("Please fill all fields and upload an image");

    setLoading(true);

    const res = await fetch(API_PRODUCTS, {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        price: parseFloat(price),
        image_main,
        category_id,
      }),
    });

    const json = await res.json();

    if (!json.success) alert(json.message);
    else {
      setNewProduct({
        name: "",
        description: "",
        price: "",
        image_main: "",
        category_id: "",
      });
      loadProducts();
    }

    setLoading(false);
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete product?")) return;

    const res = await fetch(`${API_PRODUCTS}?id=${id}`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (!json.success) alert(json.message);
    else loadProducts();
  }

  function openEdit(p: Product) {
    setEditing(p);
    setEditingDraft({
      name: p.name,
      description: p.description || "",
      price: p.price.toString(),
      image_main: p.image_main,
      category_id: p.category_id,
    });
  }

  async function saveEdit() {
    if (!editing) return;

    const { name, description, price, image_main, category_id } =
      editingDraft;

    if (!name || !price || !category_id)
      return alert("Name, price and category are required");

    const res = await fetch(API_PRODUCTS, {
      method: "PATCH",
      body: JSON.stringify({
        id: editing.id,
        name,
        description,
        price: parseFloat(price),
        image_main,
        category_id,
      }),
    });

    const json = await res.json();
    if (!json.success) alert(json.message);
    else {
      setEditing(null);
      loadProducts();
    }
  }

  // --------- RENDER ---------

  if (!authorized) {
    return (
      <main
        style={{
          background: "#0a0a0a",
          color: "#fff",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <h2>Admin Login</h2>
        <input
          type="password"
          placeholder="Enter Admin Passcode"
          value={passcodeInput}
          onChange={(e) => setPasscodeInput(e.target.value)}
          style={{ padding: "10px", width: "240px" }}
        />
        <button
          onClick={checkPasscode}
          style={{
            background: "#c084fc",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Enter
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        background: "#0a0a0a",
        color: "#fff",
        fontFamily: "system-ui",
        padding: "30px",
        minHeight: "100vh",
      }}
    >
      <h1>🛠️ Admin Panel</h1>

      {/* TABS */}
      <div style={{ marginTop: "20px", display: "flex", gap: "15px" }}>
        <button
          onClick={() => setTab("products")}
          style={{
            background: tab === "products" ? "#c084fc" : "#333",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          Products
        </button>

        <button
          onClick={() => setTab("categories")}
          style={{
            background: tab === "categories" ? "#c084fc" : "#333",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          Categories
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {tab === "products" && (
        <>
          <h2 style={{ marginTop: "30px" }}>Add Product</h2>

          <div
            style={{
              background: "#111",
              padding: "20px",
              borderRadius: "12px",
              marginTop: "15px",
            }}
          >
            <div style={{ display: "grid", gap: "10px" }}>
              <input
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
              <input
                placeholder="Price (AED)"
                type="number"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
              />
              <select
                value={newProduct.category_id}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    category_id: e.target.value,
                  })
                }
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Image upload */}
              <div>
                <label style={{ fontSize: "0.85rem" }}>
                  Product Image (upload):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (url) {
                      setNewProduct((prev) => ({
                        ...prev,
                        image_main: url,
                      }));
                    }
                  }}
                />
                {uploading && (
                  <p style={{ fontSize: "0.8rem", color: "#c084fc" }}>
                    Uploading...
                  </p>
                )}
                {newProduct.image_main && (
                  <p style={{ fontSize: "0.8rem", color: "#0f0" }}>
                    Image set ✔
                  </p>
                )}
              </div>

              <textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    description: e.target.value,
                  })
                }
                style={{ minHeight: "80px" }}
              />
            </div>

            <button
              onClick={addProduct}
              disabled={loading}
              style={{
                marginTop: "15px",
                background: "#c084fc",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                color: "#000",
                fontWeight: 700,
              }}
            >
              {loading ? "Adding..." : "Add Product"}
            </button>
          </div>

          {/* PRODUCT LIST */}
          <h2 style={{ marginTop: "40px" }}>All Products</h2>
          <div
            style={{
              marginTop: "20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            {products.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#111",
                  padding: "15px",
                  borderRadius: "10px",
                }}
              >
                {p.image_main && (
                  <Image
                    src={p.image_main}
                    alt={p.name}
                    width={300}
                    height={200}
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                )}
                <h3 style={{ marginTop: "10px" }}>{p.name}</h3>
                <p style={{ color: "#aaa" }}>{p.description}</p>
                <p style={{ marginTop: "5px", color: "#c084fc" }}>
                  {p.price} AED
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "10px",
                  }}
                >
                  <button
                    onClick={() => openEdit(p)}
                    style={{
                      flex: 1,
                      background: "#444",
                      color: "#fff",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    style={{
                      flex: 1,
                      background: "red",
                      color: "#fff",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CATEGORIES TAB */}
      {tab === "categories" && (
        <>
          <h2 style={{ marginTop: "30px" }}>Add Category</h2>
          <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
            <input
              placeholder="Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ padding: "10px", flex: 1 }}
            />
            <button
              onClick={addCategory}
              style={{
                background: "#c084fc",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                color: "#000",
                fontWeight: 700,
              }}
            >
              Add
            </button>
          </div>

          <ul style={{ marginTop: "30px", listStyle: "none", padding: 0 }}>
            {categories.map((c) => (
              <li
                key={c.id}
                style={{
                  background: "#111",
                  padding: "12px",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span>
                  {c.name} <span style={{ color: "#777" }}>({c.slug})</span>
                </span>
                <button
                  onClick={() => deleteCategory(c.id)}
                  style={{
                    background: "red",
                    color: "#fff",
                    border: "none",
                    padding: "5px 10px",
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

      {/* EDIT MODAL */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#111",
              padding: "20px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "100%",
            }}
          >
            <h2>Edit Product</h2>
            <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
              <input
                placeholder="Product Name"
                value={editingDraft.name}
                onChange={(e) =>
                  setEditingDraft((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
              <input
                placeholder="Price (AED)"
                type="number"
                value={editingDraft.price}
                onChange={(e) =>
                  setEditingDraft((prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
              />
              <select
                value={editingDraft.category_id}
                onChange={(e) =>
                  setEditingDraft((prev) => ({
                    ...prev,
                    category_id: e.target.value,
                  }))
                }
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div>
                <label style={{ fontSize: "0.85rem" }}>
                  Product Image (upload to replace):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadEditImage(file);
                    if (url) {
                      setEditingDraft((prev) => ({
                        ...prev,
                        image_main: url,
                      }));
                    }
                  }}
                />
                {uploadingEdit && (
                  <p style={{ fontSize: "0.8rem", color: "#c084fc" }}>
                    Uploading...
                  </p>
                )}
                {editingDraft.image_main && (
                  <p style={{ fontSize: "0.8rem", color: "#0f0" }}>
                    Image set ✔
                  </p>
                )}
              </div>

              <textarea
                placeholder="Description"
                value={editingDraft.description}
                onChange={(e) =>
                  setEditingDraft((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                style={{ minHeight: "80px" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "16px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setEditing(null)}
                style={{
                  background: "#333",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                style={{
                  background: "#c084fc",
                  color: "#000",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
