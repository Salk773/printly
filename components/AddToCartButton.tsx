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
  image: string | null;
}) {
  const { addToCart } = useCart();

  const handleClick = () => {
    addToCart({ id, name, price, image, quantity: 1 });
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: "8px 14px",
        borderRadius: "8px",
        background: "#c084fc",
        border: "none",
        color: "#000",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Add to Cart
    </button>
  );
}
