"use client";

import { useComparison } from "@/context/ComparisonProvider";
import Link from "next/link";
import Image from "next/image";

export default function ComparePage() {
  const { items, removeProduct, clearComparison } = useComparison();

  if (items.length === 0) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0a0f1f",
          color: "#e5e7eb",
          padding: "40px 20px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: 10, fontWeight: 700 }}>
            Product Comparison
          </h1>
          <p style={{ color: "#9ca3af", marginBottom: 30 }}>
            No products selected for comparison.
          </p>
          <Link
            href="/products"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #c084fc, #a855f7)",
              color: "#020617",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Browse Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0f1f",
        color: "#e5e7eb",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>
            Compare Products ({items.length})
          </h1>
          <button
            onClick={clearComparison}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid rgba(239,68,68,0.3)",
              background: "transparent",
              color: "#ef4444",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Clear All
          </button>
        </div>

        <div
          style={{
            overflowX: "auto",
            background: "#0f172a",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 600,
            }}
          >
            <thead>
              <tr>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                  Product
                </th>
                {items.map((product) => (
                  <th
                    key={product.id}
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: "1px solid rgba(148,163,184,0.2)",
                      minWidth: 200,
                    }}
                  >
                    <button
                      onClick={() => removeProduct(product.id)}
                      style={{
                        float: "right",
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                      }}
                    >
                      ×
                    </button>
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: 150,
                        marginBottom: 12,
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <Link
                      href={`/products/${product.id}`}
                      style={{
                        color: "#c084fc",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      {product.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "12px", fontWeight: 600 }}>Price</td>
                {items.map((product) => (
                  <td
                    key={product.id}
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: "#c084fc",
                      fontWeight: 700,
                    }}
                  >
                    {product.price} AED
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: "12px", fontWeight: 600 }}>Description</td>
                {items.map((product) => (
                  <td
                    key={product.id}
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      color: "#9ca3af",
                      fontSize: "0.9rem",
                    }}
                  >
                    {product.description?.slice(0, 100) || "No description"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

