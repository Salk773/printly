// app/products/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  const supabase = supabaseServer();

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  // Fetch products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name");

  return (
    <ProductsClient
      products={products || []}
      categories={categories || []}
    />
  );
}
