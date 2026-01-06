"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";

interface RelatedProductsProps {
  productId: string;
  categoryId: string | null;
}

export default function RelatedProducts({
  productId,
  categoryId,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      loadRelatedProducts();
    }
  }, [productId, categoryId]);

  const loadRelatedProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, image_main, category_id")
        .eq("active", true)
        .eq("category_id", categoryId)
        .neq("id", productId)
        .limit(4);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading related products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: 40,
        padding: 24,
        background: "#0f172a",
        border: "1px solid rgba(148,163,184,0.2)",
        borderRadius: 16,
      }}
    >
      <h2 style={{ fontSize: "1.3rem", marginBottom: 20 }}>You may also like</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 20,
        }}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

