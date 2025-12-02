import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  // Fetch product
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single(); // Ensures it returns one item

  if (error || !product) {
    console.error("Product fetch error:", error);
    return <div>Product not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

      <Image
        src={product.image}
        alt={product.name}
        width={500}
        height={500}
        className="rounded-lg border"
      />

      <p className="mt-4 text-lg">{product.description}</p>

      <p className="mt-4 text-2xl font-bold">{product.price} AED</p>
    </div>
  );
}
