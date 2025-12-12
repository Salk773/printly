"use client";

import { useCart } from "@/context/CartProvider";

type AddToCartButtonProps = {
  id: string;
  name: string;
  price: number;
  image: string;
  small?: boolean;
};

export default function AddToCartButton({
  id,
  name,
  price,
  image,
  small,
}: AddToCartButtonProps) {
  const { addItem } = useCart();

  const handleClick = () => {
    addItem({ id, name, price, image, quantity: 1 });
    // ❌ removed toast
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: small ? "6px 12px" : "10px 18px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        fontSize: small ? "0.8rem" : "0.9rem",
        fontWeight: 600,
        background: "linear-gradient(135deg, #c084fc, #a855f7)",
        color: "#020617",
        boxShadow: "0 8px 24px rgba(192,132,252,0.25)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      🛒 Add to cart
    </button>
  );
}
