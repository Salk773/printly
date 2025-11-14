// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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

  async function addProduct() {
    const { name, description, price, image_main, category_id } = newProduct;

    if (!name || !price || !image_main || !category_id)
      return alert("Please fill all fields");

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

  async function deleteCategory(id: string) {
    if (!confirm("Delete category?")) return;

    const res = await fetch(`${API_CATEGORIES}?id=${id}`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (!json.success) alert(json.message);
    else loadCategories();
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
              <input
                placeholder="Image URL"
                value={newProduct.image_main}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, image_main: e.target.value })
                }
              />
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
                style={{ background: "#111", padding: "15px", borderRadius: "10px" }}
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
                <p style={{ marginTop: "5px", color: "#c084fc" }}>{p.price} AED</p>

                <button
                  onClick={() => deleteProduct(p.id)}
                  style={{
                    marginTop: "10px",
                    background: "red",
                    color: "#fff",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "none",
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
    </main>
  );
}
