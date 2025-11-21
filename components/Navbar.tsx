"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCart } from "@/context/CartContext";

// Dynamically load CartDrawer (no SSR)
const CartDrawer = dynamic(() => import("./CartDrawer"), { ssr: false });

export default function Navbar() {
  const { count, openCart } = useCart();

  return (
    <>
      {/* NAVBAR */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backdropFilter: "blur(16px)",
          background:
            "linear-gradient(90deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))",
          borderBottom: "1px solid rgba(148,163,184,0.25)",
        }}
      >
        <nav
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* LEFT SIDE: LOGO + LINKS */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link
              href="/"
              style={{
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontSize: "1rem",
                color: "#e5e7eb",
                textDecoration: "none",
              }}
            >
              <span style={{ color: "#c084fc" }}>Print</span>ly
            </Link>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: "0.9rem",
              }}
            >
              <Link
                href="/"
                style={{
                  color: "#e5e7eb",
                  textDecoration: "none",
                  opacity: 0.9,
                }}
              >
                Home
              </Link>

              <Link
                href="/products"
                style={{
                  color: "#e5e7eb",
                  textDecoration: "none",
                  opacity: 0.9,
                }}
              >
                Products
              </Link>

              <Link
                href="/cart"
                style={{
                  color: "#e5e7eb",
                  textDecoration: "none",
                  opacity: 0.9,
                }}
              >
                Cart
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE: CONTACT + CART BUTTON */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: "0.85rem",
              color: "#cbd5f5",
            }}
          >
            {/* Contact info */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                textAlign: "right",
                lineHeight: 1.3,
              }}
            >
              <a
                href="mailto:contact@printly.ae"
                style={{ color: "#e5e7eb", textDecoration: "none" }}
              >
                contact@printly.ae
              </a>
              <span style={{ color: "#9ca3af" }}>+971 50 936 3626</span>
            </div>

            {/* Cart Button */}
            <button
              onClick={openCart}
              style={{
                position: "relative",
                borderRadius: 999,
                padding: "8px 14px",
                border: "1px solid rgba(148,163,184,0.5)",
                background:
                  "radial-gradient(circle at top left, #22d3ee33, transparent 55%)",
                color: "#e5e7eb",
                fontSize: "0.85rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              🛒 Cart
              {count > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background:
                      "linear-gradient(135deg, #f97373, #ef4444)",
                    color: "#fff",
                    borderRadius: 999,
                    padding: "0 6px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    boxShadow: "0 0 0 2px #020617",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* CART DRAWER — always loaded but conditionally visible */}
      <CartDrawer />
    </>
  );
}
