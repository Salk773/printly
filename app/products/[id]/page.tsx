import { supabaseServer } from "@/lib/supabaseServer";
import ProductPageClient from "./ProductPageClient";

export const revalidate = 30;

export default async function ProductPage({ params }) {
  const supabase = supabaseServer();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!product) {
    return (
      <div
        style={{
          padding: "80px 20px",
          textAlign: "center",
          color: "#94a3b8",
        }}
      >
        Product not found.
      </div>
    );
  }

  return <ProductPageClient product={product} />;
}
