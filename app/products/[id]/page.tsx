import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { useWishlist } from "@/context/WishlistProvider";
import { supabaseServer } from "@/lib/supabaseServer";

export const revalidate = 30;

export default async function ProductPage({ params }) {
  const supabase = supabaseServer();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!product) {
    return (
      <div
        style={{
          padding: "80px 20px",
          textAlign: "center",
          color: "#94a3b8",
        }}
      >
        Product not found.
      </div>
    );
  }

  return <ProductPageClient product={product} />;
}

"use client";

import { useState } from "react";

function ProductPageClient({ product }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  // SAFEST MULTI-IMAGE FIX
  const extraImages = Array.isArray(product.images) ? product.images : [];
  const images = [product.image_main, ...extraImages].filter(Boolean);

  const [mainImage, setMainImage] = useState(images[0]);

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        color: "white",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 40,
        }}
      >
        {/* LEFT — GALLERY */}
        <div>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 520,
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(148,163,184,0.15)",
              marginBottom: 16,
            }}
          >
            <Image
              key={mainImage}
              src={mainImage}
              alt={product.name}
              fill
              style={{ objectFit: "cover" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 6,
            }}
          >
            {images.map((img) => (
              <div
                key={img}
                onClick={() => setMainImage(img)}
                style={{
                  position: "relative",
                  width: 90,
                  height: 90,
                  borderRadius: 10,
                  overflow: "hidden",
                  cursor: "pointer",
                  border:
                    img === mainImage
                      ? "2px solid #c084fc"
                      : "1px solid rgba(148,163,184,0.2)",
                }}
              >
                <Image
                  src={img}
                  alt="Thumbnail"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>
            {product.name}
          </h1>

          <button
            onClick={() =>
              toggleWishlist({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_main,
              })
            }
            style={{
              background: "transparent",
              border: "none",
              color: inWishlist ? "#fb7185" : "#64748b",
              fontSize: "1.3rem",
              cursor: "pointer",
              marginBottom: 16,
            }}
          >
            {inWishlist ? "♥ Wishlisted" : "♡ Add to wishlist"}
          </button>

          <p style={{ color: "#94a3b8", marginBottom: 20 }}>
            {product.description}
          </p>

          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              background: "linear-gradient(135deg, #c084fc, #a855f7)",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: 20,
            }}
          >
            {product.price} AED
          </div>

          <AddToCartButton
            id={product.id}
            name={product.name}
            price={product.price}
            image={product.image_main}
          />
        </div>
      </div>
    </main>
  );
}
