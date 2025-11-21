"use client";

import { useCart } from "@/context/CartContext";
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

  const handleAdd = () => {
    addItem({ id, name, price, image, quantity: 1 });
    toast.success("Added to cart!");
  };

  return (
    <button
      onClick={handleAdd}
      style={{
        padding: "10px 16px",
        backgroundColor: "#c084fc",
        color: "#000",
        border: "none",
        borderRadius: "6px",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Add to Cart
    </button>
  );
}
