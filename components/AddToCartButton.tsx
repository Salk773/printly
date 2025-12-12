"use client";

import { useState } from "react";
import { useCart } from "@/context/CartProvider";
import toast from "react-hot-toast";

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
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    setPressed(true);
    addItem({ id, name, price, image, quantity: 1 });
    toast.success("Added to cart ✅");
    setTimeout(() => setPressed(false), 150);
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
        boxShadow: pressed
          ? "0 4px 12px rgba(192,132,252,0.3)"
          : "0 8px 24px rgba(192,132,252,0.35)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
      }}
    >
      🛒 Add to cart
    </button>
  );
}
