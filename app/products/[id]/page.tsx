import { supabaseServer } from "../../../lib/supabaseServer";

export default async function ProductDetails({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !product) {
    return <div style={{ color: "red", padding: "40px" }}>Product not found.</div>;
  }

  return (
    <main
      style={{
        backgroundColor: "#0a0a0a",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        padding: "60px 40px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          gap: "40px",
          flexWrap: "wrap",
        }}
      >
        <img
          src={product.image_main || "/placeholder.png"}
          alt={product.name}
          style={{
            width: "100%",
            maxWidth: "400px",
            borderRadius: "8px",
            objectFit: "cover",
          }}
        />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>{product.name}</h1>
          <p style={{ color: "#aaa", margin: "15px 0" }}>{product.description}</p>
          <p style={{ color: "#c084fc", fontWeight: 600, fontSize: "1.3rem" }}>
            {product.price ? `${product.price} AED` : "Price on request"}
          </p>
        </div>
      </div>
    </main>
  );
}
