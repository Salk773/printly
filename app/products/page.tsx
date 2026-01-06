import { supabaseServer } from "@/lib/supabaseServer";
import ProductsClient from "./ProductsClient";

export const revalidate = 60;

export default async function ProductsPage() {
  const supabase = supabaseServer();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, description, price, image_main, category_id")
      .eq("active", true)   // boolean filter
      .order("name", { ascending: true }),

    supabase.from("categories").select("id, name").order("name"),
  ]);

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: 12, letterSpacing: "-0.02em" }}>
          Shop Products
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6 }}>
          Discover our curated collection of premium 3D printed products. Filter by category, price, or search for exactly what you need.
        </p>
      </div>

      <ProductsClient
        products={products || []}
        categories={categories || []}
      />
    </>
  );
}
