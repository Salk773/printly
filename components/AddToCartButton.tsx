// /components/AddToCartButton.tsx
"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartProvider";

type AddToCartButtonProps = {
  product: {
    id: string;
    name: string;
    price: number;
    image_main: string;
  };
  className?: string;
};

export default function AddToCartButton({
  product,
  className = "",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 20);
    return () => window.clearTimeout(t);
  }, []);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_main,
      });
    } finally {
      // a tiny delay so the loading state is visible but not annoying
      setTimeout(() => setIsLoading(false), 250);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`
        group inline-flex w-full items-center justify-center gap-2 rounded-lg 
        bg-gradient-to-r from-[#c084fc] to-[#a855f7] px-4 py-2.5 text-sm font-medium 
        text-slate-950 shadow-lg shadow-[#a855f7]/30 
        transition-all duration-300
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}
        ${isLoading ? "cursor-wait opacity-80" : "hover:scale-[1.02] hover:opacity-95"}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-950/40 border-t-transparent" />
          <span>Adding...</span>
        </>
      ) : (
        <>
          <span>Add to cart</span>
          <span className="text-xs opacity-80 group-hover:translate-x-0.5 transition-transform">
            +
          </span>
        </>
      )}
    </button>
  );
}
