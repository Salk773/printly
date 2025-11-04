import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css"; // ✅ fixed path
import Navbar from "../components/Navbar"; // ✅ fixed path
import Footer from "../components/Footer"; // ✅ fixed path

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Printly — Made layer by layer.",
  description: "UAE’s first 3D printing marketplace — from creators, for creators.",
  metadataBase: new URL("https://printly.ae"),
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "Printly",
    description: "Made layer by layer.",
    url: "https://printly.ae",
    siteName: "Printly",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Printly",
    description: "Made layer by layer.",
    images: ["/og.png"],
  },
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-black text-white"}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
