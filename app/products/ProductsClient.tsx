"use client";

import { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";

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
      {/* Search + Filters */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 26,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
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
            minWidth: 200,
            flex: "1 1 200px",
          }}
        />

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

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 22,
        }}
        className="products-grid"
      >
        {filteredProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

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
