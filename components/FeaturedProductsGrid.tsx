"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_main: string;
};

type Props = {
  products: Product[];
};

export default function FeaturedProductsGrid({ products }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="grid grid-4">
      {products.map((p) => (
        <div
          key={p.id}
          className="card"
          onMouseEnter={() => setHoveredId(p.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: hoveredId === p.id ? "translateY(-8px)" : "translateY(0)",
            boxShadow:
              hoveredId === p.id
                ? "0 20px 50px rgba(192, 132, 252, 0.25), 0 8px 24px rgba(0, 0, 0, 0.6)"
                : "0 8px 24px rgba(15, 23, 42, 0.7)",
            border:
              hoveredId === p.id
                ? "1px solid rgba(192, 132, 252, 0.4)"
                : "1px solid rgba(148,163,184,0.18)",
          }}
        >
          <Link href={`/products/${p.id}`}>
            <div
              style={{
                position: "relative",
                height: 230,
                overflow: "hidden",
                borderRadius: "12px 12px 0 0",
              }}
              className="featured-product-image"
            >
              <Image
                src={p.image_main}
                alt={p.name}
                fill
                style={{
                  objectFit: "cover",
                  transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: hoveredId === p.id ? "scale(1.08)" : "scale(1)",
                }}
              />
              {/* Overlay gradient on hover */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    hoveredId === p.id
                      ? "linear-gradient(to top, rgba(192, 132, 252, 0.15), transparent)"
                      : "transparent",
                  transition: "background 0.3s ease",
                }}
              />
            </div>
          </Link>

          <div
            style={{
              padding: 14,
              transition: "padding 0.3s ease",
            }}
          >
            <strong
              style={{
                display: "block",
                transition: "color 0.3s ease",
                color: hoveredId === p.id ? "#c084fc" : "inherit",
              }}
            >
              {p.name}
            </strong>
            <p
              style={{
                color: "#9ca3af",
                fontSize: "0.8rem",
                transition: "opacity 0.3s ease",
                opacity: hoveredId === p.id ? 1 : 0.8,
              }}
            >
              {p.description}
            </p>
            <div
              style={{
                fontWeight: 600,
                fontSize: "1.1rem",
                marginTop: 8,
                marginBottom: 8,
                transition: "color 0.3s ease",
                color: hoveredId === p.id ? "#c084fc" : "inherit",
              }}
            >
              {p.price.toFixed(2)} AED
            </div>

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
  );
}

