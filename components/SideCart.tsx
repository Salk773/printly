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
    <>
      {/* OVERLAY BACKDROP */}
      <div
        onClick={closeCart}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: isCartOpen ? "rgba(0,0,0,0.45)" : "transparent",
          backdropFilter: isCartOpen ? "blur(2px)" : "none",
          opacity: isCartOpen ? 1 : 0,
          transition: "opacity 0.25s ease",
          pointerEvents: isCartOpen ? "auto" : "none",
          zIndex: 9998,
        }}
      />

      {/* SIDE CART DRAWER */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          width: 330,
          height: "100vh",
          background: "rgba(15,23,42,0.92)",
          backdropFilter: "blur(18px)",
          padding: 18,
          overflowY: "auto",
          zIndex: 9999,
          transform: isCartOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.2,0.8,0.4,1)",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "-4px 0 26px rgba(0,0,0,0.45)",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 18,
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Your Cart</h2>

          <button
            onClick={closeCart}
            style={{
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              fontSize: "1.3rem",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            ✕
          </button>
        </div>

        {/* CART ITEMS */}
        {items.length === 0 && (
          <p style={{ color: "#94a3b8", marginTop: 20 }}>Your cart is empty.</p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            style={{
              borderBottom: "1px solid rgba(148,163,184,0.12)",
              paddingBottom: 12,
              marginBottom: 14,
            }}
          >
            {/* CLICKABLE PRODUCT AREA */}
            <div
              onClick={() => {
                closeCart();
                router.push(`/products/${item.id}`);
              }}
              style={{
                display: "flex",
                gap: 12,
                cursor: "pointer",
              }}
            >
              <img
                src={item.image}
                width={70}
                height={70}
                style={{
                  borderRadius: 12,
                  objectFit: "cover",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                  transition: "0.25s",
                }}
              />

              <div>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 4,
                    fontSize: "0.95rem",
                  }}
                >
                  {item.name}
                </div>

                <div style={{ fontSize: "0.85rem", color: "#c084fc" }}>
                  {item.price} AED
                </div>
              </div>
            </div>

            {/* QUANTITY + REMOVE */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 10,
              }}
            >
              {/* QUANTITY BUTTONS */}
              <button
                onClick={() => decreaseQuantity(item.id)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#1e293b",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "0.2s",
                }}
              >
                –
              </button>

              <span style={{ fontWeight: 600 }}>{item.quantity}</span>

              <button
                onClick={() => increaseQuantity(item.id)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#1e293b",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "0.2s",
                }}
              >
                +
              </button>

              {/* REMOVE */}
              <button
                onClick={() => removeItem(item.id)}
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "none",
                  color: "#f87171",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  transition: "0.2s",
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {/* FOOTER — TOTAL + VIEW CART BUTTON */}
        {items.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1rem",
                fontWeight: 700,
                color: "white",
                marginBottom: 14,
              }}
            >
              <span>Total</span>
              <span>{total.toFixed(2)} AED</span>
            </div>

            <button
              onClick={() => {
                closeCart();
                router.push("/cart");
              }}
              style={{
                width: "100%",
                padding: "12px 18px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #c084fc, #a855f7)",
                color: "#020617",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.95rem",
                boxShadow: "0 8px 20px rgba(192,132,252,0.35)",
                transition: "0.2s",
              }}
            >
              View Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
