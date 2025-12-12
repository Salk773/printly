"use client";

import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductCard({ product }) {
  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 14,
        border: "1px solid rgba(148,163,184,0.12)",
        overflow: "hidden",
        transition: "0.25s",
        cursor: "pointer",
      }}
    >
      {/* IMAGE */}
      <Link href={`/products/${product.id}`}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 220,
            overflow: "hidden",
          }}
        >
          <Image
            src={product.image_main}
            alt={product.name}
            fill
            style={{
              objectFit: "cover",
              transition: "0.35s",
            }}
          />
        </div>
      </Link>

      {/* CONTENT */}
      <div style={{ padding: 14 }}>
        <Link
          href={`/products/${product.id}`}
          style={{
            textDecoration: "none",
            color: "white",
            fontWeight: 600,
            display: "block",
            marginBottom: 6,
            fontSize: "1rem",
          }}
        >
          {product.name}
        </Link>

        <p
          style={{
            color: "#9ca3af",
            fontSize: "0.85rem",
            minHeight: 32,
            marginBottom: 10,
          }}
        >
          {product.description?.slice(0, 60)}
        </p>

        <div
          style={{
            fontWeight: 700,
            color: "#c084fc",
            fontSize: "0.95rem",
            marginBottom: 12,
          }}
        >
          {product.price} AED
        </div>

        <AddToCartButton
          id={product.id}
          name={product.name}
          price={product.price}
          image={product.image_main}
          small
        />
      </div>
    </div>
  );
}
