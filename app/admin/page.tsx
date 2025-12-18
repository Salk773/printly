"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

import AdminImageUpload from "@/components/AdminImageUpload";
import EditProductModal from "@/components/EditProductModal";

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

  /* ---------- AUTH GUARD ---------- */
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
    if (user && profile?.role === "admin") {
      loadData();
    }
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

      {/* UI BELOW IS UNCHANGED */}
      {/* (Products + Categories tabs exactly as you had them) */}
      {/* … */}
    </div>
  );
}
