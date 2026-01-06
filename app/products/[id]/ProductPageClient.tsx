"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { useWishlist } from "@/context/WishlistProvider";
import { useRecentlyViewed } from "@/context/RecentlyViewedProvider";
import ProductReviews from "@/components/ProductReviews";
import ReviewForm from "@/components/ReviewForm";
import RelatedProducts from "@/components/RelatedProducts";
import SocialShare from "@/components/SocialShare";

export default function ProductPageClient({ product }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addProduct } = useRecentlyViewed();
  const inWishlist = isInWishlist(product.id);

  // Track product view
  useEffect(() => {
    addProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_main,
    });
  }, [product.id, product.name, product.price, product.image_main, addProduct]);

  const extraImages = Array.isArray(product.images) ? product.images : [];
  const images = [product.image_main, ...extraImages].filter(Boolean);

  const [mainImage, setMainImage] = useState(images[0]);
  const [fadeImage, setFadeImage] = useState(true);

  // ✨ Smooth fade transition when switching images
  const handleImageSwitch = (image) => {
    setFadeImage(false);
    setTimeout(() => {
      setMainImage(image);
      setFadeImage(true);
    }, 160);
  };

  // ✨ Fade the entire product in on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        color: "white",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0px)" : "translateY(10px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 40,
        }}
        className="product-page-grid"
      >
        {/* LEFT — GALLERY */}
        <div>
          {/* MAIN IMAGE */}
          <div
            className="product-main-image"
            style={{
              position: "relative",
              width: "100%",
              height: 520,
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(148,163,184,0.15)",
              marginBottom: 16,
              transition: "box-shadow 0.3s ease",
            }}
          >
            <Image
              key={mainImage}
              src={mainImage}
              alt={product.name}
              fill
              style={{
                objectFit: "cover",
                opacity: fadeImage ? 1 : 0,
                transition: "opacity 0.35s ease",
              }}
            />
          </div>

          {/* THUMBNAILS */}
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 6,
            }}
          >
            {images.map((img) => {
              const active = img === mainImage;

              return (
                <div
                  key={img}
                  onClick={() => handleImageSwitch(img)}
                  style={{
                    position: "relative",
                    width: 90,
                    height: 90,
                    cursor: "pointer",
                    borderRadius: 10,
                    overflow: "hidden",
                    border: active
                      ? "2px solid #c084fc"
                      : "1px solid rgba(148,163,184,0.2)",
                    transform: active ? "scale(1.05)" : "scale(1)",
                    transition:
                      "border 0.25s ease, transform 0.25s ease, opacity 0.25s ease",
                    opacity: active ? 1 : 0.85,
                  }}
                >
                  <Image
                    src={img}
                    alt="thumb"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              marginBottom: 10,
              letterSpacing: "-0.02em",
            }}
          >
            {product.name}
          </h1>

          {/* WISHLIST BUTTON */}
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
              fontSize: "1.1rem",
              cursor: "pointer",
              marginBottom: 16,
              transition: "color 0.2s ease, transform 0.25s ease",
              transform: inWishlist ? "scale(1.06)" : "scale(1)",
            }}
          >
            {inWishlist ? "♥ Wishlisted" : "♡ Add to wishlist"}
          </button>

          <p
            style={{
              color: "#94a3b8",
              marginBottom: 20,
              lineHeight: 1.55,
            }}
          >
            {product.description}
          </p>

          {/* PRICE */}
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #c084fc, #a855f7)",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: 24,
            }}
          >
            {product.price} AED
          </div>

          {/* ADD TO CART */}
          <AddToCartButton
            id={product.id}
            name={product.name}
            price={product.price}
            image={product.image_main}
          />

          {/* SOCIAL SHARE */}
          <SocialShare
            productName={product.name}
            productUrl={`/products/${product.id}`}
            productImage={product.image_main}
            productDescription={product.description}
          />
        </div>
      </div>

      {/* REVIEWS */}
      <ProductReviews productId={product.id} />
      <ReviewForm productId={product.id} />

      {/* RELATED PRODUCTS */}
      <RelatedProducts
        productId={product.id}
        categoryId={product.category_id}
      />
    </main>
  );
}
