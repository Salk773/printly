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
          <a href="mailto:contact@printly.ae" className="nav-link">
            Contact
          </a>
        </div>
      </div>
    </nav>
  );
}
