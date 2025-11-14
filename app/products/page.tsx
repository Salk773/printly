// app/products/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";

export const revalidate = 0; // always fresh

export default async function ProductsPage() {
  const supabase = supabaseAdmin();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_main")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Supabase error:", error);
    return <div>Error loading products.</div>;
  }

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
      <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>All Products</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "25px",
        }}
      >
        {products?.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            style={{
              background: "#111",
              borderRadius: "12px",
              padding: "20px",
              textDecoration: "none",
              color: "white",
              border: "1px solid #222",
            }}
          >
            {product.image_main && (
              <img
                src={product.image_main}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginBottom: "12px",
                }}
              />
            )}

            <h3 style={{ fontSize: "1.2rem" }}>{product.name}</h3>
            <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
              {product.description}
            </p>

            <p style={{ marginTop: "10px", color: "#c084fc", fontWeight: 600 }}>
              {product.price} AED
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
