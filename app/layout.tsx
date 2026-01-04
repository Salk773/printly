import "./globals.css";
import type { Metadata } from "next";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";

import { AuthProvider } from "@/context/AuthProvider";
import { CartProvider } from "@/context/CartProvider";
import { WishlistProvider } from "@/context/WishlistProvider";

import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://printly.ae";

export const metadata: Metadata = {
  title: {
    default: "Printly - 3D Printing Marketplace",
    template: "%s | Printly",
  },
  description: "Made layer by layer. Discover unique 3D printed products and custom designs.",
  keywords: ["3D printing", "custom products", "3D printed items", "UAE", "Dubai"],
  authors: [{ name: "Printly" }],
  creator: "Printly",
  publisher: "Printly",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: siteUrl,
    siteName: "Printly",
    title: "Printly - 3D Printing Marketplace",
    description: "Made layer by layer. Discover unique 3D printed products and custom designs.",
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Printly - 3D Printing Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Printly - 3D Printing Marketplace",
    description: "Made layer by layer. Discover unique 3D printed products and custom designs.",
    images: [`${siteUrl}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
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
        <ErrorBoundary>
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
        </ErrorBoundary>
      </body>
    </html>
  );
}
