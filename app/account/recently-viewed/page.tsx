"use client";

import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useRecentlyViewed } from "@/context/RecentlyViewedProvider";
import ProductCard from "@/components/ProductCard";

export default function RecentlyViewedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { items, clearHistory } = useRecentlyViewed();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0a0f1f",
          color: "#e5e7eb",
          padding: "40px 20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const products = items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    image_main: item.image,
    description: null,
    category_id: null,
    active: true,
  }));

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0f1f",
        color: "#e5e7eb",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Link
          href="/account"
          style={{
            color: "#9ca3af",
            fontSize: "0.9rem",
            textDecoration: "none",
            marginBottom: 20,
            display: "inline-block",
          }}
        >
          ← Back to Account
        </Link>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: 10, fontWeight: 700 }}>
              Recently Viewed
            </h1>
            <p style={{ color: "#9ca3af" }}>
              Products you've recently browsed.
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearHistory}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid rgba(239,68,68,0.3)",
                background: "transparent",
                color: "#ef4444",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Clear History
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div
            style={{
              padding: 40,
              borderRadius: 20,
              background: "#0f172a",
              border: "1px dashed rgba(148,163,184,0.4)",
              textAlign: "center",
            }}
          >
            <p style={{ marginBottom: 16, color: "#9ca3af" }}>
              No recently viewed products yet.
            </p>
            <Link
              href="/products"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #c084fc, #a855f7)",
                color: "#020617",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 22,
            }}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

