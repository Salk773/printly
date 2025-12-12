"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartProvider";
import { useWishlist } from "@/context/WishlistProvider";

export default function SideCart() {
  const {
    items,
    sideCartOpen,
    toggleSideCart,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    total,
  } = useCart();

  const { toggleWishlist, isInWishlist } = useWishlist();

  return (
    <>
      {/* BACKDROP */}
      {sideCartOpen && (
        <div
          onClick={toggleSideCart}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(3px)",
            zIndex: 90,
          }}
        />
      )}

      {/* PANEL */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: sideCartOpen ? 0 : "-420px",
          width: 360,
          height: "100vh",
          background: "#0f172a",
          borderLeft: "1px solid rgba(148,163,184,0.25)",
          padding: 16,
          zIndex: 99,
          transition: "right 0.3s ease",
          overflowY: "auto",
        }}
      >
        <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>Your cart</h2>

        {items.length === 0 && (
          <p style={{ color: "#94a3b8" }}>Cart is empty.</p>
        )}

        {items.map((item) => {
          const inWishlist = isInWishlist(item.id);

          return (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr auto",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <Link
                href={`/products/${item.id}`}
                onClick={toggleSideCart}
                style={{
                  position: "relative",
                  width: 70,
                  height: 70,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </Link>

              <div>
                <Link
                  href={`/products/${item.id}`}
                  onClick={toggleSideCart}
                  style={{
                    color: "white",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {item.name}
                </Link>

                <div style={{ marginTop: 6 }}>
                  <button onClick={() => decreaseQuantity(item.id)} style={qtyBtn}>
                    –
                  </button>
                  <span style={{ margin: "0 8px" }}>{item.quantity}</span>
                  <button onClick={() => increaseQuantity(item.id)} style={qtyBtn}>
                    +
                  </button>
                </div>

                {/* ❤️ Wishlist */}
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
                    marginTop: 6,
                    background: "transparent",
                    border: "none",
                    color: inWishlist ? "#fb7185" : "#64748b",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  {inWishlist ? "♥ Wishlisted" : "♡ Wishlist"}
                </button>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#f87171",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          );
        })}

        {/* TOTAL */}
        {items.length > 0 && (
          <div
            style={{
              marginTop: 20,
              fontWeight: 700,
              fontSize: "1.1rem",
            }}
          >
            Total: {total.toFixed(2)} AED
          </div>
        )}

        {/* BUTTONS */}
        {items.length > 0 && (
          <Link
            href="/cart"
            onClick={toggleSideCart}
            style={{
              display: "block",
              marginTop: 20,
              padding: "10px 16px",
              textAlign: "center",
              borderRadius: 999,
              background: "#c084fc",
              color: "#020617",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Go to cart →
          </Link>
        )}
      </div>
    </>
  );
}

const qtyBtn = {
  padding: "3px 8px",
  borderRadius: 6,
  background: "#1e293b",
  border: "none",
  cursor: "pointer",
  color: "white",
};
