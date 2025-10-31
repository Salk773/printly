"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

// ---- SUPABASE INIT ----
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ---- TYPES ----
interface Category {
  id: string;
  name: string;
}
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_main: string;
  category_id: string;
}

// ---- COMPONENT ----
export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE;

  const [tab, setTab] = useState<"products" | "categories">("products");

  // Product states
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image_main: "",
    category_id: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // ---------------- AUTH ----------------
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === ADMIN_CODE) {
      setAuthorized(true);
      setError("");
    } else {
      setError("Incorrect passcode ❌");
    }
  };

  // ---------------- FETCH ----------------
  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, description, price, image_main, category_id")
      .order("name");
    setProducts(data || []);
  };
  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name");
    setCategories(data || []);
  };
  useEffect(() => {
    if (authorized) {
      fetchProducts();
      fetchCategories();
    }
  }, [authorized]);

  // ---------------- ADD PRODUCT ----------------
  const addProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.image_main ||
      !newProduct.category_id
    ) {
      alert("Please fill all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("products").insert([
      {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        image_main: newProduct.image_main,
        category_id: newProduct.category_id,
        active: true,
      },
    ]);
    if (error) alert("Error adding product: " + error.message);
    else {
      setNewProduct({
        name: "",
        description: "",
        price: "",
        image_main: "",
        category_id: "",
      });
      await fetchProducts();
    }
    setLoading(false);
  };

  // ---------------- DELETE PRODUCT ----------------
  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert(error.message);
    else await fetchProducts();
  };

  // ---------------- ADD CATEGORY ----------------
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const slug = newCategory.trim().toLowerCase().replace(/\s+/g, "-");
    const { error } = await supabase
      .from("categories")
      .insert([{ name: newCategory.trim(), slug }]);
    if (error) alert(error.message);
    else {
      setNewCategory("");
      await fetchCategories();
    }
  };

  // ---------------- DELETE CATEGORY ----------------
  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) alert(error.message);
    else await fetchCategories();
  };

  // ---------------- LOGIN UI ----------------
  if (!authorized) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ marginBottom: "10px", color: "#c084fc" }}>Printly Admin</h1>
        <form onSubmit={handleLogin} style={{ textAlign: "center" }}>
          <input
            type="password"
            placeholder="Enter passcode"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              border: "1px solid #333",
              background: "#111",
              color: "#fff",
              width: "200px",
            }}
          />
          <button
            type="submit"
            style={{
              marginLeft: "10px",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              background: "#c084fc",
              color: "#000",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>
        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      </main>
    );
  }

  // ---------------- ADMIN DASHBOARD ----------------
  return (
    <main
      style={{
        background: "#0a0a0a",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "30px" }}>🛠️ Admin Panel</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <button
          onClick={() => setTab("products")}
          style={{
            background: tab === "products" ? "#c084fc" : "#222",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Products
        </button>
        <button
          onClick={() => setTab("categories")}
          style={{
            background: tab === "categories" ? "#c084fc" : "#222",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Categories
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {tab === "products" && (
        <>
          {/* Add Product Form */}
          <div
            style={{
              marginBottom: "40px",
              background: "#111",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <h2>Add New Product</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "15px",
                marginTop: "15px",
              }}
            >
              <input
                placeholder="Product name"
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
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
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
            </div>
            <textarea
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
              style={{
                marginTop: "10px",
                width: "100%",
                minHeight: "80px",
              }}
            />
            <button
              onClick={addProduct}
              disabled={loading}
              style={{
                background: "#c084fc",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                color: "#000",
                marginTop: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {loading ? "Adding..." : "Add Product"}
            </button>
          </div>

          {/* Product List */}
          <div
            style={{
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
                  borderRadius: "12px",
                }}
              >
                {p.image_main && (
                  <Image
                    src={p.image_main}
                    alt={p.name}
                    width={300}
                    height={200}
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: "8px",
                      marginBottom: "10px",
                    }}
                  />
                )}
                <h3>{p.name}</h3>
                <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
                  {p.description}
                </p>
                <p style={{ color: "#c084fc", fontWeight: 600 }}>
                  {p.price} AED
                </p>
                <button
                  onClick={() => deleteProduct(p.id)}
                  style={{
                    background: "red",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    marginTop: "10px",
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
          <div style={{ marginBottom: "30px" }}>
            <h2>Add Category</h2>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <input
                placeholder="Category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button
                onClick={addCategory}
                style={{
                  background: "#c084fc",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  color: "#000",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>
          </div>

          <ul>
            {categories.map((cat) => (
              <li
                key={cat.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#111",
                  padding: "10px",
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              >
                <span>{cat.name}</span>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  style={{
                    background: "red",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
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
