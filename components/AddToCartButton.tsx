"use client";

import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

export default function AddToCartButton({ product }: { product: any }) {
  const { addItem } = useCart();

  const handleClick = () => {
    addItem(product);
    toast.success("Added to cart", {
      style: {
        background: "#1e1e1e",
        color: "#fff",
        borderRadius: "8px",
      },
    });
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: "6px 14px",
        background: "#c084fc",
        border: "none",
        borderRadius: "6px",
        color: "#000",
        fontWeight: 600,
        fontSize: "0.85rem",
        cursor: "pointer",
        transition: "0.2s",
      }}
    >
      Add
    </button>
  );
}
