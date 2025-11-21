import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_main: string | null;
  category_id: string | null;
};

export const revalidate = 60;

export default async function ProductsPage() {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id,name").order("name"),
    supabase
      .from("products")
      .select(
        "id,name,description,price,image_main,category_id,active"
      )
      .eq("active", true)
      .order("name"),
  ]);

  const safeCategories: Category[] = categories ?? [];
  const safeProducts: Product[] = (products ?? []) as Product[];

  return (
    <main>
      <h1 style={{ fontSize: "1.7rem", marginBottom: 10 }}>Products</h1>
      <p style={{ color: "#9ca3af", marginBottom: 22 }}>
        Browse all 3D printed products available on Printly. Use categories to
        narrow down, or view everything by default.
      </p>

      <ProductsClient categories={safeCategories} products={safeProducts} />
    </main>
  );
}

// ---------- Client-side filter + layout ----------
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

function ProductsClient({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | "all">(
    "all"
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "all" && p.category_id !== selectedCategory) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, selectedCategory, search]);

  return (
    <section style={{ display: "grid", gap: 20 }}>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <FilterPill
            label="All"
            active={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
          />
          {categories.map((c) => (
            <FilterPill
              key={c.id}
              label={c.name}
              active={selectedCategory === c.id}
              onClick={() => setSelectedCategory(c.id)}
            />
          ))}
        </div>

        <input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "rgba(15,23,42,0.9)",
            color: "#e5e7eb",
            minWidth: 180,
            fontSize: "0.85rem",
          }}
        />
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {filtered.length === 0 && (
          <p style={{ color: "#9ca3af" }}>
            No products match your filters.
          </p>
        )}
        {filtered.map((p) => (
          <article
            key={p.id}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              background:
                "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(30,64,175,0.65))",
              border: "1px solid rgba(129,140,248,0.55)",
              display: "flex",
              flexDirection: "column",
              minHeight: 260,
            }}
          >
            <Link
              href={`/products/${p.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 160,
                  background: "#020617",
                }}
              >
                {p.image_main ? (
                  <Image
                    src={p.image_main}
                    alt={p.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      color: "#6b7280",
                    }}
                  >
                    No image
                  </div>
                )}
              </div>
            </Link>

            <div style={{ padding: "12px 14px 14px", flex: 1 }}>
              <Link
                href={`/products/${p.id}`}
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 4,
                  textDecoration: "none",
                  color: "#e5e7eb",
                }}
              >
                {p.name}
              </Link>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#cbd5f5",
                  marginBottom: 8,
                  minHeight: 32,
                }}
              >
                {p.description}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "0.95rem",
                  }}
                >
                  {p.price.toFixed(2)} AED
                </span>
                <AddToCartButton
                  product={{
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    image_main: p.image_main,
                  }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: "6px 14px",
        border: active
          ? "1px solid rgba(196,181,253,0.9)"
          : "1px solid rgba(148,163,184,0.6)",
        background: active
          ? "linear-gradient(135deg, #c4b5fd, #a855f7)"
          : "rgba(15,23,42,0.9)",
        color: active ? "#020617" : "#e5e7eb",
        fontSize: "0.8rem",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
