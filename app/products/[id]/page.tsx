import { supabaseServer } from "../../../lib/supabaseServer";

export default async function ProductDetails({
  params,
}: {
  params: { id: string };
}) {
  const supabase = supabaseServer();
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !product)
    return (
      <main style={{ padding: "100px", textAlign: "center" }}>
        <h1>Product not found</h1>
      </main>
    );

  return (
    <main style={{ padding: "60px 40px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "40px" }}>
        <img
          src={product.image_main || "/placeholder.jpg"}
          alt={product.name}
          style={{
            width: "400px",
            borderRadius: "12px",
            objectFit: "cover",
            maxWidth: "100%",
          }}
        />
        <div style={{ flex: 1 }}>
          <h1>{product.name}</h1>
          <p style={{ color: "#aaa", margin: "20px 0" }}>
            {product.description}
          </p>
          <p style={{ fontSize: "1.5rem", color: "#c084fc", fontWeight: 700 }}>
            {product.price} AED
          </p>
        </div>
      </div>
    </main>
  );
}
