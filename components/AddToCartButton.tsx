"use client";

import { useCart } from "@/lib/cartContext";
import toast from "react-hot-toast";

export default function AddToCartButton({
  id,
  name,
  price,
  image,
}: {
  id: string;
  name: string;
  price: number;
  image: string;
}) {
  const { addItem } = useCart();

  const handleClick = () => {
    addItem({
      id,
      name,
      price,
      image,
      quantity: 1, // 🔥 REQUIRED
    });

    toast.success("Added to cart", {
      icon: "🛒",
    });
  };

  return (
    <button
      onClick={handleClick}
      style={{
        marginTop: "10px",
        padding: "10px 18px",
        borderRadius: "6px",
        background: "#c084fc",
        color: "#000",
        cursor: "pointer",
        fontWeight: 600,
        border: "none",
      }}
    >
      Add to Cart
    </button>
  );
}
