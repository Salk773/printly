// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="logo">
          Printly
        </Link>

        <div className="nav-links">
          <Link
            href="/"
            className={isActive("/") ? "nav-link nav-link-active" : "nav-link"}
          >
            Home
          </Link>
          <Link
            href="/products"
            className={
              isActive("/products") ? "nav-link nav-link-active" : "nav-link"
            }
          >
            Products
          </Link>
        </div>

        <div className="nav-contact">
          <span className="nav-contact-item">contact@printly.ae</span>
          <span className="nav-contact-dot">•</span>
          <span className="nav-contact-item">+971 50 936 3626</span>
        </div>
      </div>
    </nav>
  );
}
