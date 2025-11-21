import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata = {
  title: "Printly",
  description: "Made layer by layer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
