"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartProvider";
import { useWishlist } from "@/context/WishlistProvider";

export default function CartPage() {
  const {
    items,
    total,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  } = useCart();

  const { toggleWishlist, isInWishlist } = useWishlist();

  const hasItems = items.length > 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: 10 }}>Your cart</h1>

        {!hasItems && (
          <p style={{ color: "#9ca3af" }}>Your cart is empty.</p>
        )}

        {hasItems && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)",
              gap: 24,
            }}
          >
            {/* ITEMS */}
            <div
              style={{
                background: "#0f172a",
                borderRadius: 16,
                border: "1px solid rgba(148,163,184,0.2)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {items.map((item) => {
                const inWishlist = isInWishlist(item.id);

                return (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "90px minmax(0,1fr) auto",
                      gap: 16,
                      borderBottom: "1px solid rgba(148,163,184,0.2)",
                      paddingBottom: 12,
                    }}
                  >
                    {/* CLICKABLE IMAGE */}
                    <Link
                      href={`/products/${item.id}`}
                      style={{
                        position: "relative",
                        width: 90,
                        height: 90,
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </Link>

                    {/* INFO */}
                    <div>
                      <Link
                        href={`/products/${item.id}`}
                        style={{
                          color: "white",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        {item.name}
                      </Link>

                      <div style={{ marginTop: 6 }}>
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          style={qtyBtn}
                        >
                          –
                        </button>
                        <span style={{ margin: "0 10px" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          style={qtyBtn}
                        >
                          +
                        </button>
                      </div>

                      {/* Wishlist button */}
                      <button
                        onClick={() =>
                          toggleWishlist({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            image: item.image,
                          })
                        }
                        style={{
                          marginTop: 8,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: inWishlist ? "#fb7185" : "#64748b",
                          fontSize: "1rem",
                        }}
                      >
                        {inWishlist ? "♥ Wishlisted" : "♡ Add to wishlist"}
                      </button>
                    </div>

                    {/* REMOVE */}
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#f87171",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {/* SUMMARY */}
            <aside
              style={{
                background: "#0f172a",
                borderRadius: 16,
                border: "1px solid rgba(148,163,184,0.2)",
                padding: 16,
              }}
            >
              <h2 style={{ fontSize: "1.1rem" }}>Summary</h2>

              <p
                style={{
                  marginTop: 10,
                  fontSize: "1rem",
                  fontWeight: 700,
                }}
              >
                {total.toFixed(2)} AED
              </p>

              <Link
                href="/checkout"
                style={{
                  marginTop: 20,
                  padding: "12px 18px",
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #c084fc, #a855f7)",
                  color: "#020617",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "block",
                  textAlign: "center",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Proceed to Checkout
              </Link>

              <button
                onClick={clearCart}
                style={{
                  marginTop: 10,
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "transparent",
                  border: "1px solid #f87171",
                  color: "#f87171",
                  width: "100%",
                }}
              >
                Clear cart
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

const qtyBtn = {
  padding: "4px 10px",
  borderRadius: 6,
  background: "#1e293b",
  border: "none",
  cursor: "pointer",
  color: "white",
};
