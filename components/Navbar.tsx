"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="nav">
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 0",
        }}
      >
        <Link href="/" aria-label="Printly home">
          <h2 style={{ color: "var(--accent)", fontWeight: 800, letterSpacing: ".2px" }}>
            Printly
          </h2>
        </Link>
        <div style={{ display: "flex", gap: 20 }}>
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="mailto:contact@printly.ae">Contact</Link>
        </div>
      </div>
    </nav>
  );
}
