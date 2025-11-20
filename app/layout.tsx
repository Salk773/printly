// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Printly",
  description: "UAE 3D printing marketplace – ready-made parts and decor.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="printly-body">
        <Navbar />
        <div className="page-shell">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
