"use client";

import { useEffect, useState } from "react";
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

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fade-in animation on mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);

    try {
      addItem({ id, name, price, image, quantity: 1 });
    } finally {
      setTimeout(() => setLoading(false), 300); // small delay for effect
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: small ? "6px 12px" : "10px 18px",
        borderRadius: 999,
        border: "none",
        cursor: loading ? "wait" : "pointer",
        fontSize: small ? "0.8rem" : "0.9rem",
        fontWeight: 600,
        background: "linear-gradient(135deg, #c084fc, #a855f7)",
        color: "#020617",
        boxShadow: "0 8px 24px rgba(192,132,252,0.25)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(4px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
        pointerEvents: loading ? "none" : "auto",
        scale: loading ? 0.98 : 1,
      }}
    >
      {/* LOADING SPINNER */}
      {loading ? (
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid rgba(2,6,23,0.3)",
            borderTopColor: "#020617",
            animation: "spin 0.6s linear infinite",
          }}
        />
      ) : (
        <>🛒 Add to cart</>
      )}

      {/* Spinner keyframes */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </button>
  );
}
