"use client";

import { useCart } from "@/context/CartProvider";
import { useWishlist } from "@/context/WishlistProvider";
import { useRouter } from "next/navigation";

export default function SideCart() {
  const {
    items,
    sideCartOpen,
    toggleSideCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    total,
  } = useCart();

  const { isInWishlist, toggleWishlist } = useWishlist();
  const router = useRouter();

  const closeCart = () => toggleSideCart();
  const hasItems = items.length > 0;

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={closeCart}
        style={{
          position: "fixed",
          inset: 0,
          background: sideCartOpen ? "rgba(0,0,0,0.45)" : "transparent",
          backdropFilter: sideCartOpen ? "blur(2px)" : "none",
          opacity: sideCartOpen ? 1 : 0,
          transition: "opacity 0.35s ease",
          pointerEvents: sideCartOpen ? "auto" : "none",
          zIndex: 9998,
        }}
      />

      {/* SIDE CART */}
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
          transform: sideCartOpen ? "translateX(0)" : "translateX(102%)",
          transition: "transform 0.45s cubic-bezier(0.25, 1, 0.3, 1)",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          boxShadow: sideCartOpen
            ? "-6px 0 28px rgba(0,0,0,0.55)"
            : "-3px 0 22px rgba(0,0,0,0.25)",
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
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "white",
            }}
          >
            Your Cart
          </h2>

          <button
            onClick={closeCart}
            style={{
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              fontSize: "1.3rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* EMPTY */}
        {!hasItems && (
          <p style={{ color: "#94a3b8", marginTop: 20 }}>
            Your cart is empty.
          </p>
        )}

        {/* ITEMS */}
        {items.map((item) => {
          const inWishlist = isInWishlist(item.id);

          return (
            <div
              key={item.id}
              style={{
                borderBottom: "1px solid rgba(148,163,184,0.12)",
                paddingBottom: 12,
                marginBottom: 14,
              }}
            >
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
                  alt={item.name}
                  style={{
                    borderRadius: 12,
                    objectFit: "cover",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                  }}
                />

                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 4,
                      fontSize: "0.95rem",
                      color: "white",
                    }}
                  >
                    {item.name}
                  </div>

                  <div style={{ fontSize: "0.85rem", color: "#c084fc" }}>
                    {item.price} AED
                  </div>
                </div>
              </div>

              {/* CONTROLS */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 10,
                }}
              >
                <button
                  onClick={() => decreaseQuantity(item.id)}
                  style={qtyBtn}
                >
                  –
                </button>

                <span style={{ fontWeight: 600, color: "white" }}>
                  {item.quantity}
                </span>

                <button
                  onClick={() => increaseQuantity(item.id)}
                  style={qtyBtn}
                >
                  +
                </button>

                {/* ❤️ WISHLIST */}
                <button
                  onClick={() =>
                    toggleWishlist({
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      image: item.image,
                    })
                  }
                  style={{
                    marginLeft: "auto",
                    background: inWishlist
                      ? "rgba(192,132,252,0.2)"
                      : "rgba(148,163,184,0.07)",
                    color: inWishlist ? "#c084fc" : "#94a3b8",
                    border: inWishlist
                      ? "1px solid rgba(192,132,252,0.45)"
                      : "1px solid rgba(148,163,184,0.15)",
                    borderRadius: 50,
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                  }}
                >
                  {inWishlist ? "♥" : "♡"}
                </button>

                {/* REMOVE */}
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f87171",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}

        {/* FOOTER */}
        {hasItems && (
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

            {/* CHECKOUT */}
            <button
              onClick={() => {
                closeCart();
                router.push("/checkout");
              }}
              style={checkoutBtn}
            >
              Checkout
            </button>

            {/* VIEW CART */}
            <button
              onClick={() => {
                closeCart();
                router.push("/cart");
              }}
              style={{
                ...checkoutBtn,
                marginTop: 10,
                background: "transparent",
                color: "white",
                border: "1px solid rgba(148,163,184,0.25)",
                boxShadow: "none",
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

/* STYLES */

const qtyBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: "#1e293b",
  border: "none",
  color: "white",
  cursor: "pointer",
  fontSize: "1rem",
};

const checkoutBtn: React.CSSProperties = {
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
};
