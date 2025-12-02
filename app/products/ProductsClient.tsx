"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_main: string;
  category_id?: string;
};

type Category = {
  id: string;
  name: string;
};

export default function ProductsClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 🔍 Filter products (search + category)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "all" || p.category_id === selectedCategory;

      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [products, search, selectedCategory]);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "30px 20px" }}>
      {/* 🔍Search + Category Bar */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 30,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "10px 14px",
            width: "260px",
            borderRadius: 8,
            border: "1px solid #475569",
            background: "#0f172a",
            color: "white",
          }}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #475569",
            background: "#0f172a",
            color: "white",
          }}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* PRODUCTS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 25,
        }}
      >
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            style={{
              background: "#0f172a",
              borderRadius: 12,
              border: "1px solid #1e293b",
              overflow: "hidden",
              paddingBottom: 20,
            }}
          >
            {/* IMAGE */}
            <Link href={`/products/${p.id}`}>
              <img
                src={p.image_main}
                alt={p.name}
                style={{
                  width: "100%",
                  height: 220,
                  objectFit: "cover",
                }}
              />
            </Link>

            {/* CONTENT */}
            <div style={{ padding: "15px" }}>
              <h3
                style={{
                  color: "white",
                  fontSize: "1.1rem",
                  marginBottom: 6,
                }}
              >
                {p.name}
              </h3>

              <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: 8 }}>
                {p.description?.slice(0, 60) ?? ""}
              </p>

              <div
                style={{
                  fontWeight: 700,
                  color: "#c084fc",
                  marginBottom: 12,
                }}
              >
                {p.price} AED
              </div>

              {/* ADD TO CART (small button on preview cards) */}
              <AddToCartButton
                id={p.id}
                name={p.name}
                price={p.price}
                image={p.image_main}
                small
              />
            </div>
          </div>
        ))}
      </div>

      {/* No results */}
      {filteredProducts.length === 0 && (
        <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 40 }}>
          No products found.
        </p>
      )}
    </div>
  );
}
