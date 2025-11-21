"use client";

import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const {
    items,
    total,
    count,
    isOpen,
    closeCart,
    removeItem,
    clearCart,
  } = useCart();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: isOpen ? 0 : "-420px",
        width: "380px",
        height: "100vh",
        background: "#0f172a",
        color: "#fff",
        padding: "20px",
        transition: "right 0.3s ease",
        zIndex: 2000,
        boxShadow: "-6px 0 14px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ fontSize: "1.4rem" }}>My Cart ({count})</h2>
        <button
          onClick={closeCart}
          style={{
            background: "transparent",
            border: "1px solid #475569",
            borderRadius: "6px",
            padding: "4px 8px",
            cursor: "pointer",
            color: "#e2e8f0",
          }}
        >
          ✕
        </button>
      </div>

      {/* ITEMS */}
      <div style={{ flexGrow: 1, overflowY: "auto" }}>
        {items.length === 0 ? (
          <p style={{ textAlign: "center", opacity: 0.6 }}>Cart is empty.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "10px",
                borderBottom: "1px solid #334155",
              }}
            >
              <img
                src={item.image}
                alt={item.name}
                style={{
                  width: "70px",
                  height: "70px",
                  objectFit: "cover",
                  borderRadius: "6px",
                  marginRight: "12px",
                }}
              />
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ opacity: 0.7, fontSize: "0.9rem" }}>
                  {item.quantity} × {item.price} AED
                </div>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                style={{
                  background: "transparent",
                  color: "#ef4444",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* FOOTER */}
      <div
        style={{
          marginTop: "auto",
          borderTop: "1px solid #334155",
          paddingTop: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "1.1rem",
            marginBottom: "12px",
          }}
        >
          <span>Total:</span>
          <span style={{ fontWeight: 700 }}>{total} AED</span>
        </div>

        <button
          onClick={clearCart}
          style={{
            width: "100%",
            padding: "10px",
            background: "#ef4444",
            border: "none",
            color: "white",
            fontWeight: 600,
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "6px",
          }}
        >
          Clear Cart
        </button>

        <a
          href="/cart"
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            background: "#c084fc",
            color: "#000",
            textAlign: "center",
            borderRadius: "8px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Go to Checkout →
        </a>
      </div>
    </div>
  );
}
