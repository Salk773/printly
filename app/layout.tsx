import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Printly",
  description: "3D Printing Marketplace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0a0a0a",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <CartProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <Toaster position="top-center" />
        </CartProvider>
      </body>
    </html>
  );
}
