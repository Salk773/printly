// app/layout.tsx
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Printly",
  description: "Made layer by layer."
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0f1f", color: "white" }}>
        <CartProvider>
          <Toaster position="top-right" />

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
      </body>
    </html>
  );
}
