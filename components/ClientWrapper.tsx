"use client";

import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      {children}
      <Toaster position="bottom-right" />
    </CartProvider>
  );
}
