"use client";

import Link from "next/link";
import { useCart } from "@/context/CartProvider";
import { useWishlist } from "@/context/WishlistProvider";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { count } = useCart();
  const { items: wishlistItems } = useWishlist();
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "blur(16px)",
        background: "rgba(10, 15, 31, 0.85)",
        borderBottom: "1px solid rgba(148,163,184,0.15)",
      }}
    >
      <nav
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* LOGO */}
        <Link
          href="/"
          style={{
            fontWeight: 800,
            fontSize: "1.1rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "#e5e7eb",
            textDecoration: "none",
          }}
        >
          <span style={{ color: "#c084fc" }}>Print</span>ly
        </Link>

        {/* NAV LINKS */}
        <div
          style={{
            display: "flex",
            gap: 18,
            fontSize: "0.95rem",
            alignItems: "center",
          }}
        >
          {[
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: "Wishlist", path: "/wishlist" },
          ].map((item) => (
            <Link
              key={item.path}
              href={item.path}
              style={{
                textDecoration: "none",
                fontWeight: 500,
                color:
                  pathname === item.path
                    ? "#c084fc"
                    : "rgba(229,231,235,0.8)",
                transition: "0.2s",
              }}
            >
              {item.name}
            </Link>
          ))}

          {/* Wishlist icon */}
          <Link
            href="/wishlist"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.9rem",
              color: "#e5e7eb",
              textDecoration: "none",
            }}
          >
            <span>♡</span>
            {wishlistItems.length > 0 && (
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#c084fc",
                  fontWeight: 600,
                }}
              >
                {wishlistItems.length}
              </span>
            )}
          </Link>
        </div>

        {/* CART ICON */}
        <Link
          href="/cart"
          style={{
            position: "relative",
            padding: "8px 14px",
            borderRadius: 999,
            background: "rgba(148,163,184,0.15)",
            border: "1px solid rgba(148,163,184,0.25)",
            color: "white",
            textDecoration: "none",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "0.25s",
          }}
        >
          🛒 Cart
          {count > 0 && (
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                background: "linear-gradient(135deg, #dc2626, #ef4444)",
                color: "white",
                borderRadius: "50%",
                padding: "0px 7px",
                fontSize: "0.75rem",
                fontWeight: 700,
                boxShadow: "0 0 0 2px rgba(10,15,31,1)",
              }}
            >
              {count}
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}
