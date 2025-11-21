import "./global.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/cartContext";
import CartDrawer from "@/components/CartDrawer";

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
          background: "radial-gradient(circle at top, #020617, #020617 55%)",
          color: "#e5e7eb",
          minHeight: "100vh",
        }}
      >
        <CartProvider>
          <Navbar />
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              padding: "24px 16px 60px",
            }}
          >
            {children}
          </div>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
