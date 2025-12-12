import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";

import { CartProvider } from "@/context/CartProvider";
import { WishlistProvider } from "@/context/WishlistProvider";

import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Printly",
  description: "Made layer by layer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0f1f", color: "white" }}>
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
      </body>
    </html>
  );
}
