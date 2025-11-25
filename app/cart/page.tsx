"use client";

import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, total, removeItem, clearCart } = useCart();

  return (
    <div style={{ marginTop: 24 }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: 12 }}>Cart</h1>

      {items.length === 0 && (
        <p style={{ color: "#9ca3af" }}>Your cart is currently empty.</p>
      )}

      {items.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 20
            }}
          >
            {items.map(item => (
              <div
                key={item.id}
                className="card-soft"
                style={{
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      marginBottom: 2
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#9ca3af"
                    }}
                  >
                    {item.quantity} × {item.price.toFixed(2)} AED
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {(item.price * item.quantity).toFixed(2)} AED
                  </div>
                  <button
                    className="btn-danger"
                    onClick={() => removeItem(item.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div
            className="card-soft"
            style={{
              padding: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
                Total
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600
                }}
              >
                {total.toFixed(2)} AED
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" onClick={clearCart}>
                Clear cart
              </button>
              <button className="btn-primary" disabled>
                Checkout (coming soon)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
