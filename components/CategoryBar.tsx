// components/CategoryBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug?: string | null;
};

interface CategoryBarProps {
  categories: Category[];
  activeCategoryId: string; // "" means "All"
}

export default function CategoryBar({
  categories,
  activeCategoryId,
}: CategoryBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!id) {
      // "All" clicked → remove filter
      params.delete("category");
    } else {
      params.set("category", id);
    }

    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  };

  const renderButton = (id: string, label: string) => {
    const active = id === activeCategoryId;

    return (
      <button
        key={id || "all"}
        onClick={() => handleClick(id)}
        style={{
          borderRadius: 999,
          border: "1px solid",
          borderColor: active ? "#c084fc" : "#262637",
          padding: "6px 14px",
          fontSize: "0.9rem",
          background: active ? "rgba(192,132,252,0.12)" : "#0b0b10",
          color: active ? "#ffffff" : "#c0c0d0",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        overflowX: "auto",
        paddingBottom: "6px",
        marginTop: "12px",
        scrollbarWidth: "none",
      }}
    >
      {renderButton("", "All")}
      {categories.map((c) => renderButton(c.id, c.name))}
    </div>
  );
}
