"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_main: string;
  category_id: string | null;
};

type Category = {
  id: string;
  name: string;
};

export default function ProductsClient({
  products,
  categories
}: {
  products: Product[];
  categories: Category[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesCategory =
        category === "all" || p.category_id === category;
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || "")
          .toLowerCase()
          .includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  return (
    <>
      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 18
        }}
      >
        <input
          className="input"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <select
          className="select"
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="all">All categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-4">
        {filtered.map(p => (
          <div key={p.id} className="card" style={{ overflow: "hidden" }}>
            <Link href={`/products/${p.id}`}>
              <div style={{ position: "relative", height: 220 }}>
                {p.image_main && (
                  <Image
                    src={p.image_main}
                    alt={p.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                )}
              </div>
            </Link>
            <div style={{ padding: 14 }}>
              <Link
                href={`/products/${p.id}`}
                style={{ fontWeight: 600, fontSize: "0.95rem" }}
              >
                {p.name}
              </Link>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "0.8rem",
                  minHeight: 32,
                  marginTop: 4
                }}
              >
                {p.description}
              </p>
              <div
                style={{
                  marginTop: 6,
                  marginBottom: 8,
                  fontWeight: 600,
                  fontSize: "0.9rem"
                }}
              >
                {p.price.toFixed(2)} AED
              </div>
              <AddToCartButton
                id={p.id}
                name={p.name}
                price={p.price}
                image={p.image_main}
                compact
              />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: "#9ca3af", marginTop: 20 }}>
          No products match your filters yet.
        </p>
      )}
    </>
  );
}
