import Link from "next/link";
import { supabaseServer } from "../../lib/supabaseServer";

export const revalidate = 60; // cache rebuild every minute

export default async function ProductsPage() {
  const supabase = supabaseServer();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_main, category_id")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Error loading products:", error.message);
    return <div>Error loading products</div>;
  }

  return (
    <main style={{ padding: "60px 40px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "40px" }}>All Products</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {products?.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            style={{
              background: "#111",
              borderRadius: "12px",
              padding: "20px",
              color: "#fff",
              textDecoration: "none",
              border: "1px solid #222",
            }}
          >
            <img
              src={p.image_main || "/placeholder.jpg"}
              alt={p.name}
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            />
            <h3>{p.name}</h3>
            <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
              {p.description?.slice(0, 60)}...
            </p>
            <p style={{ color: "#c084fc", fontWeight: 600 }}>{p.price} AED</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
