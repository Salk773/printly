"use client";

import { useCart } from "@/context/CartProvider";
import { useRouter } from "next/navigation";

export default function SideCart() {
  const {
    items,
    isCartOpen,
    closeCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    total,
  } = useCart();

  const router = useRouter();

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: 320,
        height: "100vh",
        background: "#0f172a",
        padding: 16,
        overflowY: "auto",
        zIndex: 9999,
        transform: isCartOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s ease",
        borderLeft: "1px solid rgba(148,163,184,0.3)",
        boxShadow: "0 0 20px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>
        Your Cart
      </div>

      <button
        onClick={closeCart}
        style={{
          marginBottom: 20,
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid #475569",
          background: "transparent",
          color: "white",
          cursor: "pointer",
        }}
      >
        Close
      </button>

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            borderBottom: "1px solid #334155",
            paddingBottom: 12,
            marginBottom: 12,
          }}
        >
          {/* CLICKABLE PRODUCT LINK */}
          <div
            onClick={() => {
              closeCart();
              router.push(`/products/${item.id}`); // FIXED ROUTE
            }}
            style={{
              display: "flex",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <img
              src={item.image}
              width={60}
              height={60}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />

            <div>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ opacity: 0.7 }}>{item.price} AED</div>
            </div>
          </div>

          {/* QUANTITY CONTROLS */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 10,
              alignItems: "center",
            }}
          >
            <button
              onClick={() => decreaseQuantity(item.id)}
              style={{
                padding: "4px 8px",
                background: "#1e293b",
                borderRadius: 6,
                cursor: "pointer",
                border: "none",
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
                cursor: "pointer",
                border: "none",
                color: "white",
              }}
            >
              +
            </button>

            <button
              onClick={() => removeItem(item.id)}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                color: "#f87171",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 20, fontSize: 18, fontWeight: 600 }}>
        Total: {total.toFixed(2)} AED
      </div>
    </div>
  );
}
