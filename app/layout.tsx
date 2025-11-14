// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Printly — Made layer by layer",
  description: "UAE-based 3D printing marketplace for ready-made and custom parts.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
