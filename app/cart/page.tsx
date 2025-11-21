// app/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type CartItem = {
  id: string;
  name: string;
  price: number | null;
  image_main: string | null;
  quantity: number;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("printly_cart");
      const parsed: CartItem[] = raw ? JSON.parse(raw) : [];
      setItems(parsed);
    } catch {
      setItems([]);
    }
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) => {
      const updated = prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0);

      localStorage.setItem("printly_cart", JSON.stringify(updated));
      return updated;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem("printly_cart", JSON.stringify(updated));
      return updated;
    });
  };

  const total = items.reduce((sum, item) => {
    const price = item.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <main
      style={{
        background: "#0a0a0a",
        color: "#fff",
        minHeight: "100vh",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>Cart</h1>

        {items.length === 0 ? (
          <p style={{ color: "#c0c0d0" }}>
            Your cart is empty. Add some products first.
          </p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "16px",
                    background: "#111118",
                    borderRadius: "12px",
                    border: "1px solid #262637",
                    padding: "12px",
                    alignItems: "center",
                  }}
                >
                  {item.image_main && (
                    <Image
                      src={item.image_main}
                      alt={item.name}
                      width={80}
                      height={80}
                      unoptimized
                      style={{
                        borderRadius: "8px",
                        objectFit: "cover",
                        background: "#000",
                      }}
                    />
                  )}

                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0 }}>{item.name}</h3>
                    <p style={{ margin: "4px 0", color: "#c0c0d0" }}>
                      {item.price != null ? `${item.price} AED` : "TBD"}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "6px",
                      }}
                    >
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{
                          borderRadius: "999px",
                          padding: "4px 10px",
                          border: "1px solid #262637",
                          background: "#0b0b10",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{
                          borderRadius: "999px",
                          padding: "4px 10px",
                          border: "1px solid #262637",
                          background: "#0b0b10",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>

                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          marginLeft: "auto",
                          borderRadius: "999px",
                          padding: "4px 12px",
                          border: "none",
                          background: "red",
                          color: "#fff",
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
            </div>

            <div
              style={{
                borderTop: "1px solid #262637",
                paddingTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "1rem" }}>Total</span>
              <span
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "#c084fc",
                }}
              >
                {total.toFixed(2)} AED
              </span>
            </div>

            <button
              style={{
                marginTop: "18px",
                width: "100%",
                padding: "10px 18px",
                borderRadius: "999px",
                border: "none",
                background: "#c084fc",
                color: "#000",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() =>
                alert(
                  "Checkout will be implemented later. For now, this is a preview cart."
                )
              }
            >
              Checkout (coming soon)
            </button>
          </>
        )}
      </div>
    </main>
  );
}
