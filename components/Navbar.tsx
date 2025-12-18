"use client";

import Link from "next/link";
import { useCart } from "@/context/CartProvider";
import { useWishlist } from "@/context/WishlistProvider";
import { useAuth } from "@/context/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_EMAILS } from "@/lib/adminEmails";

export default function Navbar() {
  const {
    count,
    toggleSideCart,
    cartJustUpdated,
    isSyncing,
  } = useCart();

  const { items: wishlistItems } = useWishlist();
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin =
    !!user?.email && ADMIN_EMAILS.includes(user.email);

  /* ---------- LOGOUT ---------- */
  const handleLogout = async () => {
    await signOut();
    router.replace("/");
    router.refresh();
  };

  /* ---------- WAIT FOR AUTH ---------- */
  if (loading) {
    return (
      <header
        style={{
          height: 64,
          background: "rgba(10, 15, 31, 0.85)",
          borderBottom: "1px solid rgba(148,163,184,0.15)",
        }}
      />
    );
  }

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
              }}
            >
              {item.name}
            </Link>
          ))}

          {/* ADMIN LINK — EMAIL BASED */}
          {isAdmin && (
            <Link
              href="/admin"
              style={{
                textDecoration: "none",
                fontWeight: 600,
                color: "#22c55e",
              }}
            >
              Admin
            </Link>
          )}

          {/* WISHLIST ICON */}
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

        {/* RIGHT SIDE */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!user ? (
            <Link
              href="/auth/login"
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.25)",
                color: "#e5e7eb",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              Sign in
            </Link>
          ) : (
            <>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#94a3b8",
                  maxWidth: 140,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={user.email || ""}
              >
                {user.email}
              </span>

              <button
                onClick={handleLogout}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "transparent",
                  border: "1px solid rgba(248,113,113,0.6)",
                  color: "#f87171",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                Logout
              </button>
            </>
          )}

          {/* CART */}
          <button
            onClick={toggleSideCart}
            style={{
              position: "relative",
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(148,163,184,0.15)",
              border: "1px solid rgba(148,163,184,0.25)",
              color: "white",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              transform: cartJustUpdated ? "scale(1.12)" : "scale(1)",
            }}
          >
            🛒 Cart

            {count > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  background:
                    "linear-gradient(135deg, #dc2626, #ef4444)",
                  color: "white",
                  borderRadius: "50%",
                  padding: "0px 7px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            )}

            {isSyncing && (
              <span
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#c084fc",
                  animation: "pulse 0.8s infinite",
                }}
              />
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
