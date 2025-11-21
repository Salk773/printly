"use client";

import Image from "next/image";
import { useCart } from "@/lib/cartContext";

export default function CartDrawer() {
  const {
    items,
    total,
    count,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={closeCart}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
          }}
        />
      )}

      {/* Drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "360px",
          maxWidth: "100%",
          background:
            "linear-gradient(145deg, rgba(10,10,15,0.98), rgba(20,0,40,0.98))",
          color: "#fff",
          zIndex: 50,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease-out",
          boxShadow: isOpen ? "-8px 0 30px rgba(0,0,0,0.6)" : "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>Cart</div>
            <div style={{ fontSize: "0.8rem", color: "#aaa" }}>
              {count === 0 ? "Your cart is empty" : `${count} item(s)`} ·{" "}
              <span>{total.toFixed(2)} AED</span>
            </div>
          </div>
          <button
            onClick={closeCart}
            style={{
              border: "none",
              background: "transparent",
              color: "#ccc",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 16px 80px",
          }}
        >
          {items.length === 0 && (
            <p style={{ color: "#aaa", fontSize: "0.9rem", marginTop: "8px" }}>
              Add products from the store to see them here.
            </p>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "14px",
                padding: "10px",
                borderRadius: "10px",
                background: "rgba(0,0,0,0.4)",
              }}
            >
              <div
                style={{
                  width: 70,
                  height: 70,
                  position: "relative",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "#111",
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
                      fontSize: "0.7rem",
                      color: "#666",
                    }}
                  >
                    No image
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#aaa",
                    marginTop: "2px",
                  }}
                >
                  {item.price.toFixed(2)} AED
                </div>

                {/* Qty controls */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "6px",
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
                  <span style={{ minWidth: 24, textAlign: "center" }}>
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
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.id)}
                aria-label="Remove item"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#f97373",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "14px 16px 18px",
            background: "rgba(0,0,0,0.7)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span style={{ color: "#aaa", fontSize: "0.9rem" }}>Total</span>
            <span style={{ fontWeight: 600 }}>
              {total.toFixed(2)} AED
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <a
              href="/cart"
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 0",
                borderRadius: "999px",
                textDecoration: "none",
                background:
                  "linear-gradient(135deg, #c084fc, #7c3aed, #22d3ee)",
                color: "#020617",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
              onClick={closeCart}
            >
              Review Cart
            </a>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  padding: "10px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "transparent",
                  color: "#e5e7eb",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>
          <p
            style={{
              marginTop: "6px",
              fontSize: "0.72rem",
              color: "#9ca3af",
            }}
          >
            This is a preview cart. Checkout logic can be wired to WhatsApp,
            email, or payment gateway later.
          </p>
        </div>
      </aside>
    </>
  );
}

const qtyButtonStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.5)",
  background: "rgba(15,23,42,0.8)",
  color: "#e5e7eb",
  fontSize: "0.8rem",
  cursor: "pointer",
};
