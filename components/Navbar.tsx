"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { count } = useCart();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "blur(18px)",
        background:
          "linear-gradient(90deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))",
        borderBottom: "1px solid rgba(148,163,184,0.35)"
      }}
    >
      <nav
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16
        }}
      >
        {/* left */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link
            href="/"
            style={{
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontSize: "1rem"
            }}
          >
            <span style={{ color: "#c084fc" }}>PRINT</span>
            <span style={{ color: "#e5e7eb" }}>LY</span>
          </Link>

          <div
            style={{
              display: "flex",
              gap: 14,
              fontSize: "0.9rem"
            }}
          >
            <Link href="/" style={{ opacity: 0.9 }}>
              Home
            </Link>
            <Link href="/products" style={{ opacity: 0.9 }}>
              Products
            </Link>
            <Link href="/cart" style={{ opacity: 0.9 }}>
              Cart
            </Link>
          </div>
        </div>

        {/* right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: "0.85rem"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              textAlign: "right",
              lineHeight: 1.25
            }}
          >
            <a href="mailto:contact@printly.ae">contact@printly.ae</a>
            <span style={{ color: "#9ca3af" }}>+971 50 936 3626</span>
          </div>

          <Link
            href="/cart"
            style={{
              position: "relative",
              borderRadius: 999,
              padding: "8px 16px",
              border: "1px solid rgba(148,163,184,0.7)",
              background:
                "radial-gradient(circle at top left, #22d3ee33, transparent 55%)",
              fontSize: "0.85rem",
              fontWeight: 500
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
                    "linear-gradient(130deg, #fb7185, #ef4444, #f97316)",
                  color: "#fff",
                  borderRadius: 999,
                  padding: "0 7px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  boxShadow: "0 0 0 2px #020617"
                }}
              >
                {count}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}
