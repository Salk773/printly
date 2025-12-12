"use client";

import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { useState } from "react";
import { useWishlist } from "@/context/WishlistProvider";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_main: string;
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#0f172a",
        borderRadius: 14,
        border: "1px solid rgba(148,163,184,0.18)",
        overflow: "hidden",
        transition: "0.25s",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 16px 40px rgba(0,0,0,0.55)"
          : "0 8px 24px rgba(15,23,42,0.7)",
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
              transform: hovered ? "scale(1.03)" : "scale(1)",
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "#c084fc",
              fontSize: "0.95rem",
            }}
          >
            {product.price} AED
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_main,
              });
            }}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "1.1rem",
              color: inWishlist ? "#fb7185" : "#64748b",
              transition: "0.2s",
            }}
            aria-label="Toggle wishlist"
          >
            {inWishlist ? "♥" : "♡"}
          </button>
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
