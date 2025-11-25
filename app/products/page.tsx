import Image from "next/image";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import ProductsClient from "./ProductsClient";

export const revalidate = 60;

export default async function ProductsPage() {
  const supabase = supabaseServer();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, description, price, image_main, category_id")
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase.from("categories").select("id, name").order("name")
  ]);

  return (
    <>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 8 }}>Products</h1>
      <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginBottom: 24 }}>
        All ready-to-print designs. Choose a category or search by name.
      </p>

      <ProductsClient
        products={products || []}
        categories={categories || []}
      />
    </>
  );
}
