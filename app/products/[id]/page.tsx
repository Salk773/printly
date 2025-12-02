import Image from "next/image";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AddToCartButton from "@/components/AddToCartButton";

export const revalidate = 60;

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = supabaseServer();

  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_main, long_description")
    .eq("id", params.id)
    .maybeSingle(); // prevents silent crashes

  if (!product || error) {
    console.error("Product fetch error:", error);
    return notFound();
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2.2fr)",
        gap: 32,
        marginTop: 24,
      }}
    >
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ position: "relative", height: 420 }}>
          {product.image_main && (
            <Image
              src={product.image_main}
              alt={product.name}
              fill
              style={{ objectFit: "cover" }}
            />
          )}
        </div>
      </div>

      <div>
        <h1 style={{ fontSize: "1.6rem", marginBottom: 4 }}>{product.name}</h1>
        <p style={{ color: "#9ca3af", marginBottom: 16 }}>{product.description}</p>

        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          {product.price.toFixed(2)} AED
        </div>

        <AddToCartButton
          id={product.id}
          name={product.name}
          price={product.price}
          image={product.image_main}
        />

        <div
          className="card-soft"
          style={{ padding: 16, marginTop: 28, fontSize: "0.9rem" }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            Printing options (coming soon)
          </h3>

          {product.long_description && (
            <p style={{ color: "#9ca3af" }}>{product.long_description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
