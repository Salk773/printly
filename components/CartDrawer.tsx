"use client";

import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const { items, total, count, isOpen, closeCart, removeItem, clearCart } =
    useCart();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "350px",
        height: "100vh",
        background: "#0f172a",
        borderLeft: "1px solid #334155",
        padding: "20px",
        color: "#fff",
        zIndex: 9999,
        boxShadow: "-5px 0 20px rgba(0,0,0,0.3)",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>Your Cart ({count})</h2>

      {/* LIST ITEMS */}
      <div style={{ maxHeight: "65vh", overflowY: "auto" }}>
        {items.length === 0 && (
          <p style={{ color: "#94a3b8" }}>Your cart is empty.</p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
              borderBottom: "1px solid #1e293b",
              paddingBottom: "12px",
            }}
          >
            <img
              src={item.image}
              alt={item.name}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "8px",
                objectFit: "cover",
                marginRight: "12px",
              }}
            />

            <div style={{ flexGrow: 1 }}>
              <p style={{ fontWeight: 500 }}>{item.name}</p>
              <p style={{ fontSize: "0.9rem", color: "#cbd5e1" }}>
                {item.quantity} × {item.price} AED
              </p>
            </div>

            <button
              onClick={() => removeItem(item.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "#f87171",
                fontSize: "1.2rem",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* FOOTER TOTAL + BUTTONS */}
      <div
        style={{
          marginTop: "20px",
          borderTop: "1px solid #1e293b",
          paddingTop: "16px",
        }}
      >
        <h3>Total: {total} AED</h3>

        <button
          onClick={clearCart}
          style={{
            width: "100%",
            padding: "10px",
            background: "#ef4444",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            marginTop: "10px",
            cursor: "pointer",
          }}
        >
          Clear Cart
        </button>

        <button
          onClick={closeCart}
          style={{
            width: "100%",
            padding: "10px",
            background: "#334155",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            marginTop: "10px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
