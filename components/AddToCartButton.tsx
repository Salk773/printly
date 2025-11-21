"use client";

import { useState } from "react";
import { useCart } from "@/lib/cartContext";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    image_main?: string | null;
  };
};

export default function AddToCartButton({ product }: Props) {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = () => {
    if (loading) return;
    setLoading(true);

    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_main ?? undefined,
      },
      1
    );

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 18px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.9rem",
        background:
          "linear-gradient(135deg, #c084fc, #7c3aed, #22d3ee)",
        color: "#020617",
        boxShadow: "0 10px 25px rgba(59,130,246,0.35)",
      }}
    >
      {loading ? "Adding..." : "Add to Cart"}
      {justAdded && (
        <span style={{ fontSize: "1rem" }} aria-hidden="true">
          ✅
        </span>
      )}
    </button>
  );
}
