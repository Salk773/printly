"use client";

import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, removeItem, clearCart } = useCart();

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main
      style={{
        padding: "40px",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>Your Cart</h1>

      {items.length === 0 ? (
        <p style={{ color: "#bbb" }}>Your cart is empty.</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#111",
                  padding: "15px",
                  borderRadius: "10px",
                  border: "1px solid #222",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                {/* Product Image */}
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "8px",
                    objectFit: "cover",
                  }}
                />

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: "5px" }}>{item.name}</h3>
                  <p style={{ color: "#c084fc", fontWeight: 600 }}>
                    {item.price} AED × {item.quantity}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: "red",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <h2 style={{ marginBottom: "20px" }}>
            Total:{" "}
            <span style={{ color: "#c084fc" }}>
              {total.toFixed(2)} AED
            </span>
          </h2>

          {/* Clear Cart Button */}
          <button
            onClick={clearCart}
            style={{
              background: "#c084fc",
              color: "#000",
              border: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear Cart
          </button>
        </>
      )}
    </main>
  );
}
