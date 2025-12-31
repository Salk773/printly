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

  // ✅ added "homepage"
  const [tab, setTab] = useState<"products" | "categories" | "homepage">(
    "products"
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);


  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newCategory, setNewCategory] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image_main: "",
    images: [] as string[],
    category_id: "",
  });

  // ✅ homepage gallery state
  const [homepageImages, setHomepageImages] = useState<string[]>([]);

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
      { data: gallery, error: galleryErr },
      { data: ordersData, error: ordersErr },
    ] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("products")
        .select("id,name,description,price,image_main,images,category_id,active")
        .order("name"),
      supabase.storage.from("uploads").list("home-gallery"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
    ]);

    if (catsErr) console.error(catsErr);
    if (prodsErr) console.error(prodsErr);
    if (galleryErr) console.error(galleryErr);

    setCategories(cats || []);
    setProducts(prods || []);
    setOrders((ordersData as Order[]) || []);


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

  // ✅ preserved EXACT optimistic + rollback behavior
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

  /* ---------- HOMEPAGE IMAGE HELPERS ---------- */
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
        <button className="btn-ghost" onClick={() => setTab("orders")}>
    Orders
  </button>
      </div>

      {loadingData && <p>Loading…</p>}

      {/* HOMEPAGE */}
      {tab === "homepage" && (
        <div className="card-soft" style={{ padding: 20, maxWidth: 760 }}>
          <h2>Homepage Gallery</h2>

          <AdminHomepageImageUpload onUploaded={loadData} />

          {homepageImages.length > 0 && (
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
          )}
        </div>
      )}

      {/* PRODUCTS */}
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

            {/* ✅ MAIN PREVIEW (RESTORED) */}
            {newProduct.image_main && (
              <img
                key={newProduct.image_main}
                src={newProduct.image_main}
                style={{ width: 160, marginTop: 8, borderRadius: 8 }}
              />
            )}

            <strong>
              Gallery images ({newProduct.images.length}/{MAX_GALLERY})
            </strong>
            <AdminImageUpload onUploaded={addNewGalleryImage} />

            {/* ✅ GALLERY PREVIEW (RESTORED) */}
            {newProduct.images.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 8,
                  flexWrap: "wrap",
                }}
              >
                {newProduct.images.map((url, idx) => (
                  <img
                    key={`${url}-${idx}`}
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
              {/* ✅ PRODUCT THUMBNAIL (RESTORED) */}
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

              <button className="btn-danger" onClick={() => deleteProduct(p.id)}>
                Delete
              </button>
            </div>
          ))}
        </>
      )}

      {/* CATEGORIES */}
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
                    onChange={(e) => setEditingCategoryName(e.target.value)}
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
            {/* ORDERS */}
      {tab === "orders" && (
        <div style={{ maxWidth: 900 }}>
          {orders.length === 0 && (
            <p style={{ opacity: 0.6 }}>No orders found.</p>
          )}

          {orders.map((o) => (
            <div
              key={o.id}
              className="card-soft"
              style={{
                padding: 14,
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div>
                <strong>{o.guest_name || "Guest"}</strong>
                <div style={{ fontSize: 12 }}>{o.guest_email}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{o.id}</div>
              </div>

              <div>{o.items.length} items</div>

              <div>${o.total.toFixed(2)}</div>

              <div>{new Date(o.created_at).toLocaleString()}</div>

              <select
                className="select"
                value={o.status}
                onChange={(e) =>
                  supabase
                    .from("orders")
                    .update({ status: e.target.value })
                    .eq("id", o.id)
                }
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
