"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartProvider";

export default function CartPage() {
  const {
    items,
    total,
    clearCart,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const hasItems = items.length > 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        padding: "40px 20px 60px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>Your cart</h1>
        <p style={{ color: "#9ca3af", marginBottom: "30px" }}>
          Review your selected 3D prints before checkout.
        </p>

        {!hasItems && (
          <div
            style={{
              padding: "30px",
              borderRadius: "16px",
              background: "radial-gradient(circle at top left, #1e293b, #020617)",
              border: "1px dashed rgba(148,163,184,0.4)",
              textAlign: "center",
            }}
          >
            <p style={{ marginBottom: "16px" }}>
              Your cart is empty. Let&apos;s fix that 👇
            </p>
            <Link
              href="/products"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #c084fc, #a855f7)",
                color: "#020617",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Browse products
            </Link>
          </div>
        )}

        {hasItems && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)",
              gap: 24,
            }}
          >
            {/* CART ITEMS */}
            <div
              style={{
                borderRadius: "16px",
                background: "#0f172a",
                border: "1px solid rgba(148,163,184,0.2)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "96px minmax(0, 1fr) auto",
                    gap: 16,
                    padding: "10px 6px",
                    borderBottom: "1px solid rgba(30,64,175,0.4)",
                    alignItems: "center",
                  }}
                >
                  {/* CLICKABLE PRODUCT LINK */}
                  <Link
                    href={`/products/${item.id}`}
                    style={{ display: "block", position: "relative", width: 96, height: 96 }}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      style={{ objectFit: "cover", borderRadius: 12 }}
                    />
                  </Link>

                  {/* NAME + QUANTITY */}
                  <div style={{ overflow: "hidden" }}>
                    {/* CLICKABLE PRODUCT NAME */}
                    <Link
                      href={`/products/${item.id}`}
                      style={{
                        fontWeight: 600,
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        display: "block",
                        color: "white",
                        textDecoration: "none",
                      }}
                    >
                      {item.name}
                    </Link>

                    {/* QUANTITY CONTROLS */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        style={{
                          padding: "4px 8px",
                          background: "#1e293b",
                          borderRadius: 6,
                          border: "none",
                          cursor: "pointer",
                          color: "white",
                        }}
                      >
                        –
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() => increaseQuantity(item.id)}
                        style={{
                          padding: "4px 8px",
                          background: "#1e293b",
                          borderRadius: 6,
                          border: "none",
                          cursor: "pointer",
                          color: "white",
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#c084fc",
                        fontWeight: 600,
                      }}
                    >
                      {(item.price * item.quantity).toFixed(2)} AED
                    </div>
                  </div>

                  {/* REMOVE */}
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#f97373",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              ))}
            </div>

            {/* SUMMARY */}
            <aside
              style={{
                borderRadius: "16px",
                background: "#0b1120",
                border: "1px solid rgba(148,163,184,0.4)",
                padding: "18px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <h2 style={{ fontSize: "1.1rem", marginBottom: 4 }}>
                Summary
              </h2>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.95rem",
                }}
              >
                <span>Subtotal</span>
                <span style={{ fontWeight: 600 }}>
                  {total.toFixed(2)} AED
                </span>
              </div>

              <button
                onClick={clearCart}
                style={{
                  marginTop: 10,
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(239,68,68,0.7)",
                  background: "transparent",
                  color: "#fecaca",
                  fontSize: "0.85rem",
                  cursor: "pointer",
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
