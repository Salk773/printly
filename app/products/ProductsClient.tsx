"use client";

import { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";

export default function ProductsClient({ products, categories }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      {/* SEARCH + FILTERS */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 26,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.25)",
            background: "#0f172a",
            color: "white",
            width: 260,
          }}
        />

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.25)",
            background: "#0f172a",
            color: "white",
            cursor: "pointer",
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* PRODUCT GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 22,
        }}
      >
        {filteredProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* NO RESULTS */}
      {filteredProducts.length === 0 && (
        <p
          style={{
            color: "#94a3b8",
            textAlign: "center",
            marginTop: 40,
          }}
        >
          No products found.
        </p>
      )}
    </div>
  );
}
