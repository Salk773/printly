import "./globals.css";
import type { Metadata } from "next";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";

import { AuthProvider } from "@/context/AuthProvider";
import { CartProvider } from "@/context/CartProvider";
import { WishlistProvider } from "@/context/WishlistProvider";

import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Printly",
  description: "Made layer by layer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#0a0f1f",
          color: "white",
          overflowX: "hidden",
        }}
      >
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Toaster position="top-right" />
              <SideCart />
              <Navbar />
              <main
                style={{
                  maxWidth: "1200px",
                  margin: "0 auto",
                  padding: "40px 20px",
                  minHeight: "80vh",
                }}
              >
                {children}
              </main>
              <Footer />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
