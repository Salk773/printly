import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(148,163,184,0.2)",
        padding: "48px 20px 24px",
        marginTop: 80,
        background: "linear-gradient(to top, rgba(15,23,42,0.5), transparent)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 32,
          marginBottom: 32,
        }}
      >
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>
            <span style={{ color: "#c084fc" }}>Print</span>ly
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Premium 3D printing marketplace. Made layer by layer in the UAE 🇦🇪
          </p>
        </div>
        <div>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 12, color: "#e5e7eb" }}>
            Shop
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href="/products" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}>
              All Products
            </Link>
            <Link href="/products" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}>
              Featured
            </Link>
            <Link href="/wishlist" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}>
              Wishlist
            </Link>
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 12, color: "#e5e7eb" }}>
            Account
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href="/account" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}>
              My Account
            </Link>
            <Link href="/account/orders" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}>
              Orders
            </Link>
            <Link href="/cart" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}>
              Cart
            </Link>
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 12, color: "#e5e7eb" }}>
            Support
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href="/contact" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}>
              Contact Us
            </Link>
            <Link href="/account/orders" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}>
              Track Order
            </Link>
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 12, color: "#e5e7eb" }}>
            Legal
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href="/privacy" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}>
              Privacy Policy
            </Link>
            <Link href="/refund" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}>
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
      <div
        style={{
          borderTop: "1px solid rgba(148,163,184,0.15)",
          paddingTop: 24,
          textAlign: "center",
          color: "#64748b",
          fontSize: "0.85rem",
        }}
      >
        © {new Date().getFullYear()} Printly. All rights reserved.
      </div>
    </footer>
  );
}
