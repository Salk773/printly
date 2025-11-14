// app/products/[id]/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";

export const revalidate = 0;

interface Props {
  params: { id: string };
}

export default async function ProductDetailsPage({ params }: Props) {
  const supabase = supabaseAdmin();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !product) return notFound();

  return (
    <main
      style={{
        background: "#0a0a0a",
        color: "white",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>
          {product.name}
        </h1>

        {product.image_main && (
          <img
            src={product.image_main}
            alt={product.name}
            style={{
              width: "100%",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          />
        )}

        <p style={{ color: "#ccc", marginBottom: "20px", fontSize: "1.1rem" }}>
          {product.description}
        </p>

        <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#c084fc" }}>
          {product.price} AED
        </p>
      </div>
    </main>
  );
}
