"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";

interface Product {
  id: string;
  name: string;
  price: number;
  image_main: string;
  category_id: string | null;
  description: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | "all">(
    "all"
  );

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category_id === selectedCategory);
  }, [selectedCategory, products]);

  return (
    <main
      style={{
        padding: "40px",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "2.2rem",
          fontWeight: 700,
          marginBottom: "20px",
        }}
      >
        Products
      </h1>

      {/* CATEGORY FILTERS */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "25px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setSelectedCategory("all")}
          style={{
            background: selectedCategory === "all" ? "#c084fc" : "#222",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              background: selectedCategory === cat.id ? "#c084fc" : "#222",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "25px",
        }}
      >
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            style={{
              background: "#111",
              padding: "15px",
              borderRadius: "12px",
              border: "1px solid #222",
            }}
          >
            {/* IMAGE */}
            <Link href={`/products/${p.id}`}>
              <img
                src={p.image_main}
                alt={p.name}
                style={{
                  width: "100%",
                  height: "220px",
                  objectFit: "cover",
                  borderRadius: "10px",
                  marginBottom: "12px",
                }}
              />
            </Link>

            {/* NAME */}
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "6px",
              }}
            >
              {p.name}
            </h3>

            {/* PRICE */}
            <p
              style={{
                color: "#c084fc",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              {p.price} AED
            </p>

            {/* ADD TO CART BUTTON */}
            <AddToCartButton
              id={p.id}
              name={p.name}
              price={p.price}
              image={p.image_main}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
