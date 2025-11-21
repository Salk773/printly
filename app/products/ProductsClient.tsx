"use client";

import { useState, useMemo } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import Link from "next/link";

export default function ProductsClient({ products, categories }: any) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filtered = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p: any) => p.category_id === selectedCategory);
  }, [selectedCategory, products]);

  return (
    <div style={{ padding: "40px", color: "#fff" }}>
      {/* Category Filter */}
      <div style={{ marginBottom: "20px" }}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
          }}
        >
          <option value="all">All Products</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {filtered.map((p: any) => (
          <div
            key={p.id}
            style={{
              background: "#111",
              padding: "15px",
              borderRadius: "12px",
            }}
          >
            <Link href={`/products/${p.id}`}>
              <img
                src={p.image_main}
                alt={p.name}
                style={{
                  width: "100%",
                  height: "220px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              />
            </Link>

            <h3>{p.name}</h3>
            <p style={{ color: "#aaa" }}>{p.price} AED</p>

            <AddToCartButton
              id={p.id}
              name={p.name}
              price={p.price}
              image={p.image_main}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
