import { supabaseServer } from "../../lib/supabaseServer";
import Link from "next/link";

export default async function ProductsPage() {
  const supabase = supabaseServer();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_main, active")
    .eq("active", true);

  if (error) {
    console.error("Error fetching products:", error);
    return <div>Failed to load products.</div>;
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
      <h1 style={{ fontSize: "2.5rem", fontWeight: 700, textAlign: "center" }}>
        Our Products
      </h1>

      <div
        style={{
          marginTop: "50px",
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
              textDecoration: "none",
              color: "#fff",
              border: "1px solid #222",
              borderRadius: "12px",
              padding: "20px",
              background: "linear-gradient(145deg, #111, #1b1b1b)",
            }}
          >
            <img
              src={p.image_main || "/placeholder.png"}
              alt={p.name}
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <h3 style={{ marginTop: "15px" }}>{p.name}</h3>
            <p style={{ color: "#aaa", fontSize: "0.9rem" }}>{p.description}</p>
            <p style={{ color: "#c084fc", fontWeight: 600 }}>
              {p.price ? `${p.price} AED` : "Price on request"}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
