import { createClient } from "@supabase/supabase-js";
import ProductsClient from "./ProductsClient";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 60;

export default async function ProductsPage() {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id,name").order("name"),
    supabase
      .from("products")
      .select("id,name,description,price,image_main,category_id,active")
      .eq("active", true)
      .order("name"),
  ]);

  return (
    <ProductsClient
      categories={categories ?? []}
      products={products ?? []}
    />
  );
}
