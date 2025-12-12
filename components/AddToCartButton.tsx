"use client";

import { useCart } from "@/context/CartProvider";

export default function AddToCartButton({ product }) {
  const { addItem } = useCart();

  return (
    <button
      className="btn-primary"
      onClick={() =>
        addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image_main,
        })
      }
    >
      Add to cart
    </button>
  );
}
