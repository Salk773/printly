"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_main: string | null;
  category_id: string | null;
};

export default function ProductsClient({
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
      if (selectedCategory !== "all" && p.category_id !== selectedCategory)
        return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();

      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, selectedCategory, search]);

  return (
    <main style={{ display: "grid", gap: 20 }}>
      {/* Filters + Search */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
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
          }}
        />
      </div>

      {/* Product Grid */}
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {filtered.length === 0 && (
          <p style={{ color: "#9ca3af" }}>No products found.</p>
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
            }}
          >
            <Link href={`/products/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ position: "relative", width: "100%", height: 160 }}>
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
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#666",
                    }}
                  >
                    No Image
                  </div>
                )}
              </div>
            </Link>

            <div style={{ padding: "12px 14px" }}>
              <Link
                href={`/products/${p.id}`}
                style={{ fontWeight: 600, textDecoration: "none", color: "#fff" }}
              >
                {p.name}
              </Link>
              <p style={{ color: "#cbd5f5", fontSize: "0.8rem", minHeight: 32 }}>
                {p.description}
              </p>

              <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>{p.price} AED</span>

                {/* ADD TO CART BUTTON ON PREVIEW */}
                <AddToCartButton product={p} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
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
        padding: "6px 14px",
        borderRadius: 999,
        border: active
          ? "1px solid rgba(196,181,253,0.9)"
          : "1px solid rgba(148,163,184,0.6)",
        background: active
          ? "linear-gradient(135deg, #c4b5fd, #a855f7)"
          : "rgba(15,23,42,0.9)",
        color: active ? "#020617" : "#e5e7eb",
      }}
    >
      {label}
    </button>
  );
}
