"use client";

import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

export default function AddToCartButton({
  id,
  name,
  price,
  image,
  compact = false
}: {
  id: string;
  name: string;
  price: number;
  image: string;
  compact?: boolean;
}) {
  const { addItem } = useCart();

  const handleClick = () => {
    addItem({ id, name, price, image });
    toast.success("Added to cart", {
      icon: "✅"
    });
  };

  return (
    <button
      onClick={handleClick}
      className={compact ? "btn-ghost" : "btn-primary"}
      style={compact ? { fontSize: "0.8rem" } : undefined}
    >
      Add to cart
    </button>
  );
}
