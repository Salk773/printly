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

  if (!isCartOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: 320,
        height: "100vh",
        background: "#111",
        padding: 16,
        overflowY: "auto",
        zIndex: 9999,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 600 }}>Your Cart</div>

      <button
        onClick={closeCart}
        style={{ marginTop: 10, marginBottom: 20 }}
      >
        Close
      </button>

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            borderBottom: "1px solid #333",
            paddingBottom: 10,
            marginBottom: 10,
          }}
        >
          <div
            style={{ display: "flex", gap: 10, cursor: "pointer" }}
            onClick={() => {
              closeCart();
              router.push(`/product/${item.id}`);
            }}
          >
            <img src={item.image} width={60} height={60} />
            <div>
              <div>{item.name}</div>
              <div style={{ opacity: 0.7 }}>{item.price} AED</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => decreaseQuantity(item.id)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => increaseQuantity(item.id)}>+</button>
            <button onClick={() => removeItem(item.id)}>Remove</button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 20, fontSize: 18 }}>
        Total: {total.toFixed(2)} AED
      </div>
    </div>
  );
}
