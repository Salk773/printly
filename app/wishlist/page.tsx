"use client";

import Link from "next/link";
import Image from "next/image";
import { useWishlist } from "@/context/WishlistProvider";
import AddToCartButton from "@/components/AddToCartButton";

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const hasItems = items.length > 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0f1f",
        color: "#e5e7eb",
        padding: "40px 20px 60px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "2rem",
            marginBottom: 10,
            fontWeight: 700,
          }}
        >
          Wishlist
        </h1>
        <p style={{ color: "#9ca3af", marginBottom: 30 }}>
          Items you&apos;ve saved for later.
        </p>

        {!hasItems && (
          <div
            style={{
              padding: 40,
              borderRadius: 20,
              background:
                "linear-gradient(135deg, rgba(30,41,59,0.6), rgba(15,23,42,0.8))",
              border: "1px dashed rgba(148,163,184,0.4)",
              textAlign: "center",
            }}
          >
            <p style={{ marginBottom: 16 }}>
              Your wishlist is empty. Start adding some favourites ✨
            </p>
            <Link
              href="/products"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                borderRadius: 999,
                background:
                  "linear-gradient(135deg, #c084fc, #a855f7)",
                color: "#020617",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(168,85,247,0.35)",
              }}
            >
              Browse products
            </Link>
          </div>
        )}

        {hasItems && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 20,
                marginBottom: 24,
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 16,
                    background: "#0f172a",
                    border: "1px solid rgba(148,163,184,0.2)",
                    padding: 14,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                  }}
                >
                  <Link
                    href={`/products/${item.id}`}
                    style={{
                      display: "block",
                      position: "relative",
                      width: "100%",
                      height: 170,
                      borderRadius: 12,
                      overflow: "hidden",
                      marginBottom: 10,
                    }}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </Link>

                  <Link
                    href={`/products/${item.id}`}
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "white",
                      textDecoration: "none",
                    }}
                  >
                    {item.name}
                  </Link>

                  <div
                    style={{
                      fontWeight: 700,
                      color: "#c084fc",
                      fontSize: "0.95rem",
                      marginBottom: 10,
                    }}
                  >
                    {item.price} AED
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <AddToCartButton
                      id={item.id}
                      name={item.name}
                      price={item.price}
                      image={item.image}
                      small
                    />

                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#f97373",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={clearWishlist}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid rgba(248,113,113,0.9)",
                background: "transparent",
                color: "#fecaca",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Clear wishlist
            </button>
          </>
        )}
      </div>
    </main>
  );
}
