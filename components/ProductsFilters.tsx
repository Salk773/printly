// components/ProductsFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

type Category = { id: string; name: string; slug: string };

interface Props {
  categories: Category[];
  initialSearch: string;
  initialCategory: string;
}

export default function ProductsFilters({
  categories,
  initialSearch,
  initialCategory,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);

  // Auto-apply when category changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (search) params.set("q", search);
    else params.delete("q");

    if (category) params.set("category", category);
    else params.delete("category");

    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (search) params.set("q", search);
    else params.delete("q");

    if (category) params.set("category", category);
    else params.delete("category");

    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  };

  return (
    <form className="filters" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Search by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-primary">
        Search
      </button>
    </form>
  );
}
