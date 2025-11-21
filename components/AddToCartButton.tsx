// components/AddToCartButton.tsx
"use client";

import { useState } from "react";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number | null;
    image_main: string | null;
  };
}

type CartItem = {
  id: string;
  name: string;
  price: number | null;
  image_main: string | null;
  quantity: number;
};

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    setAdding(true);

    try {
      const raw = localStorage.getItem("printly_cart");
      const current: CartItem[] = raw ? JSON.parse(raw) : [];

      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        current.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image_main: product.image_main,
          quantity: 1,
        });
      }

      localStorage.setItem("printly_cart", JSON.stringify(current));
      alert("Added to cart ✅");
    } catch (e) {
      console.error(e);
      alert("Could not add to cart");
    }

    setAdding(false);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={adding}
      style={{
        marginTop: "20px",
        padding: "10px 18px",
        borderRadius: "999px",
        border: "none",
        background: "#c084fc",
        color: "#000",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {adding ? "Adding..." : "Add to cart"}
    </button>
  );
}
