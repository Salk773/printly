"use client";

import { useCart } from "@/context/CartContext";

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
    addItem({
      id,
      name,
      price,
      image,
      quantity: 1,
    });
  };

  return (
    <button
      onClick={handleAdd}
      style={{
        padding: "10px 14px",
        backgroundColor: "#c084fc",
        color: "#000",
        border: "none",
        borderRadius: "6px",
        fontWeight: 600,
        cursor: "pointer",
        width: "100%",
      }}
    >
      Add to Cart
    </button>
  );
}
