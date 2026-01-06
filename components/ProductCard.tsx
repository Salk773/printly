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
        borderRadius: 16,
        border: hovered ? "1px solid rgba(192,132,252,0.3)" : "1px solid rgba(148,163,184,0.18)",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 50px rgba(192,132,252,0.2), 0 8px 24px rgba(0,0,0,0.6)"
          : "0 4px 16px rgba(0,0,0,0.4)",
        position: "relative",
      }}
    >
      {/* IMAGE */}
      <Link href={`/products/${product.id}`}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 240,
            overflow: "hidden",
            background: "linear-gradient(135deg, #1e293b, #0f172a)",
          }}
        >
          <Image
            src={product.image_main}
            alt={product.name}
            fill
            style={{
              objectFit: "cover",
              transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: hovered ? "scale(1.08)" : "scale(1)",
            }}
          />
          {/* Overlay gradient */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40%",
              background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
              pointerEvents: "none",
            }}
          />
          {/* Wishlist button overlay */}
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
              position: "absolute",
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              cursor: "pointer",
              fontSize: "1.2rem",
              color: inWishlist ? "#fb7185" : "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              zIndex: 10,
            }}
            aria-label="Toggle wishlist"
          >
            {inWishlist ? "♥" : "♡"}
          </button>
        </div>
      </Link>

      {/* CONTENT */}
      <div style={{ padding: 18 }}>
        <Link
          href={`/products/${product.id}`}
          style={{
            textDecoration: "none",
            color: "white",
            fontWeight: 600,
            display: "block",
            marginBottom: 8,
            fontSize: "1.05rem",
            lineHeight: 1.4,
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#c084fc")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
        >
          {product.name}
        </Link>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "0.875rem",
            minHeight: 40,
            marginBottom: 14,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.description?.slice(0, 80) || "Premium 3D printed product"}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              background: "linear-gradient(135deg, #c084fc, #a855f7)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              fontSize: "1.25rem",
            }}
          >
            {product.price} AED
          </div>
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
