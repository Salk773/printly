// components/ProductsSearchBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface ProductsSearchBarProps {
  initialSearch: string;
}

export default function ProductsSearchBar({
  initialSearch,
}: ProductsSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialSearch);

  // When searchParams change from outside (back/forward)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
  }, [searchParams]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");

    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        marginTop: "12px",
        marginBottom: "4px",
      }}
    >
      <input
        type="text"
        placeholder="Search products by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 14px",
          borderRadius: 999,
          border: "1px solid #262637",
          background: "#0b0b10",
          color: "#f5f5ff",
          fontSize: "0.95rem",
        }}
      />
    </form>
  );
}
