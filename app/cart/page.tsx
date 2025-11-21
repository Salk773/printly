"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cartContext";

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();

  const hasItems = items.length > 0;

  return (
    <main>
      <h1 style={{ fontSize: "1.6rem", marginBottom: "12px" }}>Your Cart</h1>
      <p style={{ color: "#9ca3af", marginBottom: "24px" }}>
        This is a preview cart. Later you can connect this to WhatsApp orders,
        email quotes, or online payments.
      </p>

      {!hasItems && (
        <div
          style={{
            padding: "24px",
            borderRadius: "16px",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,64,175,0.5))",
            border: "1px solid rgba(148,163,184,0.4)",
          }}
        >
          <p style={{ marginBottom: "12px" }}>Your cart is currently empty.</p>
          <Link
            href="/products"
            style={{
              display: "inline-flex",
              padding: "10px 18px",
              borderRadius: 999,
              background:
                "linear-gradient(135deg, #c4b5fd, #a855f7, #22d3ee)",
              color: "#020617",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.9rem",
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
            gap: "24px",
            gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          }}
        >
          {/* Items list */}
          <div
            style={{
              borderRadius: "16px",
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.4)",
              padding: "18px",
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: "14px",
                  marginBottom: "14px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid rgba(55,65,81,0.7)",
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "#020617",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        color: "#6b7280",
                      }}
                    >
                      No image
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      marginBottom: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{ fontSize: "0.85rem", color: "#9ca3af" }}
                  >
                    {item.price.toFixed(2)} AED
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      style={qtyButtonStyle}
                    >
                      −
                    </button>
                    <span
                      style={{ minWidth: 26, textAlign: "center" }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      style={qtyButtonStyle}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        marginLeft: "auto",
                        border: "none",
                        background: "transparent",
                        color: "#f97373",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              style={{
                marginTop: 8,
                borderRadius: 999,
                border: "1px solid rgba(248,113,113,0.7)",
                background: "transparent",
                color: "#fecaca",
                fontSize: "0.8rem",
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              Clear cart
            </button>
          </div>

          {/* Summary */}
          <div>
            <div
              style={{
                borderRadius: "16px",
                background:
                  "radial-gradient(circle at top, rgba(30,64,175,0.7), rgba(15,23,42,0.9))",
                border: "1px solid rgba(129,140,248,0.5)",
                padding: "18px",
              }}
            >
              <h2
                style={{ fontSize: "1rem", marginBottom: 10 }}
              >
                Order summary
              </h2>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  fontSize: "0.9rem",
                }}
              >
                <span>Subtotal</span>
                <span>{total.toFixed(2)} AED</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                }}
              >
                <span>Shipping</span>
                <span>Calculated manually</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                <span>Total</span>
                <span>{total.toFixed(2)} AED</span>
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#d1d5db",
                  marginBottom: 10,
                }}
              >
                For now, to place an order, send us a screenshot of this summary
                on{" "}
                <span style={{ fontWeight: 600 }}>
                  WhatsApp or email.
                </span>
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                <a
                  href="https://wa.me/971509363626"
                  target="_blank"
                  rel="noreferrer"
                  style={checkoutBtnStyle}
                >
                  Message on WhatsApp
                </a>
                <a
                  href="mailto:contact@printly.ae"
                  style={{
                    ...checkoutBtnStyle,
                    background: "transparent",
                    color: "#e5e7eb",
                    border: "1px solid rgba(148,163,184,0.6)",
                    boxShadow: "none",
                  }}
                >
                  Send order via email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const qtyButtonStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.7)",
  background: "rgba(15,23,42,0.9)",
  color: "#e5e7eb",
  fontSize: "0.8rem",
  cursor: "pointer",
};

const checkoutBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "10px 14px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "#022c22",
  fontWeight: 600,
  fontSize: "0.9rem",
  textDecoration: "none",
  boxShadow: "0 10px 25px rgba(22,163,74,0.35)",
};
