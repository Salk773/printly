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
        background: "#0a0f1f",
        color: "#e5e7eb",
        padding: "60px 20px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "2.4rem",
            marginBottom: "10px",
            fontWeight: 700,
          }}
        >
          Your Cart
        </h1>
        <p style={{ color: "#9ca3af", marginBottom: "40px", fontSize: "1rem" }}>
          Review your selected 3D prints before checkout.
        </p>

        {/* EMPTY STATE */}
        {!hasItems && (
          <div
            style={{
              padding: "40px",
              borderRadius: "20px",
              background:
                "linear-gradient(135deg, rgba(30,41,59,0.6), rgba(15,23,42,0.7))",
              border: "1px dashed rgba(148,163,184,0.4)",
              textAlign: "center",
            }}
          >
            <p style={{ marginBottom: "20px", fontSize: "1.1rem" }}>
              Your cart is empty. Let&apos;s fix that 👇
            </p>
            <Link
              href="/products"
              style={{
                display: "inline-block",
                padding: "12px 22px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #c084fc, #a855f7)",
                color: "#020617",
                fontWeight: 700,
                fontSize: "0.95rem",
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(168,85,247,0.35)",
              }}
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* CART CONTENT */}
        {hasItems && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)",
              gap: 34,
            }}
          >
            {/* CART ITEMS */}
            <div
              style={{
                borderRadius: "20px",
                background: "#0f172a",
                border: "1px solid rgba(148,163,184,0.15)",
                padding: "20px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "96px minmax(0, 1fr) auto",
                    gap: 20,
                    paddingBottom: 16,
                    borderBottom: "1px solid rgba(148,163,184,0.1)",
                    alignItems: "center",
                    transition: "0.2s",
                  }}
                >
                  {/* IMAGE (CLICKABLE) */}
                  <Link
                    href={`/products/${item.id}`}
                    style={{
                      display: "block",
                      width: 96,
                      height: 96,
                      position: "relative",
                      borderRadius: 14,
                      overflow: "hidden",
                      transition: "0.25s",
                    }}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      style={{
                        objectFit: "cover",
                        transition: "0.25s",
                      }}
                    />
                  </Link>

                  {/* ITEM DETAILS */}
                  <div style={{ overflow: "hidden" }}>
                    <Link
                      href={`/products/${item.id}`}
                      style={{
                        fontWeight: 600,
                        fontSize: "1rem",
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        display: "block",
                        color: "white",
                        textDecoration: "none",
                        transition: "0.2s",
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
                        marginBottom: 8,
                        marginTop: 6,
                      }}
                    >
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          background: "#1e293b",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                          fontSize: "1rem",
                          transition: "0.15s",
                        }}
                      >
                        –
                      </button>

                      <span
                        style={{
                          minWidth: 24,
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}
                      >
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => increaseQuantity(item.id)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          background: "#1e293b",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                          fontSize: "1rem",
                          transition: "0.15s",
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div
                      style={{
                        color: "#c084fc",
                        fontWeight: 700,
                        fontSize: "1rem",
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
                      color: "#f87171",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      transition: "0.15s",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* SUMMARY CARD */}
            <aside
              style={{
                borderRadius: "20px",
                background: "#0f172a",
                border: "1px solid rgba(148,163,184,0.15)",
                padding: "24px 20px 28px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Order Summary
              </h2>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1rem",
                }}
              >
                <span>Subtotal</span>
                <span style={{ fontWeight: 700 }}>
                  {total.toFixed(2)} AED
                </span>
              </div>

              <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                Payment & shipping will be handled manually for now.
              </p>

              <button
                onClick={clearCart}
                style={{
                  marginTop: 12,
                  padding: "12px 18px",
                  borderRadius: 999,
                  border: "1px solid rgba(239,68,68,0.8)",
                  background: "transparent",
                  color: "#fecaca",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "0.2s",
                }}
              >
                Clear Cart
              </button>

              <Link
                href="/products"
                style={{
                  marginTop: 8,
                  padding: "12px 18px",
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #a855f7, #c084fc)",
                  color: "#020617",
                  fontWeight: 700,
                  textAlign: "center",
                  textDecoration: "none",
                  boxShadow: "0 10px 28px rgba(192,132,252,0.35)",
                }}
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
