"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCart();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main
      style={{
        background: "#0a0a0a",
        minHeight: "100vh",
        padding: "40px",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>🛒 Your Cart</h1>

      {cart.length === 0 ? (
        <p style={{ color: "#bbb", marginTop: "20px" }}>
          Your cart is empty.
        </p>
      ) : (
        <>
          {/* Cart Items */}
          <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
            {cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: "20px",
                  padding: "20px",
                  background: "#111",
                  borderRadius: "12px",
                  alignItems: "center",
                }}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={120}
                    height={120}
                    style={{
                      borderRadius: "8px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      background: "#222",
                      borderRadius: "8px",
                    }}
                  />
                )}

                <div style={{ flexGrow: 1 }}>
                  <h3 style={{ marginBottom: "5px" }}>{item.name}</h3>
                  <p style={{ color: "#bbb" }}>
                    {item.price} AED × {item.quantity}
                  </p>
                  <p style={{ marginTop: "6px", fontWeight: 600 }}>
                    {item.price * item.quantity} AED
                  </p>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{
                    background: "red",
                    border: "none",
                    padding: "10px 15px",
                    borderRadius: "8px",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div
            style={{
              padding: "20px",
              background: "#111",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <h2>Total: {total} AED</h2>
          </div>

          {/* Clear Cart Button */}
          <button
            onClick={clearCart}
            style={{
              padding: "12px 20px",
              background: "#c084fc",
              border: "none",
              borderRadius: "8px",
              color: "#000",
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
