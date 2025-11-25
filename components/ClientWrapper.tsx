"use client";

import { CartProvider } from "@/context/CartContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Toaster } from "react-hot-toast";

export default function ClientWrapper({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="app-shell">
        <Navbar />
        <main className="page">{children}</main>
        <Footer />
      </div>
      <Toaster position="bottom-center" />
    </CartProvider>
  );
}
